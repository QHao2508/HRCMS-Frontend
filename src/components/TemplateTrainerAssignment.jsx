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
import Drawer from './ui/Drawer.jsx';
import Avatar from './ui/Avatar.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
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
    return <Drawer open size="lg" busy={mutation.pending} title={`${msg(MSG.CURRIC_ASSIGN)} · ${template.name}`} onClose={onClose}><section ref={panel} className="training-action-panel training-assignment">
        <div className="training-requirements"><strong>{msg(MSG.CURRIC_REQUIREMENTS)}</strong><p>{types.map(getEnumLabel).join(', ') || msg(MSG.CURRIC_REQUIREMENTS_MISSING)}</p>{configured && <p>{msg(MSG.CURRIC_MIN_LEVEL)}{': '}{msg(MSG['SCHED_LEVEL_' + template.minimumExpertiseLevel])}</p>}</div>
        {!configured && <p className="alert alert-warning">{msg(MSG.CURRIC_REQUIREMENTS_MISSING)}</p>}
        <ResourceState resource={resource}/><MutationState mutation={mutation} reload={resource.reload}/>
        {resource.data && <><div className="training-trainer-choice"><Field name="trainerId" label={msg(MSG.TRAINING_TRAINER)} value={trainerId} onChange={e => setTrainerId(e.target.value)} options={[
            { value: '', label: msg(MSG.CURRIC_SELECT_TRAINER) }, ...resource.data.map(candidate => ({ value: candidate.id, label: candidate.name + ' · ' + msg(labels[trainerEligibility(template, candidate)]) + (candidate.assigned ? ' · ' + msg(MSG.CURRIC_ASSIGNED) : ''), disabled: !canAssignTrainer(template, candidate) && !candidate.assigned })),
        ]}/><p className="form-text">{msg(MSG.CURRIC_ASSIGN_HELP)}</p></div>
        {canEdit && <div className="training-assignment-actions"><button className="btn btn-primary" disabled={!assignable} onClick={() => changeAssignment(true)}>{msg(MSG.CURRIC_ASSIGN)}</button>{selected?.assigned && <button className="btn btn-outline-danger" disabled={busy} onClick={() => changeAssignment(false)}>{msg(MSG.CURRIC_REVOKE)}</button>}</div>}
        <ul className="candidate-list">{resource.data.map(candidate => {
            const state = trainerEligibility(template, candidate);
            const chosen = candidate.id === trainerId;
            const pickable = canEdit && !busy && !chosen && (canAssignTrainer(template, candidate) || candidate.assigned);
            return <li key={candidate.id} className={'candidate-card' + (state === 'Eligible' ? ' is-match' : '') + (chosen ? ' is-selected' : '')} aria-current={chosen || undefined}>
                <div className="candidate-head">
                    <Avatar name={candidate.name} size="sm" round />
                    <div className="candidate-name"><strong>{candidate.name}</strong></div>
                </div>
                <dl className="candidate-meta">
                    <div><dt>{msg(MSG.CURRIC_ELIGIBILITY)}</dt><dd><StatusBadge tone={state === 'Eligible' ? 'success' : 'warning'} dot>{msg(labels[state])}</StatusBadge></dd></div>
                    <div><dt>{msg(MSG.CURRIC_ASSIGNMENT_STATUS)}</dt><dd><StatusBadge tone={candidate.assigned ? 'info' : 'neutral'}>{msg(candidate.assigned ? MSG.CURRIC_ASSIGNED : MSG.CURRIC_NOT_ASSIGNED)}</StatusBadge></dd></div>
                </dl>
                <div className="candidate-skills"><span className="candidate-label">{msg(MSG.CURRIC_RELEVANT_SKILLS)}</span><TrainerSpecialties specialties={candidate.specialties} required={types} minimum={template.minimumExpertiseLevel}/>
                    <details className="mt-2"><summary>{msg(MSG.CURRIC_ALL_SKILLS)}</summary><TrainerSpecialties specialties={candidate.specialties}/></details></div>
                {chosen ? <p className="candidate-selected">{msg(MSG.SCHED_SELECTED)}</p>
                    : pickable && <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setTrainerId(candidate.id)}>{msg(MSG.SCHED_PICK_TRAINER)}</button>}
            </li>;
        })}</ul>
</>}
    </section></Drawer>;
}
