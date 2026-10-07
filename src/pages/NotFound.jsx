import { MSG, msg } from "../messages/index.js";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

/**
 * Trang URL không tồn tại; đưa về login/dashboard theo phiên và không hiển thị đường dẫn nhạy cảm.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function NotFound() {
    const { loading, isAuthenticated } = useAuth();
    if (loading) return <div role="status">{msg(MSG.DANG_TAI)}</div>;
    return (
        <main className="container py-4">
            <h1>{msg(MSG.PAGE_NOT_FOUND)}</h1>
            <p>{msg(MSG.THE_PAGE_YOU_REQUESTED_COULD_NOT_BE_FOUND)}</p>
            <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                {isAuthenticated ? msg(MSG.BACK_TO_DASHBOARD) : msg(MSG.BACK_TO_SIGN_IN)}
            </Link>
        </main>
    );
}
