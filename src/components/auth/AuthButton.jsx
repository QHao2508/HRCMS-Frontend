import { MSG, msg } from "../../messages/index.js";
/**
 * Nút submit đổi nhãn khi pending và ngăn gửi lặp; nhãn lấy từ bộ thông điệp.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { pending, pendingLabel = msg(MSG.DANG_XU_LY), children, disabled = false }. Các props/callback lấy từ caller.
 */
export default function AuthButton({ pending, pendingLabel = msg(MSG.DANG_XU_LY), children, disabled = false }) {
    return (
        <button type="submit" className="btn btn-primary w-100" disabled={disabled || !!pending}>
            {pending ? pendingLabel : children}
        </button>
    );
}
