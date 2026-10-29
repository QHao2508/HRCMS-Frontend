import { useCallback, useState } from 'react';
import { MSG, msg } from '../messages/index.js';
import { getEnumLabel } from '../constants/enumLabels.js';
import { ROLES } from '../constants/roles.js';
import { useAuth } from '../context/useAuth.js';
import { useTrainingFormFocus } from '../context/useTrainingFormFocus.js';
import { useRegistrationResource } from '../context/useRegistrationResource.js';
import { useMutation } from '../context/useMutation.js';
import { Field, ResourceState, MutationState } from './WorkflowUI.jsx';
import { TrainerSpecialties } from './TrainerCandidates.jsx';
import { templateCandidates, assignTemplate } from '../services/trainingService.js';
import { requiredTypes, trainerEligibility, canAssignTrainer } from '../services/templateCurriculum.js';
import '../style/training.css';
const labels = { Eligible: MSG.CURRIC_ELIGIBLE, MissingSpecialty: MSG.CURRIC_MISSING_SPECIALTY, BelowMinimumLevel: MSG.CURRIC_BELOW_LEVEL, RequirementsMissing: MSG.CURRIC_REQUIREMENTS_MISSING, Unverified: MSG.CURRIC_ELIGIBILITY_UNKNOWN };
export default function TemplateTrainerAssignment({ template, onClose, opening = template.id }) {
    const { user } = useAuth();
    const canEdit = user?.role === ROLES.HeadTrainer;
    const load = useCallback(() => templateCandidates(template.id), [template.id]);
    const resource = useRegistrationResource(load); const mutation = useMutation(); const [trainerId, setTrainerId] = useState('');
    const panel = useTrainingFormFocus(opening, !resource.loading);
    const types = requiredTypes(template);
    const configured = types.length > 0 && [1, 2, 3].includes(template.minimumExpertiseLevel);
    const selected = resource.data?.find(candidate => candidate.id === trainerId);
    const busy = resource.loading || !!resource.error || mutation.pending || mutation.uncertain;
    const assignable = canEdit && !busy && canAssignTrainer(template, selected);
    function changeAssignment(assigned) {
        if (!canEdit || busy || !selected || (assigned ? !canAssignTrainer(template, selected) : !selected.assigned)) return;
        return mutation.run(() => assignTemplate(template.id, selected.id, assigned), resource.reload);
    }
    return <section ref={panel} className="surface-card training-action-panel training-assignment">
        <div className="card-heading"><h2 tabIndex={-1} data-training-form-heading>{msg(MSG.CURRIC_ASSIGN)}{' · '}{template.name}</h2><button type="button" className="btn btn-outline-secondary" onClick={onClose}>{msg(MSG.UI_CLOSE)}</button></div>
        <div className="training-requirements"><strong>{msg(MSG.CURRIC_REQUIREMENTS)}</strong><p>{types.map(getEnumLabel).join(', ') || msg(MSG.CURRIC_REQUIREMENTS_MISSING)}</p>{configured && <p>{msg(MSG.CURRIC_MIN_LEVEL)}{': '}{msg(MSG['SCHED_LEVEL_' + template.minimumExpertiseLevel])}</p>}</div>
        {!configured && <p className="alert alert-warning">{msg(MSG.CURRIC_REQUIREMENTS_MISSING)}</p>}
        <ResourceState resource={resource}/><MutationState mutation={mutation} reload={resource.reload}/>
        {resource.data && <><div className="training-trainer-choice"><Field name="trainerId" label={msg(MSG.TRAINING_TRAINER)} value={trainerId} onChange={e => setTrainerId(e.target.value)} options={[
            { value: '', label: msg(MSG.CURRIC_SELECT_TRAINER) }, ...resource.data.map(candidate => ({ value: candidate.id, label: candidate.name + ' · ' + msg(labels[trainerEligibility(template, candidate)]) + (candidate.assigned ? ' · ' + msg(MSG.CURRIC_ASSIGNED) : ''), disabled: !canAssignTrainer(template, candidate) && !candidate.assigned })),
        ]}/><p className="form-text">{msg(MSG.CURRIC_ASSIGN_HELP)}</p></div>
        {canEdit && <div className="training-assignment-actions"><button className="btn btn-primary" disabled={!assignable} onClick={() => changeAssignment(true)}>{msg(MSG.CURRIC_ASSIGN)}</button>{selected?.assigned && <button className="btn btn-outline-danger" disabled={busy} onClick={() => changeAssignment(false)}>{msg(MSG.CURRIC_REVOKE)}</button>}</div>}
        <div className="table-responsive"><table className="table training-candidate-table"><thead><tr><th scope="col">{msg(MSG.TRAINING_TRAINER)}</th><th scope="col">{msg(MSG.CURRIC_RELEVANT_SKILLS)}</th><th scope="col">{msg(MSG.CURRIC_ELIGIBILITY)}</th><th scope="col">{msg(MSG.CURRIC_ASSIGNMENT_STATUS)}</th></tr></thead><tbody>{resource.data.map(candidate => {
            const state = trainerEligibility(template, candidate);
            return <tr key={candidate.id} className={candidate.id === trainerId ? 'table-success' : ''}><td><strong>{candidate.name}</strong></td><td><TrainerSpecialties specialties={candidate.specialties} required={types} minimum={template.minimumExpertiseLevel}/><details className="mt-2"><summary>{msg(MSG.CURRIC_ALL_SKILLS)}</summary><TrainerSpecialties specialties={candidate.specialties}/></details></td><td><span className={'badge ' + (state === 'Eligible' ? 'text-bg-success' : 'bg-warning-subtle text-warning-emphasis')}>{msg(labels[state])}</span></td><td><span className={'badge ' + (candidate.assigned ? 'text-bg-primary' : 'bg-light text-dark border')}>{msg(candidate.assigned ? MSG.CURRIC_ASSIGNED : MSG.CURRIC_NOT_ASSIGNED)}</span></td></tr>;
        })}</tbody></table></div>
</>}
    </section>;
}
