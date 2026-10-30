import { statusDisplay } from "../../constants/registration.js";
import { registrationTone } from "../../utils/statusTone.js";
import StatusBadge from "../ui/StatusBadge.jsx";

/**
 * Nhãn trạng thái hồ sơ đăng ký: chữ lấy từ catalog, tông màu theo trạng thái (Chờ duyệt xanh dương, Cần chỉnh sửa vàng, Đã duyệt xanh lá).
 * @param options0 { status }: enum từ API.
 */
export default function RegistrationStatus({ status }) {
    return <StatusBadge tone={registrationTone(status)} dot>{statusDisplay(status).label}</StatusBadge>;
}
