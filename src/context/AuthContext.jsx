import { useEffect, useSyncExternalStore } from "react";
import { AuthContext } from "./useAuth.js";
import { login, logout, restoreSession } from "../services/authService.js";
import { getSession, subscribeSession } from "../services/sessionStore.js";

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
