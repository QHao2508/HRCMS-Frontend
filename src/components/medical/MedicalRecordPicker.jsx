import { useId } from 'react';
import { Link } from 'react-router-dom';
import { MSG, msg } from '../../messages/index.js';
import { medicalRecordChoices } from '../../services/medicalRecordChoices.js';
import { useMedicalFollowUps } from '../../services/useMedicalFollowUps.js';

export default function MedicalRecordPicker({ records, horseId, value, onChange, disabled }) {
    const selectId = useId();
    const followUps = useMedicalFollowUps(horseId);
    const choices = medicalRecordChoices(records, followUps, { openOnly: true });
    const selected = choices.find(choice => choice.value === value);
    return <div className="medical-field medical-field-full">
        <label htmlFor={selectId}>{msg(MSG.MEDICAL_RECORD_PICKER_HO_SO_KHAM)}</label>
        <select id={selectId} name="medicalRecordId" value={value} onChange={onChange} required disabled={disabled} aria-describedby={selectId + '-help'}>
            <option value="">{msg(MSG.MEDICAL_RECORD_PICKER_CHON_HO_SO)}</option>
            {choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
        </select>
        <p id={selectId + '-help'} className="medical-record-source">{msg(MSG.MEDICAL_RECORD_SOURCE)}{' '}
            <Link to={`/medical/examination?horseId=${encodeURIComponent(horseId)}`}>{msg(MSG.MEDICAL_RECORD_OPEN_EXAMINATION)}</Link>
        </p>
        {selected && <div className="medical-record-selection" aria-live="polite">
            <strong>{[selected.title, selected.examinedAt].join(' · ')}</strong>
            <dl><div><dt>{msg(MSG.MEDICAL_RECORD_REASON)}</dt><dd>{selected.record.reason || '—'}</dd></div>
                <div><dt>{msg(MSG.MEDICAL_RECORD_DIAGNOSIS)}</dt><dd>{selected.record.diagnosis || '—'}</dd></div></dl>
        </div>}
    </div>;
}