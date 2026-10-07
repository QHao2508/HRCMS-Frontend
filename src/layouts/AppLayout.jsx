import { LayoutDashboard } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { getRoleLabel, ROLES } from "../constants/roles.js";
import { getUserDisplayName } from "../utils/userDisplay.js";
import { getNavigationForRole } from "../routes/navigation.js";
import LogoutButton from "../components/auth/LogoutButton.jsx";
import "../style/app-shell.css";

const navLabels = {
    "/dashboard": "Bảng điều khiển",
    "/registrations": "Ngựa của tôi",
    "/management/registrations": "Yêu cầu đăng ký",
    "/horses": "Hồ sơ ngựa",
};

function navigationIcon(to) {
    if (to === "/dashboard") return <LayoutDashboard size={18} strokeWidth={2} aria-hidden="true" />;
    const icon = to === "/registrations" ? "grid.svg" : "folder.svg";
    return <img src={`/figma/app-shell/${icon}`} alt="" width="18" height="18" />;
}

export default function AppLayout() {
    const { user } = useAuth();
    const navigation = getNavigationForRole(user?.role);
    const shownNavigation = user?.role === ROLES.HorseOwner
        ? [...navigation].sort((a, b) => Number(b.to === "/registrations") - Number(a.to === "/registrations"))
        : navigation;

    return (
        <div className="hrcms-app-shell">
            <a className="hrcms-app-skip" href="#main-content">Skip to main content</a>
            <header className="hrcms-app-topbar">
                <Link className="hrcms-app-brand" to="/dashboard" aria-label="HRCMS dashboard">
                    <span className="hrcms-app-brand-mark" aria-hidden="true" />
                    <span>HRCMS</span>
                </Link>
                <div className="hrcms-app-user-controls">
                    <div className="hrcms-app-user-identity">
                        <strong>{getUserDisplayName(user)}</strong>
                        <span>{getRoleLabel(user?.role)}</span>
                    </div>
                    <button className="hrcms-app-notifications" type="button" disabled
                        aria-label="Notifications unavailable" title="Notifications unavailable">
                        <img src="/figma/app-shell/bell.svg" alt="" width="18" height="18" />
                    </button>
                    <LogoutButton />
                </div>
            </header>
            <div className="hrcms-app-body">
                <aside className="hrcms-app-sidebar">
                    <nav aria-label="Main navigation">
                        <ul>
                            {shownNavigation.map((item) => (
                                <li key={item.to}>
                                    <NavLink className={({ isActive }) => `hrcms-app-nav-link${isActive ? " active" : ""}`}
                                        to={item.to} end={item.to === "/dashboard"}>
                                        {navigationIcon(item.to)}
                                        <span>{navLabels[item.to] || item.label}</span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                        {!navigation.length && <p className="hrcms-app-nav-empty">No navigation options are available for this account.</p>}
                    </nav>
                </aside>
                <main id="main-content" tabIndex={-1} className="hrcms-app-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
