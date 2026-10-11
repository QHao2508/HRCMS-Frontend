import { useCallback, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { useRegistrationResource } from '../../context/useRegistrationResource.js';
import { MSG, msg } from '../../messages/index.js';
import { Field, PageHeading, ResourceState } from '../../components/WorkflowUI.jsx';
import { choices, supportLabel, useChoices, when } from '../../services/supportResources.js';
import { read } from '../../services/supportService.js';
import { clubToday, scheduledPayload } from '../../services/workflowHelpers.js';
const kpis = ['sessions', 'completed', 'completionRate', 'actualDistanceMetres', 'actualTimeSeconds', 'careTasks', 'completedCare', 'medicalExaminations'];
const labels = [MSG.SUPPORT_SESSIONS, MSG.SUPPORT_COMPLETED_SESSIONS, MSG.SUPPORT_COMPLETION_RATE, MSG.SUPPORT_ACTUAL_DISTANCE, MSG.SUPPORT_ACTUAL_TIME, MSG.SUPPORT_CARE_COUNT, MSG.SUPPORT_COMPLETED_CARE, MSG.SUPPORT_MEDICAL_COUNT];
export default function ReportsPage() {
    const { user } = useAuth(); const horses = useChoices('/api/horses');
    const [form, setForm] = useState({ horseId: '', from: '', to: clubToday(), groupBy: 'Day' }); const [filter, setFilter] = useState({ groupBy: 'Day' }); const [error, setError] = useState('');
    const load = useCallback(() => read('/api/reports', filter), [filter]); const resource = useRegistrationResource(load, { realtime: true });
    const update = e => setForm({ ...form, [e.target.name]: e.target.value });
    return <><PageHeading title={msg(MSG.SUPPORT_REPORTS)} /><section className="surface-card"><ResourceState resource={horses} /><form onSubmit={e => { e.preventDefault(); if (form.from && form.to && form.from > form.to) { setError(msg(MSG.SUPPORT_RANGE_INVALID)); return; } setError(''); setFilter({ horseId: form.horseId || undefined, from: form.from ? scheduledPayload(`${form.from}T00:00`) : undefined, to: form.to ? `${form.to}T23:59:59.9999999+07:00` : undefined, groupBy: form.groupBy }); }}>
        <div className="row g-3"><Field name="horseId" label={msg(MSG.MEDICAL_HORSE)} value={form.horseId} options={choices(horses.data)} onChange={update} /><Field name="from" label={msg(MSG.ADMIN_FROM)} type="date" value={form.from} onChange={update} /><Field name="to" label={msg(MSG.ADMIN_TO)} type="date" value={form.to} onChange={update} /><Field name="groupBy" label={msg(MSG.SUPPORT_GROUP_BY)} value={form.groupBy} onChange={update} options={['Day', 'Week', 'Month', 'Custom'].map((value, i) => ({ value, label: msg([MSG.SUPPORT_DAY, MSG.SUPPORT_WEEK, MSG.SUPPORT_MONTH, MSG.SUPPORT_CUSTOM][i]) }))} /></div>
        {error && <p role="alert">{error}</p>}<button className="btn btn-primary mt-3">{msg(MSG.SUPPORT_VIEW_REPORT)}</button>
    </form></section><ResourceState resource={resource} />{resource.data && <>
        <p>{when(resource.data.from)}{' — '}{when(resource.data.to)}</p>{resource.data.noData && <p>{msg(MSG.SUPPORT_EMPTY)}</p>}
        <dl className="summary-grid">{kpis.map((key, i) => resource.data.kpi[key] != null && <div className="surface-card" key={key}><dt>{msg(labels[i])}</dt><dd>{resource.data.kpi[key]}</dd></div>)}</dl>
        <ReportTable title={msg(MSG.SUPPORT_SERIES)} rows={resource.data.series} columns={['period', 'sessions', 'completed', 'plannedDistanceMetres', 'actualDistanceMetres']} labels={[MSG.SUPPORT_PERIOD, MSG.SUPPORT_SESSIONS, MSG.SUPPORT_COMPLETED_SESSIONS, MSG.SUPPORT_PLANNED_DISTANCE, MSG.SUPPORT_ACTUAL_DISTANCE]} />
        <ReportTable title={msg(MSG.SUPPORT_TRAINING)} rows={resource.data.training} columns={['horseId', 'scheduledAt', 'status', 'distanceMetres', 'target']} labels={[MSG.MEDICAL_HORSE, MSG.THOI_GIAN, MSG.TRANG_THAI, MSG.SUPPORT_PLANNED_DISTANCE, MSG.SUPPORT_TARGET]} horses={horses.data} />
        <ReportTable title={msg(MSG.SUPPORT_CARE)} rows={resource.data.care} columns={['horseId', 'scheduledAt', 'status', 'approvedPortionKg', 'actualPortionKg']} labels={[MSG.MEDICAL_HORSE, MSG.THOI_GIAN, MSG.TRANG_THAI, MSG.SUPPORT_APPROVED_PORTION, MSG.SUPPORT_ACTUAL_PORTION]} horses={horses.data} />
        {user.role === 'Veterinarian' && resource.data.clinical && <ReportTable title={msg(MSG.MEDICAL_MODULE)} rows={resource.data.clinical} columns={['horseId', 'examinationAt', 'reason', 'diagnosis']} labels={[MSG.MEDICAL_HORSE, MSG.THOI_GIAN, MSG.MEDICAL_REASON, MSG.MEDICAL_DIAGNOSIS]} horses={horses.data} />}
    </>}</>;
}
function ReportTable({ title, rows, columns, labels: headings, horses = [] }) {
    const [page, setPage] = useState(1); const pages = Math.max(1, Math.ceil(rows.length / 20)); const current = Math.min(page, pages);
    return <section className="surface-card"><h2>{title}</h2>{!rows.length && <p>{msg(MSG.SUPPORT_EMPTY)}</p>}<div className="table-responsive"><table className="table"><thead><tr>{headings.map(key => <th key={key}>{msg(key)}</th>)}</tr></thead><tbody>{rows.slice((current - 1) * 20, current * 20).map((row, index) => <tr key={row.id || `${row.period}-${index}`}>{columns.map(key => <td key={key}>{key === 'horseId' ? horses.find(h => h.id === row[key])?.name || row[key] : key === 'status' ? supportLabel(row[key]) : key.endsWith('At') ? when(row[key]) : row[key] ?? '—'}</td>)}</tr>)}</tbody></table></div>
        <nav className="pagination-row" aria-label={msg(MSG.PHAN_TRANG)}><button className="btn btn-outline-secondary" disabled={current <= 1} onClick={() => setPage(current - 1)}>{msg(MSG.TRUOC)}</button><span>{msg(MSG.PAGINATION_SUMMARY, { page: current, pages, total: rows.length })}</span><button className="btn btn-outline-secondary" disabled={current >= pages} onClick={() => setPage(current + 1)}>{msg(MSG.SAU)}</button></nav>
    </section>;
}
