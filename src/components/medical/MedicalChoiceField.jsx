import { useId, useState } from 'react';
import { MSG, msg } from '../../messages/index.js';
import { MEDICAL_MULTI, joinChoice, medicalOptions, splitChoice } from '../../services/medicalOptions.js';

/**
 * Chọn nhanh triệu chứng/chẩn đoán thường gặp ở ngựa; chỉ khi chọn "Khác" mới hiện ô ghi tay.
 * Giá trị vẫn là chuỗi để giữ nguyên hợp đồng API.
 */
export default function MedicalChoiceField({ field, label, value, onChange, disabled, full = true }) {
    const baseId = useId(); const options = medicalOptions(field); const parsed = splitChoice(field, value);
    const [otherOpen, setOtherOpen] = useState(!!parsed.other);
    const update = (selected, other) => onChange(joinChoice(field, selected, other));
    const otherInput = (otherOpen || parsed.other) && <input className="mt-2" aria-label={`${label} · ${msg(MSG.MED_OTHER)}`} placeholder={msg(MSG.MED_OTHER_PLACEHOLDER)} value={parsed.other} disabled={disabled} maxLength={1000} onChange={e => update(parsed.selected, e.target.value)} />;
    if (!MEDICAL_MULTI[field]) {
        const current = parsed.selected[0] || (otherOpen || parsed.other ? '__other' : '');
        return <div className={`medical-field${full ? ' medical-field-full' : ''}`}><label htmlFor={baseId}>{label}</label>
            <select id={baseId} value={current} disabled={disabled} required={!parsed.other} onChange={e => { const v = e.target.value; if (v === '__other') { setOtherOpen(true); update([], parsed.other); } else { setOtherOpen(false); update(v ? [v] : [], ''); } }}>
                <option value="">{msg(MSG.MED_PICK_ONE)}</option>
                {options.map(option => <option key={option} value={option}>{option}</option>)}
                <option value="__other">{msg(MSG.MED_OTHER)}</option>
            </select>{otherInput}</div>;
    }
    const toggle = (option, checked) => update(checked ? [...parsed.selected, option] : parsed.selected.filter(x => x !== option), parsed.other);
    return <fieldset className={`medical-field${full ? ' medical-field-full' : ''}`} disabled={disabled}><legend className="form-label fs-6">{label}</legend>
        <p className="medical-choice-help">{msg(MSG.MED_CHOICE_HELP)}</p>
        <div className="medical-choice-grid">{options.map(option => <label key={option} className={`medical-choice-option${parsed.selected.includes(option) ? ' is-selected' : ''}`}>
            <input type="checkbox" checked={parsed.selected.includes(option)} onChange={e => toggle(option, e.target.checked)} /><span>{option}</span></label>)}
            <label className={`medical-choice-option${otherOpen || parsed.other ? ' is-selected' : ''}`}><input type="checkbox" checked={otherOpen || !!parsed.other} onChange={e => { setOtherOpen(e.target.checked); if (!e.target.checked) update(parsed.selected, ''); }} /><span>{msg(MSG.MED_OTHER)}</span></label>
        </div>{otherInput}</fieldset>;
}
