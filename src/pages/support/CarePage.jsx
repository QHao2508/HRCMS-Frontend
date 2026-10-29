import { treatmentFrequency } from "../../services/treatmentFrequency.js";
import { Link, useSearchParams } from 'react-router-dom';
import { activeTreatmentPlans } from '../../services/careUi.js';
import { can } from '../../constants/permissions.js';
import { useCallback, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { useRegistrationResource } from '../../context/useRegistrationResource.js';
import { MSG, msg } from '../../messages/index.js';
import { Field, PageHeading, ResourceState } from '../../components/WorkflowUI.jsx';
import { HorseSelect, SupportForm, SupportTable } from '../../components/SupportUI.jsx';
import { choices, supportLabel, useChoices, usePaged, when, supportTone } from '../../services/supportResources.js';
import { change, id, read } from '../../services/supportService.js';
import { localDateTime, scheduledPayload } from '../../services/workflowHelpers.js';
const types = { Feeding: 'SUPPORT_FEEDING', Cleaning: 'SUPPORT_CLEANING', Bathing: 'SUPPORT_BATHING', Grooming: 'SUPPORT_GROOMING', WaterCheck: 'SUPPORT_WATER', IceBath: 'SUPPORT_ICE', Treatment: 'SUPPORT_TREATMENT' };
const label = value => msg(MSG[types[value]] || MSG.CHUA_XAC_DINH);
export default function CarePage() {
    const { user } = useAuth(); const horses = useChoices('/api/horses'); const [params] = useSearchParams(); const [horseId, setHorseId] = useState(() => params.get('horseId') || '');
    return <><PageHeading title={msg(MSG.SUPPORT_CARE)} /><HorseSelect resource={horses} value={horseId} onChange={setHorseId} optional />
        <CareList key={horseId} horseId={horseId} user={user} horses={horses.data || []} /></>;
}
function CareList({ horseId, user, horses }) {
    const [status, setStatus] = useState(''); const [dates, setDates] = useState({ from: '', to: '' });
    const resource = usePaged('/api/care/tasks', { horseId: horseId || undefined, status: status || undefined, from: dates.from ? scheduledPayload(`${dates.from}T00:00`) : undefined, to: dates.to ? `${dates.to}T23:59:59.9999999+07:00` : undefined });
    const [selected, setSelected] = useState(null);
    return <><section className="surface-card"><div className="row g-3"><Field name="status" label={msg(MSG.TRANG_THAI)} value={status} onChange={e => { setStatus(e.target.value); resource.setPage(1); }} options={['', 'Pending', 'InProgress', 'Completed', 'Skipped', 'IssueReported'].map(value => ({ value, label: value ? supportLabel(value) : msg(MSG.TAT_CA) }))} />{['from', 'to'].map(name => <Field key={name} name={name} label={msg(name === 'from' ? MSG.ADMIN_FROM : MSG.ADMIN_TO)} type="date" value={dates[name]} onChange={e => { setDates({ ...dates, [name]: e.target.value }); resource.setPage(1); }} />)}</div></section>
        {horseId && can(user, 'careAssign') && <CareCreate key={horseId} horseId={horseId} role={user.role} reload={resource.reload} />}
        <SupportTable tableClassName="table care-task-table" resource={resource} columns={[{ key: 'horseId', label: msg(MSG.MEDICAL_HORSE), render: row => horses.find(h => h.id === row.horseId)?.name || msg(MSG.CHUA_CO_THONG_TIN) }, { key: 'type', label: msg(MSG.SUPPORT_TYPE), render: row => label(row.type) }, { key: 'scheduledAt', label: msg(MSG.THOI_GIAN), render: row => when(row.scheduledAt) }, { key: 'status', label: msg(MSG.TRANG_THAI), render: row => <span className={`badge status-pill ${supportTone(row.status)}`}>{supportLabel(row.status)}</span> }, { key: 'approvedPortionKg', label: msg(MSG.SUPPORT_APPROVED_PORTION) }, { key: 'actualPortionKg', label: msg(MSG.SUPPORT_ACTUAL_PORTION) }, { key: 'instructions', label: msg(MSG.SUPPORT_INSTRUCTIONS) }, { key: 'notes', label: msg(MSG.GHI_CHU) }]} actions={user.role === 'Groom' ? row => row.groomId === user.id && ['Pending', 'InProgress'].includes(row.status) && <button className="btn btn-outline-primary" onClick={() => setSelected(row)}>{msg(MSG.SUPPORT_RECORD)}</button> : undefined} />
        {selected && <SupportForm key={selected.id} title={label(selected.type)} initial={{ status: 'Completed', actualPortionKg: '', notes: '' }} reload={() => { setSelected(null); resource.reload(); }} submit={f => change(`/api/care/tasks/${id(selected.id)}/record`, { ...f, actualPortionKg: f.actualPortionKg === '' ? null : Number(f.actualPortionKg) })} fields={f => [
            { name: 'status', label: msg(MSG.TRANG_THAI), options: ['InProgress', 'Completed', 'Skipped', 'IssueReported'].map(value => ({ value, label: supportLabel(value) })), required: true },
            ...(selected.type === 'Feeding' ? [{ name: 'actualPortionKg', label: msg(MSG.SUPPORT_ACTUAL_PORTION), type: 'number', min: 0, max: 100, step: '0.01', required: f.status === 'Completed' }] : []),
            { name: 'notes', label: msg(MSG.GHI_CHU), multiline: true, required: true, maxLength: 4000 },
        ]} />}
    </>;
}
// Phác đồ đã có hướng dẫn: ghép hướng dẫn + thuốc + tần suất để vet không phải nhập lại.
const planInstructions = plan => [plan.instructions, plan.medication, treatmentFrequency(plan.frequency)].map(x => (x || '').trim()).filter(Boolean).join(' · ').slice(0, 4000);
function CareCreate({ horseId, role, reload }) {
    const load = useCallback(() => read(`/api/horses/${id(horseId)}`), [horseId]); const profile = useRegistrationResource(load);
    const directory = useChoices('/api/staff/directory', { role: 'Groom' });
    const treatments = useChoices(role === 'Veterinarian' ? `/api/horses/${id(horseId)}/medical/treatments` : null);
    const activePlans = activeTreatmentPlans(treatments.data || []);
    const allowed = role === 'Veterinarian' ? ['Treatment', 'IceBath'] : ['Feeding', 'Cleaning', 'Bathing', 'Grooming', 'WaterCheck'];
    const assigned = new Set(profile.data?.assignments?.filter(a => a.active && a.role === 'Groom').map(a => a.staffId));
    const grooms = directory.data?.filter(g => assigned.has(g.id)).map(g => ({ id: g.id, name: [g.firstName, g.lastName].filter(Boolean).join(' ') })) || [];
    return <><ResourceState resource={profile} /><ResourceState resource={directory} />{role === 'Veterinarian' && <ResourceState resource={treatments} />}{role === 'Veterinarian' && treatments.data && <section className="surface-card">{!activePlans.length && <p role="status">{msg(treatments.data.length ? MSG.CARE_ALL_TREATMENTS_COMPLETED : MSG.CARE_NO_ACTIVE_TREATMENT)}</p>}<div className="inline-actions"><Link className="btn btn-outline-primary" to={`/medical/treatment?horseId=${id(horseId)}`}>{msg(MSG.CARE_OPEN_TREATMENTS)}</Link><button className="btn btn-outline-secondary" type="button" onClick={treatments.reload} disabled={treatments.loading}>{msg(MSG.TAI_LAI)}</button></div></section>}{profile.data && (role !== 'Veterinarian' || treatments.data) && directory.data && <SupportForm submitLabel={msg(MSG.SUPPORT_ASSIGN_CARE)} derive={(next, name) => { if (name !== 'treatmentPlanId' && name !== 'type') return next; const plan = next.type === 'Treatment' && activePlans.find(item => item.id === next.treatmentPlanId); return plan ? { ...next, instructions: planInstructions(plan) } : next; }} submitDisabled={f => f.type === 'Treatment' && !activePlans.some(plan => plan.id === f.treatmentPlanId)} title={msg(MSG.SUPPORT_ASSIGN_CARE)} initial={{ groomId: '', type: allowed[0], scheduledAt: localDateTime(new Date()), treatmentPlanId: '', instructions: '', approvedPortionKg: '' }} reload={reload} submit={f => change('/api/care/tasks', { ...f, horseId, scheduledAt: scheduledPayload(f.scheduledAt), treatmentPlanId: f.type === 'Treatment' ? f.treatmentPlanId : null, approvedPortionKg: f.type === 'Feeding' ? Number(f.approvedPortionKg) : null })} fields={f => [
        { name: 'groomId', label: msg(MSG.SUPPORT_GROOM), options: choices(grooms), required: true }, { name: 'type', label: msg(MSG.SUPPORT_TYPE), options: allowed.map(value => ({ value, label: label(value) })), required: true },
        { name: 'scheduledAt', label: msg(MSG.THOI_GIAN), type: 'datetime-local', required: true },
        ...(f.type === 'Feeding' ? [{ name: 'approvedPortionKg', label: msg(MSG.SUPPORT_APPROVED_PORTION), type: 'number', min: 0, max: 100, step: '0.01', required: true }] : []),
        ...(f.type === 'Treatment' ? [{ name: 'treatmentPlanId', label: msg(MSG.SUPPORT_TREATMENT), options: choices(activePlans, 'objective'), required: true, disabled: !activePlans.length, help: !activePlans.length ? msg(MSG.CARE_NO_ACTIVE_TREATMENT) : undefined }] : []),
        { name: 'instructions', label: msg(MSG.SUPPORT_INSTRUCTIONS), multiline: true, required: true, maxLength: 4000, help: f.type === 'Treatment' && f.treatmentPlanId ? msg(MSG.CARE_TREATMENT_AUTOFILL) : undefined },
    ]} />}</>;
}
