import { MSG, msg } from '../../messages/index.js';
import { getMedicalLabel } from '../../constants/medicalLabels.js';
import { previousMedicalRecordVersions } from '../../services/medicalRecordVersions.js';

export default function MedicalRecordHistory({ record, records, onView }) {
    const previous = previousMedicalRecordVersions(record, records);
    if (!previous.length) return null;
    return <details className="medical-record-history">
        <summary>{msg(MSG.MEDICAL_RECORD_HISTORY, { count: previous.length })}</summary>
        <p>{msg(MSG.MEDICAL_RECORD_HISTORY_HELP)}</p>
        {previous.map(prior => <div key={prior.id} className="medical-record-history-item">
            <div><strong>{msg(MSG.MEDICAL_RECORD_OLD_VERSION)}</strong><span className="status-badge">{getMedicalLabel(prior.healthStatus)}</span></div>
            <p>{prior.diagnosis || prior.reason || '—'}</p>
            <button className="medical-secondary-button" type="button" onClick={() => onView(prior)}>{msg(MSG.MEDICAL_RECORD_VIEW_OLD)}</button>
        </div>)}
    </details>;
}