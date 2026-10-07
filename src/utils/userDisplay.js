import { MSG, msg } from "../messages/index.js";
/**
 * Ưu tiên họ tên, rồi username và tên thành viên chung; không dùng token hoặc email làm tên hiển thị.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param user Tài khoản đã tra cứu/kiểm; response chỉ được lấy trường cho phép.
 */
export function getUserDisplayName(user) {
    const fullName = [user?.firstName, user?.lastName]
        .filter((value) => typeof value === "string" && value.trim())
        .map((value) => value.trim()).join(" ");
    return fullName || (typeof user?.userName === "string" && user.userName.trim()) || msg(MSG.CLUB_MEMBER);
}
