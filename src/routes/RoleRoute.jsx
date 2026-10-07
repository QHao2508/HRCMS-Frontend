import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { isRoleAllowed } from "../constants/roles.js";
import ProtectedRoute from "./ProtectedRoute.jsx";

function AuthorizedContent({ allowedRoles, children }) {
    const { user } = useAuth();
    if (!isRoleAllowed(user?.role, allowedRoles)) {
        return <Navigate to="/permission-denied" replace />;
    }
    return children ?? <Outlet />;
}

export default function RoleRoute({ allowedRoles, children }) {
    return (
        <ProtectedRoute>
            <AuthorizedContent allowedRoles={allowedRoles}>{children}</AuthorizedContent>
        </ProtectedRoute>
    );
}
