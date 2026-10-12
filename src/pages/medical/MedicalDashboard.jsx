import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, ClipboardPlus, HeartPulse, Search, Stethoscope } from 'lucide-react';
import MedicalLayout from '../../components/medical/MedicalLayout.jsx';
import { getMedicalHorses } from '../../services/medicalService.js';
import { useRegistrationResource } from '../../context/useRegistrationResource.js';
import { Pagination, ResourceState, StateBadge } from '../../components/WorkflowUI.jsx';
import { MSG, msg } from '../../messages/index.js';

export default function MedicalDashboard() {
    const [page, setPage] = useState(1);
    const [form, setForm] = useState({ search: '', healthStatus: '' });
    const [filter, setFilter] = useState(form);
    const load = useCallback(() => getMedicalHorses({ page, pageSize: 20, search: filter.search || undefined, healthStatus: filter.healthStatus || undefined }), [page, filter]);
    const resource = useRegistrationResource(load, { realtime: true });
    const items = resource.data?.items || [];
    const metrics = [
        [Stethoscope, MSG.MEDICAL_WORKSPACE_PATIENTS, resource.data?.total ?? '—', MSG.MEDICAL_WORKSPACE_MATCHING, 'neutral'],
        [HeartPulse, MSG.MEDICAL_WORKSPACE_MONITORING, resource.data ? items.filter(h => h.healthStatus === 'Monitoring').length : '—', MSG.MEDICAL_WORKSPACE_ON_PAGE, 'amber'],
        [AlertTriangle, MSG.MEDICAL_WORKSPACE_ATTENTION, resource.data ? items.filter(h => ['Injured', 'Isolated'].includes(h.healthStatus)).length : '—', MSG.MEDICAL_WORKSPACE_ON_PAGE, 'red'],
    ];
    return <MedicalLayout>
        <div className="medical-page-heading-row"><div><h2 className="medical-page-title">{msg(MSG.MEDICAL_WORKSPACE_LIST)}</h2>
            <p className="medical-page-subtitle">{msg(MSG.MEDICAL_WORKSPACE_LIST_HELP)}</p></div>
            <Link className="medical-primary-button" to="/medical/examination"><ClipboardPlus size={18} aria-hidden="true" />{msg(MSG.MEDICAL_WORKSPACE_NEW_EXAM)}</Link>
        </div>
        <div className="medical-overview-metrics">{metrics.map(([Icon, key, count, description, tone]) => <section key={key} className={`medical-overview-metric ${tone}`}>
            <div><span>{msg(key)}</span><Icon size={22} aria-hidden="true" /></div><strong>{count}</strong><p>{msg(description)}</p>
        </section>)}</div>
        <section className="medical-table-card">
            <form className="medical-overview-filters" onSubmit={event => { event.preventDefault(); setFilter({ ...form, search: form.search.trim() }); setPage(1); }}>
                <label className="medical-field medical-overview-search"><span>{msg(MSG.MEDICAL_WORKSPACE_SEARCH)}</span>
                    <div className="medical-search"><Search size={18} aria-hidden="true" /><input type="search" maxLength={100} value={form.search} placeholder={msg(MSG.MEDICAL_WORKSPACE_SEARCH_PLACEHOLDER)} onChange={e => setForm({ ...form, search: e.target.value })} /></div>
                </label>
                <label className="medical-field"><span>{msg(MSG.MEDICAL_HEALTH)}</span><select value={form.healthStatus} onChange={e => setForm({ ...form, healthStatus: e.target.value })}>
                    <option value="">{msg(MSG.TAT_CA)}</option>{['Fit', 'Monitoring', 'Injured', 'Isolated'].map(status => <option key={status} value={status}>{msg(MSG['MEDICAL_WORKSPACE_' + status.toUpperCase()])}</option>)}
                </select></label><button className="medical-secondary-button" type="submit">{msg(MSG.MEDICAL_WORKSPACE_FILTER)}</button>
            </form>
            <ResourceState resource={resource} />
            {resource.data && <><div className="medical-table-wrapper"><table className="medical-table medical-overview-table">
                <thead><tr><th>{msg(MSG.MEDICAL_HORSE)}</th><th>{msg(MSG.MEDICAL_HEALTH)}</th><th>{msg(MSG.MEDICAL_WORKSPACE_ACTIONS)}</th></tr></thead>
                <tbody>{items.map(horse => <tr key={horse.id}>
                    <td><Link className="medical-patient-name" to={`/horses/${encodeURIComponent(horse.id)}`}>{horse.name}</Link><span className="medical-patient-subtitle">{horse.registrationNumber || horse.breed || msg(MSG.MEDICAL_WORKSPACE_NO_CODE)}</span></td>
                    <td><StateBadge value={horse.healthStatus} /></td>
                    <td><div className="medical-patient-actions"><Link className="medical-secondary-button" to={`/medical/examination?horseId=${encodeURIComponent(horse.id)}`}>{msg(MSG.MEDICAL_WORKSPACE_OPEN_RECORD)}<ArrowRight size={16} aria-hidden="true" /></Link>
                        <Link className="medical-text-link" to={`/medical/follow-up?horseId=${encodeURIComponent(horse.id)}`}>{msg(MSG.MEDICAL_WORKSPACE_REVIEW)}</Link></div></td>
                </tr>)}</tbody>
            </table></div>{!items.length && <div className="medical-empty-state"><Stethoscope size={30} aria-hidden="true" /><strong>{msg(MSG.MEDICAL_EMPTY)}</strong><span>{msg(MSG.MEDICAL_WORKSPACE_EMPTY_HELP)}</span></div>}
                <Pagination data={resource.data} onChange={setPage} /></>}
        </section>
        <aside className="medical-workflow-note"><ShieldNote /><div><strong>{msg(MSG.MEDICAL_WORKSPACE_PATH_TITLE)}</strong><p>{msg(MSG.MEDICAL_WORKSPACE_PATH_HELP)}</p></div></aside>
    </MedicalLayout>;
}
function ShieldNote() { return <HeartPulse size={22} aria-hidden="true" />; }
