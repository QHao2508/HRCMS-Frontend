import { MSG, msg } from "../messages/index.js";
const storageKey = "hrcms.session";
const listeners = new Set();

/**
 * Kiểm giá trị token là chuỗi không rỗng trước khi đưa vào phiên.
 * @param value Giá trị value truyền vào isToken; tham chiếu phần thân để xem cách dùng.
 */
const isToken = (value) => typeof value === "string" && value.trim().length > 0;

/**
 * Đọc bộ token/expiry từ localStorage, bỏ dữ liệu hỏng; hồ sơ user cache không được xem là bằng chứng đăng nhập.
 */
function readStoredTokens() {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (isToken(saved?.accessToken) && isToken(saved?.refreshToken)
            && Number.isFinite(saved?.expiresAt) && saved.expiresAt > 0) {
            return {
                accessToken: saved.accessToken,
                refreshToken: saved.refreshToken,
                expiresAt: saved.expiresAt,
            };
        }
    } catch {
        // Corrupt or unavailable storage must not prevent the app from opening.
    }
    return { accessToken: null, refreshToken: null, expiresAt: null };
}

let session = {
    ...readStoredTokens(),
    user: null, // A persisted profile is never proof of authentication.
    status: "loading",
    generation: 0,
};

/**
 * Trả snapshot session hiện tại để React đọc nhất quán qua useSyncExternalStore.
 */
export const getSession = () => session;

/**
 * Đăng ký listener session và trả hàm hủy đăng ký để component không bị rò rỉ subscription.
 * @param listener Giá trị listener truyền vào subscribeSession; tham chiếu phần thân để xem cách dùng.
 */
export function subscribeSession(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * Cập nhật snapshot, lưu token an toàn theo cơ chế hiện có và báo listener; tiếp tục dùng phiên trong bộ nhớ nếu storage lỗi.
 * @param next Giá trị next truyền vào publish; tham chiếu phần thân để xem cách dùng.
 */
function publish(next) {
    session = next;
    try {
        if (session.accessToken) {
            const { accessToken, refreshToken, expiresAt, user } = session;
            localStorage.setItem(storageKey, JSON.stringify({ accessToken, refreshToken, expiresAt, user }));
        } else {
            localStorage.removeItem(storageKey);
        }
        // Discard the old scaffold's unvalidated token/profile storage.
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
    } catch {
        // Continue with an in-memory session when browser storage is unavailable.
    }
    listeners.forEach((listener) => listener());
}

/**
 * Chặn response của generation cũ cập nhật phiên sau logout hoặc một lần login khác.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param generation Số thế hệ phiên; chặn request muộn cập nhật phiên mới hoặc phiên đã đăng xuất.
 */
export function assertCurrentSession(generation) {
    if (session.generation !== generation) {
        throw new Error(msg(MSG.YOUR_SESSION_CHANGED_PLEASE_SIGN_IN_AGAIN));
    }
}

/**
 * Kiểm cấu trúc token và expiresIn, tính expiry rồi cập nhật store; chưa đánh dấu authenticated cho đến khi /me xác nhận.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param data Giá trị data truyền vào setTokens; tham chiếu phần thân để xem cách dùng.
 * @param generation Số thế hệ phiên; chặn request muộn cập nhật phiên mới hoặc phiên đã đăng xuất.
 */
export function setTokens(data, generation) {
    assertCurrentSession(generation);
    const seconds = Number(data?.expiresIn);
    const expiresAt = Date.now() + seconds * 1000;
    if (!isToken(data?.accessToken) || !isToken(data?.refreshToken)
        || !Number.isFinite(seconds) || seconds <= 0 || !Number.isFinite(expiresAt)) {
        throw new Error(msg(MSG.THE_SERVER_RETURNED_AN_INVALID_AUTHENTICATION_RESPONSE));
    }
    publish({ ...session, accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt });
}

/**
 * Chỉ xác lập authenticated khi có token cùng user đang hoạt động/đã xác thực và đúng generation.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param user Tài khoản đã tra cứu/kiểm; response chỉ được lấy trường cho phép.
 * @param generation Số thế hệ phiên; chặn request muộn cập nhật phiên mới hoặc phiên đã đăng xuất.
 */
export function setCurrentUser(user, generation) {
    assertCurrentSession(generation);
    if (!session.accessToken || !user?.id || !user.role || user.active !== true || user.emailVerified !== true) {
        throw new Error(msg(MSG.THE_SERVER_DID_NOT_RETURN_AN_ACTIVE_VERIFIED_USER));
    }
    publish({ ...session, user, status: "authenticated" });
}

/**
 * Xóa token/user và tăng generation để các request cũ không khôi phục phiên.
 * @param generation Số thế hệ phiên; chặn request muộn cập nhật phiên mới hoặc phiên đã đăng xuất.
 */
export function clearSession(generation = session.generation) {
    if (generation !== session.generation) return;
    publish({
        accessToken: null, refreshToken: null, expiresAt: null, user: null,
        status: "anonymous", generation: session.generation + 1,
    });
}
