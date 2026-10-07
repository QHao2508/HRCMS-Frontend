import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { getLoginRedirect } from "./redirects.js";

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div role="status">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate {...getLoginRedirect(location)} />;
    }

    return children ?? <Outlet />;
}

export default ProtectedRoute;
