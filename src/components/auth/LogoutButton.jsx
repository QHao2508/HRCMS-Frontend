import { MSG, msg } from "../../messages/index.js";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";

/**
 * Gọi logout rồi chuyển về login; giữ cảnh báo nếu chưa xác nhận được thu hồi phiên phía máy chủ.
 * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function LogoutButton() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [pending, setPending] = useState(false);

    /**
     * Thực hiện đăng xuất, khóa thao tác lặp và chuyển hướng cả khi request logout lỗi vì phiên local đã được xóa.
     * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
     */
    async function handleLogout() {
        if (pending) return;
        setPending(true);
        try {
            await logout();
            navigate("/login", { replace: true });
        } catch (error) {
            navigate("/login", { replace: true, state: { logoutError: error.message } });
        }
    }

    return <button className="btn btn-secondary" disabled={pending} onClick={handleLogout}>
        {pending ? msg(MSG.DANG_DANG_XUAT) : msg(MSG.DANG_XUAT)}
    </button>;
}
