import { useCallback, useState } from 'react';
import { MSG, msg } from '../../messages/index.js';
import { getMedicalCaseHistory, mergeMedicalCases } from '../../services/medicalService.js';
import { useRegistrationResource } from '../../context/useRegistrationResource.js';
import { useMutation } from '../../context/useMutation.js';
import { ResourceState, MutationState, Field } from '../WorkflowUI.jsx';
import { getMedicalLabel } from '../../constants/medicalLabels.js';

const dateTime = value => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
/** Show immutable clinical visits and let the vet explicitly join duplicate cases. */
export default function MedicalCaseDetails({ horseId, recordId, cases = [], onMerged }) {
    const load = useCallback(() => getMedicalCaseHistory(horseId, recordId), [horseId, recordId]);
    const resource = useRegistrationResource(load, { realtime: true });
    const mutation = useMutation();
    const [selected, setSelected] = useState([]);
    const [reason, setReason] = useState('');
    const current = cases.find(item => item.ids.has(recordId));
    const others = current ? cases.filter(item => item.id !== current.id && item.resolved === current.resolved) : [];
    return <section className="medical-case-details">
        <h3>{msg(MSG.MED_HISTORY_TITLE)}</h3><ResourceState resource={resource} />
        {resource.data && <ol className="medical-case-timeline">{resource.data.visits.map(visit => {
            const exam = visit.examination;
            return <li key={visit.id} className="medical-case-visit"><h4>{msg(MSG['MED_VISIT_' + visit.kind.toUpperCase()])}{msg(MSG.MED_HISTORY_SEPARATOR)}{dateTime(exam.examinationAt)}</h4>
                <dl className="medical-case-facts">{[[MSG.MEDICAL_RECORD_REASON,exam.reason],[MSG.MEDICAL_SYMPTOMS,exam.symptoms],[MSG.MEDICAL_FINDINGS,exam.findings],[MSG.MEDICAL_DIAGNOSIS,exam.diagnosis],[MSG.MEDICAL_HEALTH,getMedicalLabel(exam.healthStatus)],[MSG.GHI_CHU,exam.notes]].map(([key,value]) => <div key={key}><dt>{msg(key)}</dt><dd>{value || msg(MSG.MED_HISTORY_EMPTY)}</dd></div>)}</dl>
                {visit.kind === 'FollowUp' && <p><strong>{msg(MSG.MEDICAL_OUTCOME)}{msg(MSG.MED_HISTORY_COLON)}</strong>{visit.outcome}<br/>{msg(visit.clearance ? MSG.MED_CASE_RESOLVED : MSG.MED_CASE_OPEN)}</p>}
            </li>;
        })}</ol>}
        {onMerged && others.length > 0 && <details className="medical-case-merge"><summary>{msg(MSG.MED_MERGE_TITLE)}</summary><p>{msg(MSG.MED_MERGE_HELP)}</p><MutationState mutation={mutation} reload={resource.reload}/>
            <form onSubmit={event => { event.preventDefault(); if (!selected.length || !reason.trim()) return; mutation.run(() => mergeMedicalCases(horseId, recordId, { recordIds: selected, reason: reason.trim() }), onMerged, msg(MSG.MED_MERGE_SAVED)); }}>
                <fieldset disabled={mutation.pending || mutation.uncertain}>
                    {others.map(item => <label className="d-flex gap-2 my-2" key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={event => setSelected(value => event.target.checked ? [...value,item.id] : value.filter(id => id !== item.id))}/><span>{item.record.reason}{msg(MSG.MED_HISTORY_SEPARATOR)}{item.record.diagnosis}{msg(MSG.MED_HISTORY_SEPARATOR)}{dateTime(item.record.examinationAt)}</span></label>)}
                    <Field wide name="mergeReason" label={msg(MSG.MED_MERGE_REASON)} value={reason} onChange={event => setReason(event.target.value)} required maxLength={2000} multiline/>
                    <button className="medical-primary-button mt-3" disabled={!selected.length || !reason.trim()}>{msg(MSG.MED_MERGE_ACTION)}</button>
                </fieldset>
            </form>
        </details>}
    </section>;
}