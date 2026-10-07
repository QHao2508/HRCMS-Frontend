import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { isRoleAllowed } from "../constants/roles.js";
import ProtectedRoute from "./ProtectedRoute.jsx";

/**
 * Kiểm allowlist role rồi render nội dung hoặc chuyển trang không có quyền.
 * @param options0 Đối tượng destructuring: { allowedRoles, children }. Các props/callback lấy từ caller.
 */
function AuthorizedContent({ allowedRoles, children }) {
    const { user } = useAuth();
    if (!isRoleAllowed(user?.role, allowedRoles)) {
        return <Navigate to="/permission-denied" replace />;
    }
    return children ?? <Outlet />;
}

/**
 * Bao protected route bằng kiểm role; chặn role không hợp lệ mà không xóa phiên đang dùng.
 * @param options0 Đối tượng destructuring: { allowedRoles, children }. Các props/callback lấy từ caller.
 */
export default function RoleRoute({ allowedRoles, children }) {
    return (
        <ProtectedRoute>
            <AuthorizedContent allowedRoles={allowedRoles}>{children}</AuthorizedContent>
        </ProtectedRoute>
    );
}
