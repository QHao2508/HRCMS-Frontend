import { MSG, msg } from "../messages/index.js";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { getLoginRedirect } from "./redirects.js";

/**
 * Chờ khôi phục phiên; nếu chưa đăng nhập thì giữ URL đích trong state và chuyển login.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { children }. Các props/callback lấy từ caller.
 */
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div role="status">{msg(MSG.DANG_TAI)}</div>;
    }

    if (!isAuthenticated) {
        return <Navigate {...getLoginRedirect(location)} />;
    }

    return children ?? <Outlet />;
}

export default ProtectedRoute;
