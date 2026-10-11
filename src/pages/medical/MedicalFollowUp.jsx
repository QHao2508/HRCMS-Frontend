import { useCallback, useState } from 'react';
import MedicalLayout from '../../components/medical/MedicalLayout.jsx';
import { MSG, msg, UI_LOCALE } from '../../messages/index.js';
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
const dateTime = value => new Date(value).toLocaleString(UI_LOCALE, { timeZone: 'Asia/Ho_Chi_Minh' });
function localNow() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }

export function MedicalFollowUpForm({ horseId, data, reload }) {
    const [form, setForm] = useState(() => ({ previousRecordId: data.records[0]?.id || '', examinationAt: localNow(), reason: '', symptoms: '', findings: '', diagnosis: '', healthStatus: 'Monitoring', notes: '', clearance: false, outcome: '', restrictionIds: [], injuryIds: [], treatmentIds: [] }));
    const mutation = useMutation();
    const eligible = clearanceOptions(data, form.examinationAt);
    const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
    const toggle = (key, id, selected) => setForm(current => ({ ...current, [key]: selected ? [...current[key], id] : current[key].filter(value => value !== id) }));
    return <section className="medical-table-card">
        <h2>{msg(MSG.MEDICAL_FOLLOWUP_CREATE)}</h2>
        <MutationState mutation={mutation} reload={reload} />
        <form onSubmit={event => { event.preventDefault(); mutation.run(() => createMedicalFollowUp(horseId, followUpPayload(form, data)), reload, msg(MSG.MEDICAL_FOLLOWUP_SAVED)); }}>
            <fieldset disabled={mutation.pending || mutation.uncertain}>
                <div className="row g-3">
                    <Field label={msg(MSG.MEDICAL_PREVIOUS_RECORD)} name="previousRecordId" value={form.previousRecordId} onChange={change} required
                        options={[{ value: '', label: msg(MSG.MEDICAL_SELECT_RECORD) }, ...data.records.map(record => ({ value: record.id, label: `${dateTime(record.examinationAt)} · ${record.diagnosis}` }))]} />
                    <Field label={msg(MSG.MEDICAL_EXAMINATION_AT)} name="examinationAt" type="datetime-local" value={form.examinationAt} onChange={change} required />
                    {[["reason", MSG.MEDICAL_REASON], ["symptoms", MSG.MEDICAL_SYMPTOMS], ["findings", MSG.MEDICAL_FINDINGS], ["diagnosis", MSG.MEDICAL_DIAGNOSIS], ["outcome", MSG.MEDICAL_OUTCOME]].map(([name, label]) =>
                        <Field key={name} label={msg(label)} name={name} value={form[name]} onChange={change} required multiline maxLength={4000} />)}
                    <Field label={msg(MSG.MEDICAL_HEALTH)} name="healthStatus" value={form.healthStatus} onChange={change} options={['Fit', 'Monitoring', 'Injured', 'Isolated']} />
                    <Field label={msg(MSG.GHI_CHU)} name="notes" value={form.notes} onChange={change} multiline maxLength={4000} />
                </div>
                <label className="d-flex gap-2 my-3"><input type="checkbox" checked={form.clearance} onChange={event => setForm(current => ({ ...current, clearance: event.target.checked, restrictionIds: [], injuryIds: [], treatmentIds: [] }))} />{msg(MSG.MEDICAL_CLEARANCE_SELECT)}</label>
                {form.clearance && <div>
                    <p>{msg(MSG.MEDICAL_CLEARANCE_HELP)}</p>
                    {sections.map(([key, label]) => <section key={key} className="mb-3"><h3 className="h6">{msg(label)}</h3>
                        {!eligible[key].length && <p>{msg(MSG.MEDICAL_CLEARANCE_EMPTY)}</p>}
                        {eligible[key].map(item => <label key={item.id} className="d-flex gap-2 mb-2">
                            <input type="checkbox" checked={form[key].includes(item.id)} onChange={event => toggle(key, item.id, event.target.checked)} />
                            <span>{item.reason || item.bodyLocation || item.objective}{item.status && ` · ${getInjuryStatusLabel(item.status)}`}</span>
                        </label>)}
                    </section>)}
                </div>}
                <button className="medical-primary-button" disabled={!data.records.length}>{msg(MSG.MEDICAL_FOLLOWUP_SAVE)}</button>
            </fieldset>
        </form>
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
    return <><ResourceState resource={resource} />{resource.data && <>
        <MedicalFollowUpForm key={horseId} horseId={horseId} data={resource.data} reload={resource.reload} />
        <section className="medical-table-card"><h2>{msg(MSG.MEDICAL_FOLLOWUP_HISTORY)}</h2>
            {!resource.data.followUps.length && <p>{msg(MSG.MEDICAL_FOLLOWUP_EMPTY)}</p>}
            <table className="medical-table"><thead><tr><th>{msg(MSG.THOI_GIAN)}</th><th>{msg(MSG.MEDICAL_OUTCOME)}</th><th>{msg(MSG.MEDICAL_CLEARANCE_SELECT)}</th></tr></thead>
                <tbody>{resource.data.followUps.map(item => <tr key={item.id}><td>{dateTime(item.createdAt)}</td><td>{item.outcome}</td><td>{msg(item.clearance ? MSG.CO : MSG.KHONG)}</td></tr>)}</tbody>
            </table>
        </section>
    </>}</>;
}

export default function MedicalFollowUp() {
    const [selected, setSelected] = useState('');
    const load = useCallback(() => allMedicalPages(getMedicalHorses), []);
    const horses = useRegistrationResource(load);
    const horseId = selected || horses.data?.[0]?.id;
    return <MedicalLayout><h1>{msg(MSG.MEDICAL_FOLLOWUP_TITLE)}</h1><p>{msg(MSG.MEDICAL_CLEARANCE_HELP)}</p>
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
