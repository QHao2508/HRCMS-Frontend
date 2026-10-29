import { clubInstant } from './displayDate.js';
import { MSG, msg } from '../messages/index.js';

function invalid(key) { throw Object.assign(new Error(msg(key)), { status: 400 }); }
export function clearanceOptions(data, examinationAt) {
    const instant = new Date(clubInstant(examinationAt));
    if (Number.isNaN(instant.getTime())) return { restrictionIds: [], injuryIds: [], treatmentIds: [] };
    const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(instant);
    return {
        restrictionIds: data.restrictions.filter(x => !x.cleared && new Date(x.validFrom) <= instant),
        injuryIds: data.injuries.filter(x => ['Active', 'Recovering'].includes(x.status) && x.injuryDate <= date),
        treatmentIds: data.treatments.filter(x => !x.completed && x.startDate <= date),
    };
}
export function followUpPayload(form, data, now = new Date()) {
    const previous = data.records.find(x => x.id === form.previousRecordId);
    const instant = new Date(clubInstant(form.examinationAt));
    if (!previous || Number.isNaN(instant.getTime()) || instant > now || instant < new Date(previous.examinationAt)) invalid(MSG.MEDICAL_FOLLOWUP_DATES);
    const fields = ['reason', 'symptoms', 'findings', 'diagnosis'];
    if (fields.some(key => !form[key]?.trim()) || !form.outcome?.trim()) invalid(MSG.MEDICAL_FOLLOWUP_REQUIRED);
    const eligible = clearanceOptions(data, form.examinationAt);
    const selected = Object.fromEntries(Object.entries(eligible).map(([key, items]) => {
        const ids = form.clearance ? form[key] : [];
        if (!Array.isArray(ids) || new Set(ids).size !== ids.length || ids.some(id => !items.some(item => item.id === id))) invalid(MSG.MEDICAL_CLEARANCE_INVALID);
        return [key, ids];
    }));
    // Kết luận khỏi không cần chọn tay: backend tự đóng các mục gắn với hồ sơ; danh sách ở đây chỉ là mục thêm.
    return {
        previousRecordId: previous.id,
        examination: { examinationAt: instant.toISOString(), ...Object.fromEntries(fields.map(key => [key, form[key].trim()])), healthStatus: form.healthStatus, notes: form.notes?.trim() || '' },
        clearance: form.clearance,
        outcome: form.outcome.trim(),
        ...selected,
    };
}

export async function allMedicalPages(load) {
    const items = [];
    for (let page = 1; page <= 1000; page++) {
        const data = await load({ page, pageSize: 100 });
        if (!Array.isArray(data?.items) || data.page !== page || !Number.isInteger(data.total) || data.total < 0) throw new Error(msg(MSG.MEDICAL_INVALID_RESPONSE));
        items.push(...data.items);
        if (items.length >= data.total) return items;
        if (!data.items.length) throw new Error(msg(MSG.MEDICAL_INVALID_RESPONSE));
    }
    throw new Error(msg(MSG.MEDICAL_INVALID_RESPONSE));
}
