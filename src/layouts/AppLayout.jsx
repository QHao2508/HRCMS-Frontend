import NotificationBell from "../components/NotificationBell.jsx";
import BrandMark from "../components/BrandMark.jsx";
import { MSG, msg } from "../messages/index.js";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, BookOpen, Users, Activity } from "lucide-react";
import { useAuth } from "../context/useAuth.js";
import { getRoleLabel } from "../constants/roles.js";
import { getUserDisplayName } from "../utils/userDisplay.js";
import { getNavigationForRole } from "../routes/navigation.js";
import LogoutButton from "../components/auth/LogoutButton.jsx";
const icons = { "/dashboard": LayoutDashboard, "/registrations": ClipboardList, "/reviews": ClipboardList, "/horses": Users, "/training/templates": BookOpen, "/training/plans": Activity, "/training/sessions": Activity };
/**
 * Dựng header tài khoản, logo, menu theo role và Outlet cho màn hình quản lý; không cấp quyền chỉ dựa vào menu.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function AppLayout() {
    const { user } = useAuth();
    const location = useLocation();
    const navigation = getNavigationForRole(user?.role);
    return <div className={`app-shell${location.pathname.startsWith("/training") ? " training-shell" : ""}`}>
        <a className="visually-hidden-focusable" href="#main-content">{msg(MSG.SKIP_TO_MAIN_CONTENT)}</a>
        <header className="app-header"><Link className="brand" to="/" aria-label={msg(MSG.HRCMS_TRANG_CHU)}><BrandMark />{msg(MSG.HRCMS)}</Link><div className="account-controls"><div><div className="account-name">{getUserDisplayName(user)}</div><div className="account-role">{getRoleLabel(user?.role)}</div></div><NotificationBell /><LogoutButton /></div></header>
        <div className="app-body"><aside className="app-sidebar"><nav aria-label={msg(MSG.MAIN_NAVIGATION)}><ul className="list-unstyled">
            {navigation.map(item => { const Icon = icons[item.to] || ClipboardList; return <li key={item.to}><NavLink className="sidebar-link" to={item.to} end={item.to === "/dashboard"}><Icon size={16} aria-hidden="true" />{item.label}</NavLink></li>; })}
        </ul>{!navigation.length && <p className="text-body-secondary">{msg(MSG.NO_NAVIGATION_OPTIONS_ARE_AVAILABLE_FOR_THIS_ACCOUNT)}</p>}</nav></aside><main id="main-content" tabIndex={-1} className="app-content"><Outlet /></main></div>
    </div>;
}
