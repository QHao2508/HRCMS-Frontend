import { useCallback, useState } from 'react';
import { MSG, msg } from '../messages/index.js';
import { getEnumLabel } from '../constants/enumLabels.js';
import { useRegistrationResource } from '../context/useRegistrationResource.js';
import { useMutation } from '../context/useMutation.js';
import { Field, ResourceState, MutationState } from './WorkflowUI.jsx';
import { templateCandidates, assignTemplate } from '../services/trainingService.js';
import { requiredTypes } from '../services/templateCurriculum.js';
export default function TemplateTrainerAssignment({ template, onClose }) {
    const load = useCallback(() => templateCandidates(template.id), [template.id]);
    const resource = useRegistrationResource(load); const mutation = useMutation(); const [trainerId, setTrainerId] = useState('');
    const minimum = template.minimumExpertiseLevel || 1;
    function eligibility(candidate) {
        if (candidate.matches) return MSG.CURRIC_ELIGIBLE;
        if (requiredTypes(template).some(type => !candidate.specialties.some(skill => skill.trainingType === type))) return MSG.CURRIC_MISSING_SPECIALTY;
        return MSG.CURRIC_BELOW_LEVEL;
    }
    const selected = resource.data?.find(candidate => candidate.id === trainerId);
    return <section className="surface-card"><div className="card-heading"><h2>{msg(MSG.CURRIC_ASSIGN)}{' · '}{template.name}</h2><button className="btn btn-outline-secondary" onClick={onClose}>{msg(MSG.UI_CLOSE)}</button></div>
        <p>{requiredTypes(template).map(getEnumLabel).join(', ')}{' · '}{msg(MSG.CURRIC_MIN_LEVEL)}{' '}{msg(MSG['SCHED_LEVEL_' + (template.minimumExpertiseLevel || 1)])}</p>
        <ResourceState resource={resource}/><MutationState mutation={mutation} reload={resource.reload}/>
        {resource.data && <><Field name="trainerId" label={msg(MSG.TRAINING_TRAINER)} value={trainerId} onChange={e => setTrainerId(e.target.value)} options={[
            { value: '', label: msg(MSG.CURRIC_SELECT) }, ...resource.data.map(candidate => ({ value: candidate.id, label: candidate.name + ' · ' + msg(eligibility(candidate)), disabled: !candidate.matches && !candidate.assigned })),
        ]}/><p className="form-text">{msg(MSG.CURRIC_ASSIGN_HELP)}</p>
        <div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.TRAINING_TRAINER)}</th><th>{msg(MSG.CURRIC_RELEVANT_SKILLS)}</th><th>{msg(MSG.TRANG_THAI)}</th></tr></thead><tbody>{resource.data.map(candidate => <tr key={candidate.id}><td>{candidate.name}</td><td><div className="d-flex flex-wrap gap-2">{requiredTypes(template).map(type => {
 const skill = candidate.specialties.find(item => item.trainingType === type);
 const qualified = skill && skill.level >= minimum;
 return <span key={type} title={qualified ? undefined : msg(MSG.CURRIC_REQUIRED_LEVEL, {level:msg(MSG['SCHED_LEVEL_' + minimum])})} className={'badge border ' + (qualified ? 'bg-success-subtle text-success-emphasis border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border-warning-subtle')}>{getEnumLabel(type)}{' '}{msg(MSG.SYMBOL_5)}{' '}{skill ? msg(MSG['SCHED_LEVEL_' + skill.level]) : msg(MSG.CURRIC_SKILL_MISSING)}</span>;
})}</div><details className="mt-2"><summary className="form-text">{msg(MSG.CURRIC_ALL_SKILLS)}</summary><div className="d-flex flex-wrap gap-2 mt-2">{candidate.specialties.map(skill => <span key={skill.trainingType} className="badge bg-light text-dark border">{getEnumLabel(skill.trainingType)}{' '}{msg(MSG.SYMBOL_5)}{' '}{msg(MSG['SCHED_LEVEL_' + skill.level])}</span>)}{!candidate.specialties.length && msg(MSG.SCHED_NOT_CONFIRMED)}</div></details></td><td className="text-nowrap"><span className={"badge " + (candidate.assigned ? "text-bg-primary" : candidate.matches ? "text-bg-success" : "text-bg-secondary")}>{msg(candidate.assigned && candidate.matches ? MSG.CURRIC_ASSIGNED : eligibility(candidate))}</span></td></tr>)}</tbody></table></div>
        <button className="btn btn-primary" disabled={!selected?.matches || selected.assigned || mutation.pending || mutation.uncertain} onClick={() => mutation.run(() => assignTemplate(template.id, trainerId, true), resource.reload)}>{msg(MSG.CURRIC_ASSIGN)}</button>
        {selected?.assigned && <button className="btn btn-outline-danger ms-2" disabled={mutation.pending || mutation.uncertain} onClick={() => mutation.run(() => assignTemplate(template.id, trainerId, false), resource.reload)}>{msg(MSG.CURRIC_REVOKE)}</button>}</>}
    </section>;
}