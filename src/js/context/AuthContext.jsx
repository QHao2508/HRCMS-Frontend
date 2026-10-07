import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const savedToken = localStorage.getItem("accessToken");
            const savedUser = localStorage.getItem("user");

            if (savedToken) {
                setToken(savedToken);
            }

            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch (error) {
            console.error("Failed to restore authentication:", error);

            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        // Actually call the backend
        const authData = await authService.login(credentials);

        const { accessToken, user } = authData;

        if (!accessToken) {
            throw new Error("Login response did not contain an access token.");
        }

        localStorage.setItem("accessToken", accessToken);

        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        }

        setToken(accessToken);
        setUser(user ?? null);

        return authData;
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");

            setToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthenticated: !!token,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}