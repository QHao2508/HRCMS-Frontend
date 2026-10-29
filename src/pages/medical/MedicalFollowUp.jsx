import { clubDateTime, clubDateTimeInput } from '../../services/displayDate.js';
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MedicalChoiceField from '../../components/medical/MedicalChoiceField.jsx';
import { medicalCases } from '../../services/medicalCases.js';
import { medicalRecordChoices } from '../../services/medicalRecordChoices.js';
import { useMedicalPatientSelection } from '../../services/medicalPatientSelection.js';
import MedicalLayout from '../../components/medical/MedicalLayout.jsx';
import { MSG, msg } from '../../messages/index.js';
import { getInjuryStatusLabel } from '../../constants/medicalLabels.js';
import { Field, MutationState, ResourceState } from '../../components/WorkflowUI.jsx';
import { useRegistrationResource } from '../../context/useRegistrationResource.js';
import { useMutation } from '../../context/useMutation.js';
import { createMedicalFollowUp, getMedicalFollowUps, getMedicalHorses, getMedicalRecords, getMedicalRestrictions, getMedicalInjuries, getMedicalTreatments } from '../../services/medicalService.js';
import { allMedicalPages, clearanceOptions, followUpPayload } from '../../services/medicalValidation.js';

const sections = [
    ['restrictionIds', MSG.MEDICAL_CLEARANCE_RESTRICTIONS],
    ['injuryIds', MSG.MEDICAL_CLEARANCE_INJURIES],
    ['treatmentIds', MSG.MEDICAL_CLEARANCE_TREATMENTS],
];
const dateTime = clubDateTime;
const localNow = clubDateTimeInput;

const caseFields = record => ({ previousRecordId: record?.id || '', reason: record?.reason || '', symptoms: record?.symptoms || '', findings: record?.findings || '', diagnosis: record?.diagnosis || '', healthStatus: record?.healthStatus || 'Monitoring', notes: record?.notes || '' });

/** Tái khám cập nhật hồ sơ đang mở; kết luận khỏi tự đóng các mục liên quan của hồ sơ. */
export function MedicalFollowUpForm({ horseId, data, reload, initialRecordId = '' }) {
    const choices = medicalRecordChoices(data.records, data.followUps, { openOnly: true });
    const start = choices.find(choice => choice.value === initialRecordId) || choices[0];
    const [form, setForm] = useState(() => ({ ...caseFields(start?.record), examinationAt: localNow(), clearance: false, outcome: '', restrictionIds: [], injuryIds: [], treatmentIds: [] }));
    const mutation = useMutation();
    const selected = choices.find(choice => choice.value === form.previousRecordId);
    const caseIds = selected?.medicalCase.ids || new Set();
    const eligible = clearanceOptions(data, form.examinationAt);
    const linked = Object.fromEntries(Object.entries(eligible).map(([key, items]) => [key, items.filter(item => caseIds.has(item.medicalRecordId))]));
    const extra = Object.fromEntries(Object.entries(eligible).map(([key, items]) => [key, items.filter(item => !caseIds.has(item.medicalRecordId))]));
    const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
    const setValue = name => value => setForm(current => ({ ...current, [name]: value }));
    const pickCase = event => { const choice = choices.find(item => item.value === event.target.value); setForm(current => ({ ...current, ...caseFields(choice?.record), previousRecordId: event.target.value, restrictionIds: [], injuryIds: [], treatmentIds: [] })); };
    const toggle = (key, id, on) => setForm(current => ({ ...current, [key]: on ? [...current[key], id] : current[key].filter(value => value !== id) }));
    const label = item => <span>{item.reason || item.bodyLocation || item.objective}{item.status && ` · ${getInjuryStatusLabel(item.status)}`}</span>;
    return <section className="medical-table-card">
        <h2>{msg(MSG.MEDICAL_FOLLOWUP_CREATE)}</h2>
        <p className="form-text">{msg(MSG.MED_CASE_HELP)}</p>
        <MutationState mutation={mutation} reload={reload} />
        {!choices.length ? <p className="alert alert-info">{msg(MSG.MED_CASE_NONE_OPEN)}</p> :
        <form onSubmit={event => { event.preventDefault(); mutation.run(() => createMedicalFollowUp(horseId, followUpPayload(form, data)), reload, msg(MSG.MEDICAL_FOLLOWUP_SAVED)); }}>
            <fieldset disabled={mutation.pending || mutation.uncertain}>
                <div className="row g-3">
                    <Field label={msg(MSG.MED_CASE_SELECT)} name="previousRecordId" value={form.previousRecordId} onChange={pickCase} required wide
                        options={[{ value: '', label: msg(MSG.MEDICAL_SELECT_RECORD) }, ...choices.map(choice => ({ value: choice.value, label: `${choice.label} · ${msg(MSG.MED_CASE_VISITS, { count: choice.medicalCase.visits.length })}` }))]} />
                    {selected && <div className="col-12"><div className="medical-record-selection"><strong>{selected.medicalCase.first.reason || selected.record.reason || '—'}</strong></div></div>}
                    <Field label={msg(MSG.MEDICAL_EXAMINATION_AT)} name="examinationAt" type="datetime-local" value={form.examinationAt} onChange={change} required />
                    <Field label={msg(MSG.MEDICAL_HEALTH)} name="healthStatus" value={form.healthStatus} onChange={change} options={['Fit', 'Monitoring', 'Injured', 'Isolated']} />
                    <div className="col-12"><MedicalChoiceField field="symptoms" label={msg(MSG.MEDICAL_SYMPTOMS)} value={form.symptoms} onChange={setValue('symptoms')} /></div>
                    <div className="col-12"><MedicalChoiceField field="findings" label={msg(MSG.MEDICAL_FINDINGS)} value={form.findings} onChange={setValue('findings')} /></div>
                    <div className="col-12"><MedicalChoiceField field="diagnosis" label={msg(MSG.MEDICAL_DIAGNOSIS)} value={form.diagnosis} onChange={setValue('diagnosis')} /></div>
                    <Field label={msg(MSG.MEDICAL_OUTCOME)} name="outcome" value={form.outcome} onChange={change} required multiline maxLength={4000} />
                    <Field label={msg(MSG.GHI_CHU)} name="notes" value={form.notes} onChange={change} multiline maxLength={4000} />
                </div>
                <label className="d-flex gap-2 my-3"><input type="checkbox" checked={form.clearance} onChange={event => setForm(current => ({ ...current, clearance: event.target.checked, restrictionIds: [], injuryIds: [], treatmentIds: [] }))} /><strong>{msg(MSG.MED_CASE_RESOLVE)}</strong></label>
                {!form.clearance && <p className="form-text">{msg(MSG.MED_CASE_AUTO_RECOVERING)}</p>}
                {form.clearance && <div>
                    <p>{msg(MSG.MED_CASE_AUTO_CLOSE)}</p>
                    {sections.map(([key, title]) => <section key={key} className="mb-2"><h3 className="h6">{msg(title)}</h3>
                        {!linked[key].length && <p className="form-text">{msg(MSG.MEDICAL_CLEARANCE_EMPTY)}</p>}
                        {linked[key].map(item => <label key={item.id} className="d-flex gap-2 mb-1"><input type="checkbox" checked disabled readOnly />{label(item)}</label>)}
                    </section>)}
                    {sections.some(([key]) => extra[key].length) && <details className="mb-3"><summary>{msg(MSG.MED_CASE_OTHER_ITEMS)}</summary>
                        {sections.map(([key]) => extra[key].map(item => <label key={item.id} className="d-flex gap-2 mb-1"><input type="checkbox" checked={form[key].includes(item.id)} onChange={event => toggle(key, item.id, event.target.checked)} />{label(item)}</label>))}
                    </details>}
                </div>}
                <button className="medical-primary-button" disabled={!form.previousRecordId}>{msg(MSG.MEDICAL_FOLLOWUP_SAVE)}</button>
            </fieldset>
        </form>}
    </section>;
}

function FollowUpForHorse({ horseId }) {
    const load = useCallback(async () => {
        const [records, followUps, restrictions, injuries, treatments] = await Promise.all([
            getMedicalRecords, getMedicalFollowUps, getMedicalRestrictions, getMedicalInjuries, getMedicalTreatments,
        ].map(service => allMedicalPages(params => service(horseId, params))));
        return { records, followUps, restrictions, injuries, treatments };
    }, [horseId]);
    const resource = useRegistrationResource(load, { realtime: true });
    const [search] = useSearchParams();
    const cases = resource.data ? medicalCases(resource.data.records, resource.data.followUps) : [];
    return <><ResourceState resource={resource} />{resource.data && <>
        <MedicalFollowUpForm key={`${horseId}-${resource.data.followUps.length}`} horseId={horseId} data={resource.data} reload={resource.reload} initialRecordId={search.get('recordId') || ''} />
        <section className="medical-table-card"><h2>{msg(MSG.MEDICAL_FOLLOWUP_HISTORY)}</h2>
            {!resource.data.followUps.length && <p>{msg(MSG.MEDICAL_FOLLOWUP_EMPTY)}</p>}
            <div className="medical-table-wrapper" role="region" aria-label={msg(MSG.MEDICAL_FOLLOWUP_HISTORY)} tabIndex={0}><table className="medical-table"><thead><tr><th scope="col">{msg(MSG.THOI_GIAN)}</th><th scope="col">{msg(MSG.MED_CASE_COLUMN)}</th><th scope="col">{msg(MSG.MEDICAL_OUTCOME)}</th><th scope="col">{msg(MSG.MED_CASE_RESOLVE)}</th></tr></thead>
                <tbody>{resource.data.followUps.map(item => { const owner = cases.find(c => c.ids.has(item.previousRecordId) || c.ids.has(item.currentRecordId)); return <tr key={item.id}><td>{dateTime(item.createdAt)}</td><td>{owner ? `${msg(MSG.MEDICAL_RECORD_NUMBER, { number: owner.number })} · ${owner.first.reason || ''}` : '—'}</td><td>{item.outcome}</td><td>{msg(item.clearance ? MSG.CO : MSG.KHONG)}</td></tr>; })}</tbody>
            </table></div>
        </section>
    </>}</>;
}

export default function MedicalFollowUp() {
    const [selected, setSelected] = useMedicalPatientSelection();
    const load = useCallback(() => allMedicalPages(getMedicalHorses), []);
    const horses = useRegistrationResource(load);
    const horseId = selected || horses.data?.[0]?.id;
    return <MedicalLayout><h2 className="medical-page-title">{msg(MSG.MEDICAL_FOLLOWUP_TITLE)}</h2><p>{msg(MSG.MEDICAL_CLEARANCE_HELP)}</p>
        <ResourceState resource={horses} />
        {horses.data && <label className="medical-field"><span>{msg(MSG.MEDICAL_HORSE)}</span>
            <select value={horseId || ''} onChange={event => setSelected(event.target.value)} disabled={!horses.data.length}>
                {!horses.data.length && <option value="">{msg(MSG.MEDICAL_EMPTY)}</option>}
                {horses.data.map(horse => <option key={horse.id} value={horse.id}>{horse.name}</option>)}
            </select>
        </label>}
        {horseId && <FollowUpForHorse key={horseId} horseId={horseId} />}
    </MedicalLayout>;
}
