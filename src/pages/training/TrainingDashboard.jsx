import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { getEnumLabel } from '../../constants/enumLabels.js';
import { MSG, msg, UI_LOCALE } from '../../messages/index.js';
import { scheduledPayload } from '../../services/workflowHelpers.js';
import { useRegistrationResource } from '../../context/useRegistrationResource.js';
import { Field, PageHeading, ResourceState } from '../../components/WorkflowUI.jsx';
import '../../style/training-v2.css';

const dashboardMetrics = [
    ['activePlans', MSG.KE_HOACH_DANG_HOAT_DONG, 'dashboard'],
    ['sessionsToday', MSG.BUOI_TAP_HOM_NAY, 'dashboard'],
    ['completionRate', MSG.SUPPORT_COMPLETION_RATE, 'report'],
    ['restrictedHorses', MSG.NGUA_CO_HAN_CHE, 'dashboard'],
    ['overdueSessions', MSG.BUOI_TAP_QUA_HAN, 'dashboard'],
];

/** Uses the scoped Dashboard and bounded Report APIs; no KPI is derived from a paged list. */
export default function TrainingDashboard() {
    const [form, setForm] = useState({ from: '', to: '', groupBy: 'Day' });
    const [filter, setFilter] = useState({ groupBy: 'Day' });
    const [error, setError] = useState('');
    const load = useCallback(async () => {
        const [dashboard, report] = await Promise.all([
            api.get('/api/dashboard').then(response => response.data),
            api.get('/api/reports', { params: filter }).then(response => response.data),
        ]);
        return { dashboard, report };
    }, [filter]);
    const resource = useRegistrationResource(load, { realtime: true });
    const change = event => setForm({ ...form, [event.target.name]: event.target.value });
    function applyFilter(event) {
        event.preventDefault();
        if (form.from && form.to && form.from > form.to) { setError(msg(MSG.SUPPORT_RANGE_INVALID)); return; }
        setError('');
        setFilter({
            from: form.from ? scheduledPayload(`${form.from}T00:00`) : undefined,
            to: form.to ? `${form.to}T23:59:59.9999999+07:00` : undefined,
            groupBy: form.groupBy,
        });
    }
    const dashboard = resource.data?.dashboard;
    const report = resource.data?.report;
    const maxSessions = Math.max(1, ...(report?.series || []).map(point => point.sessions));
    const statusTotals = Object.entries((report?.training || []).reduce((totals, session) => ({ ...totals, [session.status]: (totals[session.status] || 0) + 1 }), {}));

    return <section className="training-page training-dashboard">
        <PageHeading title={msg(MSG.TRAINING_DASHBOARD)} description={msg(MSG.THEO_DOI_BUOI_TAP_TRONG_PHAM_VI_CUA_BAN)} />
        <section className="surface-card"><form onSubmit={applyFilter}><div className="row g-3">
            <Field name="from" label={msg(MSG.ADMIN_FROM)} type="date" value={form.from} onChange={change} />
            <Field name="to" label={msg(MSG.ADMIN_TO)} type="date" value={form.to} onChange={change} />
            <Field name="groupBy" label={msg(MSG.SUPPORT_GROUP_BY)} value={form.groupBy} onChange={change} options={['Day', 'Week', 'Month'].map((value, index) => ({ value, label: msg([MSG.SUPPORT_DAY, MSG.SUPPORT_WEEK, MSG.SUPPORT_MONTH][index]) }))} />
        </div>{error && <p role="alert" className="text-danger mt-2">{error}</p>}<button className="btn btn-primary mt-3">{msg(MSG.SUPPORT_VIEW_REPORT)}</button></form></section>
        <ResourceState resource={resource} />
        {report && <>
            <dl className="training-kpis">{dashboardMetrics.map(([field, label, source]) => <div className="training-kpi" key={field}><dt>{msg(label)}</dt><dd>{source === 'report' ? report.kpi.sessions ? `${report.kpi[field]}%` : '—' : dashboard[field]}</dd></div>)}</dl>
            <div className="training-report-grid mt-3">
                <section className="surface-card"><h2>{msg(MSG.SUPPORT_SERIES)}</h2>{report.series.length ? <div className="training-trend">{report.series.map(point => <div className="training-trend-row" key={point.period}><span>{point.period}</span><div className="training-trend-track"><span style={{ width: `${100 * point.sessions / maxSessions}%` }} /></div><strong>{point.sessions}</strong></div>)}</div> : <p className="empty-state">{msg(MSG.SUPPORT_EMPTY)}</p>}</section>
                <section className="surface-card"><h2>{msg(MSG.SUPPORT_PLANNED_DISTANCE)}{' / '}{msg(MSG.SUPPORT_ACTUAL_DISTANCE)}</h2>{report.series.length ? <div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.SUPPORT_PERIOD)}</th><th>{msg(MSG.SUPPORT_PLANNED_DISTANCE)}</th><th>{msg(MSG.SUPPORT_ACTUAL_DISTANCE)}</th></tr></thead><tbody>{report.series.map(point => <tr key={point.period}><td>{point.period}</td><td>{point.plannedDistanceMetres}</td><td>{point.actualDistanceMetres}</td></tr>)}</tbody></table></div> : <p className="empty-state">{msg(MSG.SUPPORT_EMPTY)}</p>}</section>
                <section className="surface-card"><h2>{msg(MSG.TRANG_THAI)}{' · '}{msg(MSG.SUPPORT_SESSIONS)}</h2>{statusTotals.length ? <div className="training-trend">{statusTotals.map(([status, total]) => <div className="training-trend-row" key={status}><span>{getEnumLabel(status)}</span><div className="training-trend-track"><span style={{ width: `${100 * total / report.kpi.sessions}%` }} /></div><strong>{total}</strong></div>)}</div> : <p className="empty-state">{msg(MSG.SUPPORT_EMPTY)}</p>}</section>
            </div>
            <section className="surface-card"><h2>{msg(MSG.SUPPORT_TRAINING)}</h2>{report.training.length ? <div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.THOI_GIAN)}</th><th>{msg(MSG.TRANG_THAI)}</th><th>{msg(MSG.SUPPORT_PLANNED_DISTANCE)}</th><th>{msg(MSG.SUPPORT_ACTUAL_DISTANCE)}</th><th>{msg(MSG.SUPPORT_TARGET)}</th><th /></tr></thead><tbody>{report.training.map(session => <tr key={session.id}><td>{new Date(session.scheduledAt).toLocaleString(UI_LOCALE, { timeZone: 'Asia/Ho_Chi_Minh' })}</td><td>{getEnumLabel(session.status)}</td><td>{session.distanceMetres}</td><td>{session.result?.distanceMetres ?? '—'}</td><td>{session.target}</td><td><Link className="btn btn-outline-primary" to={`/training/sessions/${session.id}`}>{msg(MSG.CHI_TIET)}</Link></td></tr>)}</tbody></table></div> : <p className="empty-state">{msg(MSG.SUPPORT_EMPTY)}</p>}</section>
        </>}
        <div className="training-safety"><strong>{msg(MSG.TRAINING_MEDICAL_CONTEXT)}</strong><p>{msg(MSG.TRAINING_MEDICAL_CONTEXT_NOTE)}</p></div>
    </section>;
}
