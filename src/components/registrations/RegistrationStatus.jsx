import { statusDisplay } from "../../constants/registration.js";

/**
 * Hiển thị badge trạng thái hồ sơ bằng enum và nhãn/màu tập trung.
 * @param options0 Đối tượng destructuring: { status }. Các props/callback lấy từ caller.
 */
export default function RegistrationStatus({ status }) {
    const display = statusDisplay(status);
    return <span className={`badge text-bg-${display.color}`}>{display.label}</span>;
}
