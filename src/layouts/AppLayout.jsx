import SystemHeader from "../components/SystemHeader.jsx";
import { MSG, msg } from "../messages/index.js";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, BookOpen, Users, Activity, ChevronDown, HeartPulse, Warehouse, PackageMinus, PackagePlus, ShieldCheck, ChartNoAxesCombined, Settings, TriangleAlert, House, Stethoscope } from "lucide-react";
import { useAuth } from "../context/useAuth.js";

import { getNavigationForRole, getNavigationGroups } from "../routes/navigation.js";

const icons = { "/dashboard": LayoutDashboard, "/registrations": ClipboardList, "/reviews": ShieldCheck, "/horses": Users, "/training/templates": BookOpen, "/training/plans": Activity, "/training/sessions": Activity, "/medical/preventive-care": HeartPulse, "/care/tasks": ClipboardList, "/care/incidents": TriangleAlert, "/care/stables": House, "/inventory": Warehouse, "/inventory/issue": PackageMinus, "/inventory/replenishments": PackagePlus, "/reports": ChartNoAxesCombined, "/manager/staff": Users, "/manager/audit": ShieldCheck, "/manager/website": Settings, "/medical": Stethoscope };
function NavigationLinks({ items }) {
    return <ul className="list-unstyled">{items.map(item => {
        const Icon = icons[item.to] || ClipboardList;
        return <li key={item.to}><NavLink className="sidebar-link" to={item.to} end={item.to === "/dashboard"}><Icon size={18} aria-hidden="true" /><span>{item.label}</span></NavLink></li>;
    })}</ul>;
}
/** Render role navigation; groups can be collapsed and the current group opens on navigation. */
export default function AppLayout() {
    const { user } = useAuth();
    const { pathname } = useLocation();
    const navigation = getNavigationForRole(user?.role);

    const groups = getNavigationGroups(navigation, user?.role);
    return <div className="app-shell">
        <a className="visually-hidden-focusable" href="#main-content">{msg(MSG.SKIP_TO_MAIN_CONTENT)}</a>
        <SystemHeader />
        <div className="app-body"><aside className="app-sidebar grouped-sidebar"><nav aria-label={msg(MSG.MAIN_NAVIGATION)}>
            {<><NavigationLinks items={navigation.filter(item => item.to === '/dashboard')} />{groups.map(group => {
                const active = group.items.some(item => pathname === item.to || pathname.startsWith(item.to + '/'));
                return <details key={`${group.id}-${pathname}`} className={`sidebar-group${active ? ' has-active' : ''}`} open={active || (pathname === '/dashboard' && group.id === 'horses')}><summary><span>{group.label}</span><ChevronDown size={16} aria-hidden="true" /></summary><NavigationLinks items={group.items} /></details>;
            })}</>}
            {!navigation.length && <p className="text-body-secondary">{msg(MSG.NO_NAVIGATION_OPTIONS_ARE_AVAILABLE_FOR_THIS_ACCOUNT)}</p>}
        </nav></aside><main id="main-content" tabIndex={-1} className="app-content"><Outlet /></main></div>
    </div>;
}