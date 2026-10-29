import '../style/workspace.css';
import '../style/shell.css';
import { MSG, msg } from "../messages/index.js";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { observeTableLabels } from "../services/tableLabels.js";
import { LayoutDashboard, ClipboardList, BookOpen, Users, Activity, HeartPulse, Warehouse, PackageMinus, PackagePlus, ShieldCheck, ChartNoAxesCombined, Settings, TriangleAlert, House, Stethoscope, Search, Menu, X, Plus, CalendarDays } from "lucide-react";
import { useAuth } from "../context/useAuth.js";
import NotificationBell from "../components/NotificationBell.jsx";
import LogoutButton from "../components/auth/LogoutButton.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import BrandLogo from "../components/BrandLogo.jsx";
import { getRoleLabel, ROLES } from "../constants/roles.js";
import { can } from "../constants/permissions.js";
import { getUserDisplayName } from "../utils/userDisplay.js";
import api from "../services/api.js";
import { containDialogFocus } from "../services/dialogFocus.js";
import { getNavigationForRole, getNavigationGroups } from "../routes/navigation.js";

const icons = { "/dashboard": LayoutDashboard, "/registrations": ClipboardList, "/reviews": ShieldCheck, "/horses": Users, "/training/templates": BookOpen, "/training/plans": Activity, "/training/sessions": CalendarDays, "/medical/preventive-care": HeartPulse, "/care/tasks": ClipboardList, "/care/incidents": TriangleAlert, "/care/stables": House, "/inventory": Warehouse, "/inventory/issue": PackageMinus, "/inventory/replenishments": PackagePlus, "/reports": ChartNoAxesCombined, "/manager/staff": Users, "/manager/audit": ShieldCheck, "/manager/website": Settings, "/medical": Stethoscope };
// Số đếm việc chờ cạnh menu, lấy từ /api/dashboard; trường chưa có ở backend thì không hiện số.
const countFields = { "/reviews": "pendingReviews", "/care/incidents": "openIncidents", "/inventory": "lowStockItems" };
const exactLinks = new Set(["/dashboard", "/inventory", "/medical"]);

/** Các thao tác "+ Tạo mới" theo vai trò; chỉ là đường dẫn tới trang có sẵn, backend vẫn kiểm quyền. */
function createActions(user) {
    const role = user?.role;
    return [
        role === ROLES.HorseOwner && { to: "/registrations/new", label: msg(MSG.WS_NEW_REGISTRATION) },
        role === ROLES.Trainer && { to: "/training/plans/new", label: msg(MSG.WS_NEW_PLAN) },
        role === ROLES.Veterinarian && { to: "/medical/examination", label: msg(MSG.WS_NEW_EXAM) },
        can(user, "incidentReport") && { to: "/care/incidents", label: msg(MSG.WS_NEW_INCIDENT) },
        [ROLES.ClubManager, ROLES.Groom].includes(role) && { to: "/inventory/replenishments", label: msg(MSG.WS_NEW_REPLENISH) },
        role === ROLES.ClubManager && { to: "/manager/staff", label: msg(MSG.WS_NEW_STAFF) },
    ].filter(Boolean);
}

function NavigationLinks({ items, counts, onNavigate }) {
    return <ul className="list-unstyled">{items.map(item => {
        const Icon = icons[item.to] || ClipboardList;
        const count = counts?.[countFields[item.to]];
        return <li key={item.to}><NavLink className="ws-nav-link" to={item.to} end={exactLinks.has(item.to)} onClick={onNavigate}>
            <Icon size={18} aria-hidden="true" /><span>{item.label}</span>
            {count > 0 && <span className="ws-nav-count" aria-label={msg(MSG.WS_PENDING_COUNT, { count })}>{count > 99 ? '99+' : count}</span>}
        </NavLink></li>;
    })}</ul>;
}

function CreateMenu({ actions }) {
    const [open, setOpen] = useState(false);
    const root = useRef(null);
    useEffect(() => {
        if (!open) return;
        const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
        const escape = event => { if (event.key === "Escape") { setOpen(false); root.current?.querySelector("button")?.focus(); } };
        document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
        return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
    }, [open]);
    if (!actions.length) return null;
    return <div className="ws-create" ref={root}>
        <button type="button" className="btn btn-primary ws-create-button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(value => !value)}><Plus size={18} aria-hidden="true" /><span>{msg(MSG.WS_CREATE)}</span></button>
        {open && <ul className="ws-create-menu" aria-label={msg(MSG.WS_CREATE_MENU)}>{actions.map(action => <li key={action.to + action.label}><Link to={action.to} onClick={() => setOpen(false)}>{action.label}</Link></li>)}</ul>}
    </div>;
}

/** Khung trang đã đăng nhập: sidebar tối (logo, tìm ngựa, menu theo nhóm, tài khoản) và thanh trên mỏng. */
export default function AppLayout() {
    const { user } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [openPath, setOpenPath] = useState(null);
    const [counts, setCounts] = useState(null);
    const [search, setSearch] = useState("");
    const sidebar = useRef(null);
    const menuOpen = openPath === pathname;
    const closeMenu = () => setOpenPath(null);
    const navigation = getNavigationForRole(user?.role);
    const current = navigation.filter(item => pathname === item.to || pathname.startsWith(item.to + '/')).sort((a,b) => b.to.length - a.to.length)[0];
    useEffect(() => observeTableLabels(document.getElementById("main-content")), []);
    useEffect(() => {
        document.title = `${current?.label || msg(MSG.HRCMS)} · ${msg(MSG.HRCMS)}`;
        // Only route changes move focus; query/filter changes must not interrupt typing.
        document.getElementById('main-content')?.focus({preventScroll:true});
        window.scrollTo({top:0,behavior:'instant'});
    }, [pathname, current?.label]);
    useEffect(() => {
        if (!user?.role) return undefined;
        let live = true;
        api.get('/api/dashboard').then(response => { if (live) setCounts(response.data || null); }).catch(() => { if (live) setCounts(null); });
        return () => { live = false; };
    }, [pathname, user?.role]);
    useEffect(() => {
        if (!menuOpen || !sidebar.current) return undefined;
        return containDialogFocus(sidebar.current, closeMenu);
    }, [menuOpen]);

    const groups = getNavigationGroups(navigation, user?.role);
    const name = getUserDisplayName(user);
    // Vùng tìm kiếm không dùng thẻ <form> để không lẫn với các form nghiệp vụ trên trang; Enter để tìm.
    function submitSearch() {
        const term = search.trim();
        navigate(term ? `/horses?search=${encodeURIComponent(term)}` : '/horses');
        closeMenu();
    }
    return <div className="app-shell ws-shell">
        <a className="visually-hidden-focusable" href="#main-content">{msg(MSG.SKIP_TO_MAIN_CONTENT)}</a>
        {menuOpen && <div className="ws-backdrop" aria-hidden="true" onClick={closeMenu} />}
        <aside ref={sidebar} className={`ws-sidebar${menuOpen ? ' is-open' : ''}`}>
            <div className="ws-brand-row">
                <Link className="ws-brand" to="/dashboard" aria-label={msg(MSG.WS_BRAND_HOME)} onClick={closeMenu}>
                    <span className="ws-brand-tile" aria-hidden="true"><BrandLogo className="ws-brand-logo" fallback={msg(MSG.WS_BRAND_INITIAL)} /></span>
                    <span className="ws-brand-text"><strong>{msg(MSG.WS_BRAND_NAME)}</strong><small>{msg(MSG.WS_BRAND_SUB)}</small></span>
                </Link>
                <button type="button" className="ws-icon-button ws-close" aria-label={msg(MSG.WS_CLOSE_MENU)} onClick={closeMenu}><X size={20} aria-hidden="true" /></button>
            </div>
            <div className="ws-search" role="search">
                <label className="visually-hidden" htmlFor="ws-search-input">{msg(MSG.WS_SEARCH_LABEL)}</label>
                <Search size={16} aria-hidden="true" />
                <input id="ws-search-input" type="search" value={search} placeholder={msg(MSG.WS_SEARCH_PLACEHOLDER)} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); submitSearch(); } }} />
            </div>
            <nav id="workflow-navigation" className="ws-nav" aria-label={msg(MSG.MAIN_NAVIGATION)}>
                <NavigationLinks items={navigation.filter(item => item.to === '/dashboard')} counts={counts} onNavigate={closeMenu} />
                {groups.map(group => <div key={group.id} className="ws-nav-group"><p className="ws-nav-group-label">{group.label}</p><NavigationLinks items={group.items} counts={counts} onNavigate={closeMenu} /></div>)}
                {!navigation.length && <p className="ws-nav-empty">{msg(MSG.NO_NAVIGATION_OPTIONS_ARE_AVAILABLE_FOR_THIS_ACCOUNT)}</p>}
            </nav>
            <div className="ws-account" aria-label={msg(MSG.WS_ACCOUNT)}>
                <Avatar name={name} />
                <span className="ws-account-text"><strong title={name}>{name}</strong><small title={getRoleLabel(user?.role)}>{getRoleLabel(user?.role)}</small></span>
                <LogoutButton />
            </div>
        </aside>
        <div className="ws-main">
            <header className="ws-topbar">
                <button type="button" className="ws-icon-button ws-menu-toggle" aria-label={msg(MSG.WS_OPEN_MENU)} aria-controls="workflow-navigation" aria-expanded={menuOpen} onClick={() => setOpenPath(menuOpen ? null : pathname)}><Menu size={20} aria-hidden="true" /></button>
                <nav className="ws-breadcrumb" aria-label={msg(MSG.WS_BREADCRUMB)}>
                    <Link to="/dashboard">{msg(MSG.WS_BRAND_NAME)}</Link><span aria-hidden="true">{msg(MSG.SYMBOL_SLASH)}</span><strong aria-current="page">{current?.label || msg(MSG.HRCMS)}</strong>
                </nav>
                <div className="ws-topbar-actions"><NotificationBell /><CreateMenu actions={createActions(user)} /></div>
            </header>
            <main id="main-content" tabIndex={-1} className="app-content"><Outlet /></main>
        </div>
    </div>;
}
