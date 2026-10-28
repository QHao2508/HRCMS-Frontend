import { MSG, msg } from "../messages/index.js";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/useAuth.js";
import { useRegistrationResource } from "../context/useRegistrationResource.js";
import { getRoleLabel,isKnownRole, ROLES } from "../constants/roles.js";
import { ArrowUpRight, CalendarDays, CheckCheck, HeartPulse, Bell, ClipboardList, Activity, Users } from 'lucide-react';
import { getUserDisplayName } from "../utils/userDisplay.js";
import { getNavigationForRole } from "../routes/navigation.js";
import { PageHeading,ResourceState } from "../components/WorkflowUI.jsx";
const cards=[['horseCount',msg(MSG.NGUA_TRONG_PHAM_VI)],['activePlans',msg(MSG.KE_HOACH_DANG_HOAT_DONG)],['sessionsToday',msg(MSG.BUOI_TAP_HOM_NAY)],['overdueSessions',msg(MSG.BUOI_TAP_QUA_HAN)],['restrictedHorses',msg(MSG.NGUA_CO_HAN_CHE)],['unreadNotifications',msg(MSG.DASHBOARD_NEW_NOTIFICATIONS)]];
const roleHints = { HorseOwner: MSG.UX_OWNER_HINT, ClubManager: MSG.UX_MANAGER_HINT, HeadTrainer: MSG.UX_HEAD_HINT, Trainer: MSG.UX_TRAINER_HINT, WorkRider: MSG.UX_RIDER_HINT, Veterinarian: MSG.UX_VET_HINT, Groom: MSG.UX_GROOM_HINT };
const priorities = { HorseOwner: ['/horses','/registrations','/training/sessions'], ClubManager: ['/reviews','/horses','/manager/staff'], HeadTrainer: ['/horses','/training/templates','/training/plans'], Trainer: ['/training/sessions','/training/plans','/horses'], WorkRider: ['/training/sessions','/care/incidents'], Veterinarian: ['/medical','/medical/follow-up','/care/tasks'], Groom: ['/care/tasks','/care/stables','/inventory/issue'] };
const metricIcons = {horseCount:Users,activePlans:Activity,sessionsToday:CalendarDays,overdueSessions:CheckCheck,restrictedHorses:HeartPulse,unreadNotifications:Bell,careTasksToday:ClipboardList};
/**
 * Hiển thị aggregate từ một endpoint và menu theo role; role lạ chỉ nhận cảnh báo/phạm vi an toàn.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function Dashboard() {
    const {user}=useAuth();const known=isKnownRole(user?.role);
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load=useCallback(()=>known ? api.get('/api/dashboard').then(r=>r.data) : Promise.resolve(null),[known]);
    const resource=useRegistrationResource(load, { realtime: true });
    const navigation = getNavigationForRole(user?.role).filter(item => item.to !== '/dashboard');
    const primary = (priorities[user?.role] || []).map(to => navigation.find(item => item.to === to)).filter(Boolean);
    const visibleCards = user?.role === ROLES.Groom ? [['careTasksToday',msg(MSG.SUPPORT_CARE_COUNT)], ...cards.filter(([key]) => ['horseCount','unreadNotifications'].includes(key))] : cards;
    return <section aria-labelledby="dashboard-title"><PageHeading id="dashboard-title" title={msg(MSG.TONG_QUAN)} description={msg(MSG.XIN_CHAO, { p0: getUserDisplayName(user) })} action={<span className="workspace-role">{getRoleLabel(user?.role)}</span>}/>
        {!known && <p role="alert">{msg(MSG.YOUR_ACCOUNT_ROLE_IS_NOT_RECOGNIZED_CONTACT_CLUB_MANAGEMENT_FOR_ASSISTAN)}</p>}
        {known && <><section className="dashboard-welcome"><div><span className="workspace-eyebrow">{msg(MSG.UX_WORKSPACE)}</span><h2>{msg(MSG.UX_ROLE_ACTIONS)}</h2><p>{msg(roleHints[user.role])}</p><span className="muted-caption">{msg(MSG.UX_SCOPE)}</span></div><div className="dashboard-priority-actions">{primary.map(item => <Link key={item.to} to={item.to}>{item.label}<ArrowUpRight size={18} aria-hidden="true"/></Link>)}</div></section>
        <ResourceState resource={resource}/>{resource.data && <div className="row g-3 mb-4 dashboard-kpis">{visibleCards.map(([field,label])=>{const Icon=metricIcons[field];return <div className="col-6 col-lg-4" key={field}><div className="surface-card h-100 m-0"><div className="dashboard-metric-heading"><span className="muted-caption">{label}</span><Icon size={20} aria-hidden="true"/></div><div className="dashboard-kpi-value">{resource.data[field] ?? '—'}</div></div></div>;})}</div>}
        <section className="surface-card"><h2>{msg(MSG.TRUY_CAP_NHANH)}</h2><div className="dashboard-quick-actions">{navigation.map(item=><Link key={item.to} className="btn btn-outline-primary" to={item.to}>{item.label}<ArrowUpRight size={16} aria-hidden="true"/></Link>)}</div></section></>}
    </section>;
}
