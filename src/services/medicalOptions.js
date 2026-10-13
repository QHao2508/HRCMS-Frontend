import { MSG, msg } from '../messages/index.js';

// Lựa chọn thường gặp ở ngựa; "Khác" mới cần ghi tay. Giá trị lưu là văn bản hiển thị, nối bằng "; ".
const keys = {
    reason: ['MED_R_ROUTINE', 'MED_R_PRE_TRAINING', 'MED_R_LAMENESS', 'MED_R_TRAINING_INJURY', 'MED_R_APPETITE', 'MED_R_COLIC', 'MED_R_FEVER', 'MED_R_RESPIRATORY', 'MED_R_WOUND', 'MED_R_CARE_REPORT'],
    symptoms: ['MED_S_LAMENESS', 'MED_S_SWELLING', 'MED_S_HEAT', 'MED_S_APPETITE', 'MED_S_COLIC', 'MED_S_FEVER', 'MED_S_COUGH', 'MED_S_NASAL', 'MED_S_BREATHING', 'MED_S_DIARRHEA', 'MED_S_WOUND', 'MED_S_LETHARGY', 'MED_S_WEIGHT', 'MED_S_SWEAT', 'MED_S_NONE'],
    findings: ['MED_F_TEMP_NORMAL', 'MED_F_TEMP_HIGH', 'MED_F_HEART', 'MED_F_RESP', 'MED_F_TENDON', 'MED_F_PAIN', 'MED_F_FLEXION', 'MED_F_GUT', 'MED_F_MUCOSA', 'MED_F_OPEN_WOUND', 'MED_F_HOOF', 'MED_F_LUNG', 'MED_F_NORMAL'],
    diagnosis: ['MED_D_HEALTHY', 'MED_D_TENDINITIS', 'MED_D_SPRAIN', 'MED_D_HOOF_ABSCESS', 'MED_D_ARTHRITIS', 'MED_D_LAMINITIS', 'MED_D_COLIC', 'MED_D_RESPIRATORY', 'MED_D_INFLUENZA', 'MED_D_SOFT_TISSUE', 'MED_D_FATIGUE', 'MED_D_DIGESTIVE'],
};
export const MEDICAL_MULTI = Object.freeze({ reason: false, symptoms: true, findings: true, diagnosis: false });
export const SEPARATOR = '; ';
export const medicalOptions = field => keys[field].map(key => msg(MSG[key]));

/** Tách giá trị đã lưu thành các lựa chọn có sẵn và phần "Khác". */
export function splitChoice(field, value = '') {
    const options = medicalOptions(field); const text = String(value || '').trim();
    if (!text) return { selected: [], other: '' };
    if (!MEDICAL_MULTI[field]) return options.includes(text) ? { selected: [text], other: '' } : { selected: [], other: text };
    const parts = text.split(';').map(x => x.trim()).filter(Boolean);
    return { selected: parts.filter(x => options.includes(x)), other: parts.filter(x => !options.includes(x)).join(SEPARATOR) };
}
/** Ghép lựa chọn và phần "Khác" thành chuỗi gửi API theo thứ tự danh sách. */
export function joinChoice(field, selected = [], other = '') {
    const ordered = medicalOptions(field).filter(x => selected.includes(x));
    const extra = String(other || '').trim();
    return (MEDICAL_MULTI[field] ? [...ordered, ...(extra ? [extra] : [])] : [ordered[0] || extra]).filter(Boolean).join(SEPARATOR);
}
