import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, BookOpen, Users, Activity } from "lucide-react";
import { useAuth } from "../context/useAuth.js";
import { getRoleLabel } from "../constants/roles.js";
import { getUserDisplayName } from "../utils/userDisplay.js";
import { getNavigationForRole } from "../routes/navigation.js";
import LogoutButton from "../components/auth/LogoutButton.jsx";
const icons = { "/dashboard": LayoutDashboard, "/registrations": ClipboardList, "/reviews": ClipboardList, "/horses": Users, "/training/templates": BookOpen, "/training/plans": Activity, "/training/sessions": Activity };
const labels = { Dashboard: "Tổng quan", "Horse registrations": "Yêu cầu đăng ký", "Registration review": "Duyệt hồ sơ", Horses: "Ngựa của tôi", "Training templates": "Giáo án mẫu", "Training plans": "Kế hoạch huấn luyện", "Training sessions": "Buổi tập" };
export default function AppLayout() {
    const { user } = useAuth();
    const location = useLocation();
    const navigation = getNavigationForRole(user?.role);
    return <div className={`app-shell${location.pathname.startsWith("/training") ? " training-shell" : ""}`}>
        <a className="visually-hidden-focusable" href="#main-content">Skip to main content</a>
        <header className="app-header"><Link className="brand" to="/dashboard"><span className="brand-mark" aria-hidden="true" />HRCMS</Link><div className="account-controls"><div><div className="account-name">{getUserDisplayName(user)}</div><div className="account-role">{getRoleLabel(user?.role)}</div></div><LogoutButton /></div></header>
        <div className="app-body"><aside className="app-sidebar"><nav aria-label="Main navigation"><ul className="list-unstyled">
            {navigation.map(item => { const Icon = icons[item.to] || ClipboardList; return <li key={item.to}><NavLink className="sidebar-link" to={item.to} end={item.to === "/dashboard"}><Icon size={16} aria-hidden="true" />{labels[item.label] || item.label}</NavLink></li>; })}
        </ul>{!navigation.length && <p className="text-body-secondary">No navigation options are available for this account.</p>}</nav></aside><main id="main-content" tabIndex={-1} className="app-content"><Outlet /></main></div>
    </div>;
}
