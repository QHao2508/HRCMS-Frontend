import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

/**
 * Đọc AuthContext; phát hiện component bị dùng ngoài AuthProvider thay vì âm thầm giả định quyền.
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider.");
    return context;
}
