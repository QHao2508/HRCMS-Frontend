import { AUTH_ERROR } from "../constants/auth.js";
import { serverMessage } from "../messages/serverMessages.js";
import { MSG, msg } from "../messages/index.js";
const statusMessages = {
    400: msg(MSG.PLEASE_CHECK_THE_SUBMITTED_INFORMATION),
    401: msg(MSG.YOUR_SESSION_IS_NO_LONGER_VALID_PLEASE_SIGN_IN_AGAIN),
    403: msg(MSG.YOU_DO_NOT_HAVE_PERMISSION_TO_PERFORM_THIS_ACTION),
    404: msg(MSG.THE_REQUESTED_RESOURCE_WAS_NOT_FOUND),
    409: msg(MSG.THE_RECORD_HAS_CHANGED_OR_THIS_ACTION_IS_NOT_ALLOWED_IN_ITS_CURRENT_STAT),
    413: msg(MSG.THE_REQUEST_IS_TOO_LARGE),
    429: msg(MSG.TOO_MANY_REQUESTS_PLEASE_WAIT_BEFORE_TRYING_AGAIN),
};

/**
 * Lỗi tạm thời (408/429/5xx, timeout, mất mạng, backend/SQL đang khởi động) có thể thử lại và không có nghĩa phiên đăng nhập hết hiệu lực.
 * @param error Lỗi HTTP/network, đã hoặc chưa qua normalizeApiError.
 */
export function isTransientApiError(error) {
    const status = error?.status ?? error?.response?.status ?? null;
    if (status != null) return status === 408 || status === 429 || status >= 500;
    // No HTTP status: only axios transport failures (timeout, offline, cold start) are transient.
    return Boolean(error?.isAxiosError);
}

/**
 * Chuẩn hóa JSON/blob/lỗi mạng thành thông báo tiếng Việt theo messageKey/args của Backend, giữ status/trace/reference và mã auth có cấu trúc cho điều hướng.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param error Lỗi từ HTTP/network/ghi dữ liệu cần chuẩn hóa hoặc trình bày an toàn.
 */
export async function normalizeApiError(error) {
    let data = error.response?.data;
    // Downloads can receive a JSON error even when responseType is blob.
    if (typeof Blob !== "undefined" && data instanceof Blob) data = await data.text();
    if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { data = null; }
    }
    const details = data && typeof data === "object" ? data : {};
    const message = [details.detail, details.message, details.error?.message, details.error, details.title]
        .find((value) => typeof value === "string" && value.trim());
    error.status = error.response?.status ?? null;
    error.businessCode = typeof details.title === "string" && details.type === `urn:horseclub:error:${details.title}` ? details.title : null;
    error.authCode = Object.values(AUTH_ERROR).includes(details.error) ? details.error : null;
    error.verificationEmail = error.authCode === AUTH_ERROR.VerificationRequired && typeof details.email === "string" ? details.email : null;
    error.traceId = details.traceId ?? null;
    error.referenceId = details.referenceId ?? null;
    error.serverMessage = message ?? null;
    error.messageKey = typeof details.messageKey === "string" ? details.messageKey : null;
    error.messageArgs = Array.isArray(details.args) ? details.args : [];
    // Lỗi theo trường (nếu có) luôn hiển thị câu chung; không đưa câu tiếng Anh của server lên giao diện.
    error.validationErrors = details.errors && typeof details.errors === "object" ? Object.fromEntries(
        Object.entries(details.errors).map(([field, messages]) => [field, (Array.isArray(messages) ? messages : [messages]).map(() => msg(MSG.API_INVALID_FIELD))])
    ) : null;
    error.message = details.error === AUTH_ERROR.InvalidCredentials
        ? msg(MSG.TEN_DANG_NHAP_EMAIL_HOAC_MAT_KHAU_KHONG_DUNG)
        : error.authCode === AUTH_ERROR.VerificationRequired ? msg(MSG.ACCOUNT_VERIFICATION_REQUIRED)
        : error.authCode === AUTH_ERROR.RegistrationExpired ? msg(MSG.ACCOUNT_REGISTRATION_EXPIRED)
        : serverMessage(error.messageKey, error.messageArgs, null) || statusMessages[error.status]
            || (error.status ? msg(MSG.THE_SERVER_COULD_NOT_COMPLETE_THE_REQUEST_PLEASE_TRY_AGAIN)
                : error.code === "ECONNABORTED" ? msg(MSG.THE_REQUEST_TIMED_OUT_PLEASE_TRY_AGAIN)
                    : msg(MSG.UNABLE_TO_REACH_THE_SERVER_CHECK_YOUR_CONNECTION_AND_TRY_AGAIN));
    return error;
}
