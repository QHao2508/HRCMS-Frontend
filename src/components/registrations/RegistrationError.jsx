import { MSG, msg } from "../../messages/index.js";
/**
 * Hiển thị lỗi đã chuẩn hóa; che chi tiết server và tài nguyên riêng khi lỗi 500/403/404.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { error }. Các props/callback lấy từ caller.
 */
export default function RegistrationError({ error }) {
    if (!error) return null;
    // Only show normalized business errors, never server diagnostics or trace IDs.
    const message = error.status >= 500 ? msg(MSG.THE_SERVER_COULD_NOT_COMPLETE_THE_REQUEST_PLEASE_TRY_AGAIN)
        : error.status === 403 ? msg(MSG.YOU_DO_NOT_HAVE_PERMISSION_TO_ACCESS_THIS_REGISTRATION_OR_PERFORM_THIS_A)
            : error.status === 404 ? msg(MSG.THIS_REGISTRATION_OR_ATTACHMENT_COULD_NOT_BE_FOUND)
                : error.message || msg(MSG.UNABLE_TO_COMPLETE_THE_REQUEST_PLEASE_TRY_AGAIN);
    return <div className="alert alert-danger" role="alert">{message}</div>;
}
