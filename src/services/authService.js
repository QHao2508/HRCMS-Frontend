import { MSG, msg } from "../messages/index.js";
import api from "./api.js";
import { clearSession, getSession, setCurrentUser, setTokens } from "./sessionStore.js";

/**
 * Gọi /me rồi kiểm profile qua session store trước khi xác nhận đăng nhập.
 * @param generation Số thế hệ phiên; chặn request muộn cập nhật phiên mới hoặc phiên đã đăng xuất.
 */
async function fetchCurrentUser(generation) {
    const { data } = await api.get("/api/auth/me");
    setCurrentUser(data, generation);
    return data;
}

/**
 * Xóa phiên cũ, gửi credentials, lưu token và lấy /me; lỗi hoặc cần xác thực không tạo phiên authenticated.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param credentials Giá trị credentials truyền vào login; tham chiếu phần thân để xem cách dùng.
 */
export async function login(credentials) {
    clearSession();
    const { generation } = getSession();
    try {
        const { data } = await api.post("/api/auth/login", credentials, { skipAuth: true });
        setTokens(data, generation);
        return await fetchCurrentUser(generation);
    } catch (error) {
        clearSession(generation);
        throw error;
    }
}

let restorationPromise = null;

/**
 * Khôi phục phiên từ token bằng /me và dùng chung promise khi StrictMode gọi lặp; lỗi thì xóa session.
 */
export function restoreSession() {
    if (restorationPromise) return restorationPromise;
    if (getSession().status !== "loading") return Promise.resolve();
    const { accessToken, generation } = getSession();
    // Share startup work across React StrictMode's repeated effect setup.
    restorationPromise = (async () => {
        try {
            if (accessToken) await fetchCurrentUser(generation);
            else clearSession(generation);
        } catch {
            clearSession(generation);
        }
    })();
    return restorationPromise;
}

/**
 * Gửi yêu cầu thu hồi phiên nếu có token, luôn xóa session local trong finally.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 */
export async function logout() {
    const { accessToken, generation } = getSession();
    try {
        if (accessToken) await api.post("/api/auth/logout");
    } finally {
        clearSession(generation);
    }
}

/**
 * Trim trường danh tính và chỉ gửi contract đăng ký chủ ngựa; giữ nguyên password, không lưu OTP/credential hay đăng nhập tự động.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param options0 Đối tượng destructuring: { firstName, lastName, userName, email, phone, address, nationalId, password, confirmPassword }. Các props/callback lấy từ caller.
 */
export async function register({ firstName, lastName, userName, email, phone, address, nationalId, password, confirmPassword }) {
    const response = await api.post("/api/auth/register", {
        firstName: firstName.trim(), lastName: lastName.trim(), userName: userName.trim(),
        email: email.trim(), phone: phone.trim(), address: address.trim(),
        nationalId: nationalId?.trim() || null, password, confirmPassword,
    }, { skipAuth: true });
    // Registration returns a profile, not tokens. Only login establishes a session.
    return response.data;
}

/**
 * Gửi email/OTP và yêu cầu verified=true mới coi là thành công; không cấp token.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { email, code }. Các props/callback lấy từ caller.
 */
export async function verifyEmail({ email, code }) {
    const { data } = await api.post("/api/auth/verify-email", { email: email.trim(), code: code.trim() }, { skipAuth: true });
    if (data?.verified !== true) {
        throw new Error(msg(MSG.WE_COULD_NOT_VERIFY_THIS_CODE_CHECK_YOUR_EMAIL_AND_CODE_OR_REQUEST_A_NEW));
    }
    return data;
}

/**
 * Gửi email tới endpoint resend và dùng phản hồi chung, không suy luận tài khoản tồn tại.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param options0 Đối tượng destructuring: { email }. Các props/callback lấy từ caller.
 */
export async function resendVerification({ email }) {
    const { data } = await api.post("/api/auth/resend-verification", { email: email.trim() }, { skipAuth: true });
    return data;
}

/**
 * Gửi email để yêu cầu OTP reset và giữ phản hồi chung cho mọi email.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param options0 Đối tượng destructuring: { email }. Các props/callback lấy từ caller.
 */
export async function forgotPassword({ email }) {
    const { data } = await api.post("/api/auth/forgot-password", { email: email.trim() }, { skipAuth: true });
    return data;
}

/**
 * Dùng contract ResetRequest chung cho reset/invite; yêu cầu changed=true và giữ tính đúng đắn của session khi request thất bại.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param path Giá trị path truyền vào submitPassword; tham chiếu phần thân để xem cách dùng.
 * @param options1 Đối tượng destructuring: { email, code, password, confirmPassword }. Các props/callback lấy từ caller.
 * @param failureMessage Giá trị failureMessage truyền vào submitPassword; tham chiếu phần thân để xem cách dùng.
 */
async function submitPassword(path, { email, code, password, confirmPassword }, failureMessage) {
    const { generation } = getSession();
    const { data } = await api.post(path, {
        email: email.trim(), code: code.trim(), password, confirmPassword,
    }, { skipAuth: true });
    if (data?.changed !== true) throw new Error(failureMessage);
    // Password changes revoke tokens on the backend; require a fresh login locally too.
    clearSession(generation);
    return data;
}

/**
 * Gửi OTP và mật khẩu mới đến endpoint Reset, không dùng link token trên URL.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export function resetPassword(request) {
    return submitPassword("/api/auth/reset-password", request,
        msg(MSG.WE_COULD_NOT_RESET_YOUR_PASSWORD_CHECK_YOUR_EMAIL_AND_CODE_OR_REQUEST_A));
}

/**
 * Gửi OTP Invite và mật khẩu tự chọn của nhân viên để kích hoạt tài khoản.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export function acceptInvitation(request) {
    return submitPassword("/api/auth/accept-invitation", request,
        msg(MSG.WE_COULD_NOT_ACCEPT_THIS_INVITATION_CHECK_YOUR_EMAIL_AND_CODE_OR_CONTACT));
}
