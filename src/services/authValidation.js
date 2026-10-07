import { MSG, msg } from "../messages/index.js";
// Checked-in SecurityOptions/appsettings baseline. The backend remains authoritative;
// it exposes no public policy endpoint. Keep this aligned with deployment overrides.
export const AUTH_POLICY = Object.freeze({
    passwordMinLength: 12,
    passwordMaxLength: 128,
    requireNationalId: false,
    nationalIdDigits: 12,
    resendSeconds: 60,
});

export const passwordHelp = msg(MSG.USE_CHARACTERS_INCLUDING_UPPERCASE_LOWERCASE_AND_A_DIGIT, { p0: AUTH_POLICY.passwordMinLength, p1: AUTH_POLICY.passwordMaxLength });

/**
 * Trim email và kiểm cú pháp trước khi gửi; backend vẫn là nơi quyết định hợp lệ cuối cùng.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param values Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API.
 */
export function validateEmail(values) {
    const email = values.email?.trim() || "";
    return /^[^\s@]+@[^\s@]+$/u.test(email) ? {} : { email: msg(MSG.ENTER_A_VALID_EMAIL_ADDRESS) };
}

/**
 * Kiểm giới hạn độ dài, chữ hoa/thường/số và confirmPassword theo AUTH_POLICY.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param values Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API.
 */
function validatePasswords(values) {
    const errors = {};
    const password = values.password || "";
    if (password.length < AUTH_POLICY.passwordMinLength || password.length > AUTH_POLICY.passwordMaxLength
        || !/\p{Lu}/u.test(password) || !/\p{Ll}/u.test(password) || !/\p{Nd}/u.test(password)) {
        errors.password = passwordHelp;
    }
    if (!values.confirmPassword || values.confirmPassword !== password) {
        errors.confirmPassword = msg(MSG.PASSWORDS_MUST_MATCH);
    }
    return errors;
}

/**
 * Kiểm các trường bắt buộc, username/email, mật khẩu và căn cước optional theo policy kiểm vào.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param values Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API.
 */
export function validateRegistration(values) {
    const errors = { ...validateEmail(values), ...validatePasswords(values) };
    for (const [field, label, max, min = 1] of [
        ["firstName", msg(MSG.FIRST_NAME), 100], ["lastName", msg(MSG.LAST_NAME), 100],
        ["userName", msg(MSG.USERNAME), 80, 3], ["phone", msg(MSG.PHONE), 30], ["address", msg(MSG.ADDRESS), 500],
    ]) {
        const value = values[field]?.trim() || "";
        if (value.length < min || value.length > max) errors[field] = msg(MSG.MUST_CONTAIN_CHARACTERS, { p0: label, p1: min, p2: max });
    }
    if ((values.email?.trim().length || 0) > 254) errors.email = msg(MSG.EMAIL_MUST_BE_254_CHARACTERS_OR_FEWER);
    const nationalId = values.nationalId?.trim() || "";
    if (AUTH_POLICY.requireNationalId && !nationalId) errors.nationalId = msg(MSG.NATIONAL_ID_IS_REQUIRED);
    else if (nationalId && !new RegExp(`^[0-9]{${AUTH_POLICY.nationalIdDigits}}$`).test(nationalId)) {
        errors.nationalId = msg(MSG.NATIONAL_ID_MUST_CONTAIN_EXACTLY_DIGITS, { p0: AUTH_POLICY.nationalIdDigits });
    }
    return errors;
}

/**
 * Kiểm email và đúng 6 chữ số ASCII của OTP xác thực.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param values Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API.
 */
export function validateVerification(values) {
    const errors = validateEmail(values);
    if (!/^[0-9]{6}$/.test(values.code?.trim() || "")) errors.code = msg(MSG.ENTER_THE_SIX_DIGIT_VERIFICATION_CODE);
    return errors;
}

/**
 * Kiểm email, OTP 6 chữ số và chính sách mật khẩu mới trước reset/invite.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param values Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API.
 */
export function validatePasswordSetup(values) {
    const errors = { ...validateEmail(values), ...validatePasswords(values) };
    if (!/^[0-9]{6}$/.test(values.code?.trim() || "")) errors.code = msg(MSG.NHAP_MA_OTP_GOM_6_CHU_SO_TRONG_EMAIL);
    return errors;
}

// No email or code is read from the URL; direct navigation always has an editable fallback.
/**
 * Lấy email hợp lệ về kiểu/độ dài từ router state; không đọc mật khẩu/OTP từ query URL.
 * @param state Giá trị state truyền vào getNavigationEmail; tham chiếu phần thân để xem cách dùng.
 */
export function getNavigationEmail(state) {
    return typeof state?.email === "string" && state.email.length <= 254 ? state.email : "";
}
