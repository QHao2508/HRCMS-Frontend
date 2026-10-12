import { currentMedicalRecords } from './medicalRecordVersions.js';
import { MSG, msg } from '../messages/index.js';

export function medicalRecordChoices(records = []) {
    const unique = currentMedicalRecords(records);
    return unique.map((record, index) => {
        const date = new Date(record.examinationAt);
        const examinedAt = !record.examinationAt || Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
        const title = msg(MSG.MEDICAL_RECORD_NUMBER, { number: index + 1 });
        return { value: record.id, record, examinedAt, title, label: [title, examinedAt, record.diagnosis || record.reason || msg(MSG.MEDICAL_TEXT_22)].join(' · ') };
    });
}