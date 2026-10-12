import { useCallback } from 'react';
import { getEnumLabel } from '../../constants/enumLabels.js';
import { MSG, msg } from '../../messages/index.js';
import { useRegistrationResource } from '../../context/useRegistrationResource.js';
import { getMedicalSummary } from '../../services/medicalService.js';
import { ResourceState } from '../WorkflowUI.jsx';

/** Reads only the medical summary exposed for the selected horse and current role. */
export default function TrainingMedicalContext({ horseId, showHealthStatus = true }) {
    const load = useCallback(() => horseId ? getMedicalSummary(horseId) : Promise.resolve(null), [horseId]);
    const resource = useRegistrationResource(load, { realtime: true });
    return <section className="training-safety" aria-label={msg(MSG.TRAINING_MEDICAL_CONTEXT)}>
        <strong>{msg(MSG.TRAINING_MEDICAL_CONTEXT)}</strong>
        {!horseId && <p>{msg(MSG.TRAINING_MEDICAL_CONTEXT_NOTE)}</p>}
        {horseId && <><ResourceState resource={resource} />{resource.data && <MedicalSummaryDetails summary={resource.data} showHealthStatus={showHealthStatus} />}</>}
    </section>;
}

export function MedicalSummaryDetails({ summary, showHealthStatus = true }) {
    return <>
            {showHealthStatus && <p>{msg(MSG.TRAINING_HEALTH_STATUS)}{': '}{getEnumLabel(summary.healthStatus)}</p>}
            {summary.restrictions.length ? <ul>{summary.restrictions.map(restriction => <li key={restriction.id}>
                {restriction.reason}
                {restriction.trainingLock && <span>{' · '}{msg(MSG.TRAINING_LOCK_LABEL)}</span>}
                {restriction.blockAllTraining && <span>{' · '}{msg(MSG.TRAINING_BLOCK_ALL_LABEL)}</span>}
                {restriction.noSprint && <span>{' · '}{msg(MSG.TRAINING_NO_SPRINT_LABEL)}</span>}
                {restriction.maxIntensity && <span>{' · '}{msg(MSG.TRAINING_MAX_INTENSITY)}{': '}{getEnumLabel(restriction.maxIntensity)}</span>}
                {restriction.maxDistanceMetres != null && <span>{' · '}{msg(MSG.TRAINING_MAX_DISTANCE)}{': '}{restriction.maxDistanceMetres}{' '}{msg(MSG.M)}</span>}
            </li>)}</ul> : <p>{msg(MSG.TRAINING_NO_ACTIVE_RESTRICTIONS)}</p>}
    </>;
}
