import { useEffect, useSyncExternalStore } from "react";
import { AuthContext } from "./useAuth.js";
import { login, logout, restoreSession } from "../services/authService.js";
import { getSession, subscribeSession } from "../services/sessionStore.js";

/**
 * Đăng ký theo dõi session store bằng useSyncExternalStore và khôi phục phiên một lần; cung cấp user, loading và các thao tác auth cho component.
 * Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.
 * @param options0 Đối tượng destructuring: { children }. Các props/callback lấy từ caller.
 */
export function AuthProvider({ children }) {
    const session = useSyncExternalStore(subscribeSession, getSession);

    useEffect(() => {
        void restoreSession();
    }, []);

    return (
        <AuthContext.Provider value={{
            user: session.user,
            token: session.accessToken,
            status: session.status,
            loading: session.status === "loading",
            isAuthenticated: session.status === "authenticated" && !!session.user,
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
