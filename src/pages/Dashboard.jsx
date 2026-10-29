import { MSG, msg } from "../messages/index.js";
import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ClipboardList, HeartPulse, TriangleAlert, Users, Activity } from 'lucide-react';
import api from "../services/api.js";
import { useAuth } from "../context/useAuth.js";
import { useRegistrationResource } from "../context/useRegistrationResource.js";
import { getRoleLabel, isKnownRole, ROLES } from "../constants/roles.js";
import { getEnumLabel } from "../constants/enumLabels.js";
import { getNavigationForRole } from "../routes/navigation.js";
import { listHorses, horseSummary } from "../services/clubService.js";
import { listSessions } from "../services/trainingService.js";
import { clubTime } from "../services/displayDate.js";
import { supportLabel } from "../services/supportResources.js";
import { relativeTime } from "../services/relativeTime.js";
import { notificationSubject, notificationTarget, notificationText } from "../messages/notifications.js";
import { clubDayRange, clubLongDate, dayPeriod } from "../utils/clubDay.js";
import { HEALTH_ORDER, careTone, healthTone, sessionTone } from "../utils/statusTone.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";
import { Card, StatCard, ActionTile } from "../components/ui/Card.jsx";
import { EmptyState, ErrorState, Skeleton } from "../components/ui/States.jsx";
import { ResourceState } from "../components/WorkflowUI.jsx";
import '../style/dashboard.css';

const greetings = { morning: MSG.DASH_GREETING_MORNING, afternoon: MSG.DASH_GREETING_AFTERNOON, evening: MSG.DASH_GREETING_EVENING };
const careTypes = { Feeding: MSG.SUPPORT_FEEDING, Cleaning: MSG.SUPPORT_CLEANING, Bathing: MSG.SUPPORT_BATHING, Grooming: MSG.SUPPORT_GROOMING, WaterCheck: MSG.SUPPORT_WATER, IceBath: MSG.SUPPORT_ICE, Treatment: MSG.SUPPORT_TREATMENT };

// Ô "Cần bạn xử lý": chỉ hiện ô mà vai trò mở được màn đích (theo menu), để số đếm luôn dẫn tới việc làm được.
const todoTiles = [
    { field: 'pendingReviews', to: '/reviews', label: MSG.DASH_TODO_REVIEWS, hint: MSG.DASH_TODO_REVIEWS_HINT, tone: 'warning' },
    { field: 'overdueSessions', to: '/training/sessions', label: MSG.DASH_TODO_OVERDUE, hint: MSG.DASH_TODO_OVERDUE_HINT, tone: 'danger' },
    { field: 'openIncidents', to: '/care/incidents', label: MSG.DASH_TODO_INCIDENTS, hint: MSG.DASH_TODO_INCIDENTS_HINT, tone: 'danger' },
    { field: 'lowStockItems', to: '/inventory', label: MSG.DASH_TODO_STOCK, hint: MSG.DASH_TODO_STOCK_HINT, tone: 'info' },
    { field: 'careTasksToday', to: '/care/tasks', label: MSG.DASH_TODO_CARE, hint: MSG.DASH_TODO_CARE_HINT, tone: 'neutral', roles: [ROLES.Groom] },
];

/**
 * Tổng quan theo vai trò: việc cần xử lý, 4 chỉ số chính, lịch hôm nay, sức khỏe đàn ngựa và thông báo gần đây.
 * Mỗi khối tải riêng nên một khối lỗi không làm hỏng cả trang; số liệu luôn trong phạm vi backend cấp.
 */
export default function Dashboard() {
    const { user } = useAuth(); const known = isKnownRole(user?.role); const groom = user?.role === ROLES.Groom;
    const routes = useMemo(() => new Set(getNavigationForRole(user?.role).map(item => item.to)), [user?.role]);
    const loadStats = useCallback(() => known ? api.get('/api/dashboard').then(r => r.data) : Promise.resolve(null), [known]);
    const stats = useRegistrationResource(loadStats, { realtime: true });
    const now = new Date();
    const firstName = (user?.firstName || '').trim() || (user?.lastName || '').trim() || user?.userName || msg(MSG.CLUB_MEMBER);
    return <section aria-labelledby="dashboard-title" className="dash">
        <PageHeader id="dashboard-title" eyebrow={clubLongDate(now)} title={msg(greetings[dayPeriod(now)], { name: firstName })} actions={<StatusBadge>{getRoleLabel(user?.role)}</StatusBadge>} />
        {!known && <p role="alert">{msg(MSG.YOUR_ACCOUNT_ROLE_IS_NOT_RECOGNIZED_CONTACT_CLUB_MANAGEMENT_FOR_ASSISTAN)}</p>}
        {known && <>
            <ResourceState resource={stats} />
            {stats.data && <TodoCard data={stats.data} role={user.role} routes={routes} />}
            {stats.data && <KpiRow data={stats.data} groom={groom} routes={routes} />}
            <div className="dash-columns">
                {groom ? <CareToday /> : <ScheduleToday />}
                <HealthCard restricted={stats.data?.restrictedHorses} />
            </div>
            <RecentActivity />
        </>}
    </section>;
}

function TodoCard({ data, role, routes }) {
    const tiles = todoTiles.filter(tile => routes.has(tile.to) && (!tile.roles || tile.roles.includes(role)) && typeof data[tile.field] === 'number');
    if (!tiles.length) return null;
    const total = tiles.reduce((sum, tile) => sum + data[tile.field], 0);
    return <Card title={msg(MSG.DASH_TODO_TITLE)} action={<StatusBadge tone={total ? 'warning' : 'success'}>{msg(MSG.DASH_TODO_COUNT, { count: total })}</StatusBadge>}>
        {total ? <div className="dash-todo">{tiles.map(tile => <ActionTile key={tile.field} count={data[tile.field]} label={msg(tile.label)} hint={data[tile.field] ? msg(tile.hint) : null} to={tile.to} tone={data[tile.field] ? tile.tone : 'neutral'} />)}</div>
            : <p className="dash-muted">{msg(MSG.DASH_TODO_EMPTY)}</p>}
    </Card>;
}

function KpiRow({ data, groom, routes }) {
    const link = to => routes.has(to) ? to : undefined;
    const cards = groom
        ? [{ key: 'careTasksToday', label: msg(MSG.SUPPORT_CARE_COUNT), icon: ClipboardList, to: link('/care/tasks') },
            { key: 'horseCount', label: msg(MSG.NGUA_TRONG_PHAM_VI), icon: Users, to: link('/horses'), hint: msg(MSG.DASH_KPI_HORSES_HINT) },
            { key: 'openIncidents', label: msg(MSG.DASH_KPI_INCIDENTS), icon: TriangleAlert, to: link('/care/incidents') }]
        : [{ key: 'horseCount', label: msg(MSG.NGUA_TRONG_PHAM_VI), icon: Users, to: link('/horses'), hint: msg(MSG.DASH_KPI_HORSES_HINT) },
            { key: 'activePlans', label: msg(MSG.KE_HOACH_DANG_HOAT_DONG), icon: Activity, to: link('/training/plans'), hint: msg(MSG.DASH_KPI_PLANS_HINT) },
            { key: 'sessionsToday', label: msg(MSG.BUOI_TAP_HOM_NAY), icon: CalendarDays, to: link('/training/sessions'), hint: msg(MSG.DASH_KPI_SESSIONS_HINT) },
            { key: 'restrictedHorses', label: msg(MSG.NGUA_CO_HAN_CHE), icon: HeartPulse, hint: msg(MSG.DASH_KPI_RESTRICTED_HINT) }];
    return <section className="dash-kpis" aria-label={msg(MSG.DASH_KPI_LABEL)}>{cards.map(card => <div key={card.key} className="dashboard-kpi">
        <StatCard label={card.label} icon={card.icon} to={card.to} hint={card.hint} value={<span className="dashboard-kpi-value">{data[card.key] ?? '—'}</span>} />
    </div>)}</section>;
}

/** Danh sách buổi tập trong ngày CLB (tối đa 6), sắp theo giờ; trạng thái hiện bằng chữ và màu. */
function ScheduleToday() {
    const load = useCallback(() => listSessions({ ...clubDayRange(), page: 1, pageSize: 6 }), []);
    const resource = useRegistrationResource(load, { realtime: true });
    const items = [...(resource.data?.items || [])].sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt)));
    return <Card title={msg(MSG.DASH_SCHEDULE_TITLE)} className="dash-schedule" action={<Link to="/training/sessions">{msg(MSG.DASH_SEE_ALL)}</Link>}>
        <SectionBody resource={resource} empty={msg(MSG.DASH_SCHEDULE_EMPTY)} count={items.length}>
            <ul className="dash-rows">{items.map(item => <li key={item.id}>
                <time className="dash-time" dateTime={item.scheduledAt}>{clubTime(item.scheduledAt)}</time>
                <span className="dash-row-main"><Link to={`/training/sessions/${encodeURIComponent(item.id)}`}>{msg(MSG.DASH_SESSION_TITLE, { horse: item.horseName, type: getEnumLabel(item.trainingType) })}</Link>
                    <small>{[item.trainerName && msg(MSG.DASH_TRAINER, { name: item.trainerName }), item.riderName && msg(MSG.DASH_RIDER, { name: item.riderName })].filter(Boolean).join(' · ')}</small></span>
                <StatusBadge tone={sessionTone(item.status)}>{getEnumLabel(item.status)}</StatusBadge>
            </li>)}</ul>
        </SectionBody>
    </Card>;
}

/** Việc chăm sóc trong ngày của nhân viên chuồng; tên ngựa lấy từ danh sách ngựa trong phạm vi. */
function CareToday() {
    const load = useCallback(async () => {
        const [tasks, horses] = await Promise.all([api.get('/api/care/tasks', { params: { ...clubDayRange(), page: 1, pageSize: 6 } }).then(r => r.data), listHorses({ page: 1, pageSize: 100 })]);
        return { items: tasks.items || [], names: Object.fromEntries((horses.items || []).map(horse => [horse.id, horse.name])) };
    }, []);
    const resource = useRegistrationResource(load, { realtime: true });
    const items = [...(resource.data?.items || [])].sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt)));
    return <Card title={msg(MSG.DASH_CARE_TITLE)} className="dash-schedule" action={<Link to="/care/tasks">{msg(MSG.DASH_SEE_ALL)}</Link>}>
        <SectionBody resource={resource} empty={msg(MSG.DASH_CARE_EMPTY)} count={items.length}>
            <ul className="dash-rows">{items.map(item => <li key={item.id}>
                <time className="dash-time" dateTime={item.scheduledAt}>{clubTime(item.scheduledAt)}</time>
                <span className="dash-row-main"><strong>{msg(MSG.DASH_SESSION_TITLE, { horse: resource.data.names[item.horseId] || msg(MSG.CHUA_XAC_DINH), type: msg(careTypes[item.type] || MSG.CHUA_XAC_DINH) })}</strong>
                    {item.instructions && <small>{item.instructions}</small>}</span>
                <StatusBadge tone={careTone(item.status)}>{supportLabel(item.status)}</StatusBadge>
            </li>)}</ul>
        </SectionBody>
    </Card>;
}

/** Thanh tỉ lệ sức khỏe đàn ngựa: mỗi đoạn có chú thích bằng chữ và số, thanh chỉ để nhìn nhanh. */
function HealthCard({ restricted }) {
    const load = useCallback(() => horseSummary(), []);
    const resource = useRegistrationResource(load, { realtime: true });
    const health = resource.data?.health || {};
    const total = HEALTH_ORDER.reduce((sum, key) => sum + (health[key] || 0), 0);
    const parts = HEALTH_ORDER.map(key => ({ key, count: health[key] || 0, label: getEnumLabel(key), tone: healthTone(key) }));
    return <Card title={msg(MSG.DASH_HEALTH_TITLE)} className="dash-health" action={<Link to="/horses">{msg(MSG.DASH_HEALTH_LINK)}</Link>}>
        <SectionBody resource={resource} empty={msg(MSG.DASH_HEALTH_EMPTY)} count={total}>
            <div className="dash-health-bar" aria-hidden="true">{parts.filter(part => part.count).map(part => <span key={part.key} className={`tone-${part.tone}`} style={{ flexGrow: part.count }} />)}</div>
            <ul className="dash-health-legend">{parts.map(part => <li key={part.key}><span className={`dash-dot tone-${part.tone}`} aria-hidden="true" /><strong>{part.count}</strong>{part.label}</li>)}</ul>
            {typeof restricted === 'number' && restricted > 0 && <p className="dash-note"><HeartPulse size={16} aria-hidden="true" />{msg(MSG.DASH_HEALTH_RESTRICTED, { count: restricted })}</p>}
        </SectionBody>
    </Card>;
}

/** 5 thông báo mới nhất của chính người dùng; chỉ đọc, không đánh dấu đã đọc. */
function RecentActivity() {
    const load = useCallback(() => api.get('/api/notifications', { params: { page: 1, pageSize: 5 } }).then(r => r.data), []);
    const resource = useRegistrationResource(load, { realtime: true });
    const items = resource.data?.items || [];
    return <Card title={msg(MSG.DASH_ACTIVITY_TITLE)} className="dash-activity">
        <SectionBody resource={resource} empty={msg(MSG.DASH_ACTIVITY_EMPTY)} count={items.length}>
            <ul className="dash-rows">{items.map(item => {
                const target = notificationTarget(item); const subject = notificationSubject(item);
                const text = <>{subject && <strong>{subject}{' · '}</strong>}{notificationText(item)}</>;
                return <li key={item.id}>
                    <span className="dash-row-main">{target ? <Link to={target}>{text}</Link> : <span>{text}</span>}</span>
                    <time className="dash-ago" dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time>
                </li>;
            })}</ul>
        </SectionBody>
    </Card>;
}

function SectionBody({ resource, empty, count, children }) {
    if (resource.loading) return <Skeleton lines={3} />;
    if (resource.error) return <ErrorState message={msg(MSG.DASH_SECTION_FAILED)} onRetry={resource.reload} />;
    return count ? children : <EmptyState title={empty} />;
}
