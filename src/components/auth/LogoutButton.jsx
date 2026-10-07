import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";

export default function LogoutButton() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [pending, setPending] = useState(false);

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
        {pending ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>;
}
