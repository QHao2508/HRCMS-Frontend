import { medicalCases } from './medicalCases.js';
import { MSG, msg } from '../messages/index.js';

/** Mỗi ca bệnh là một lựa chọn (bản mới nhất); openOnly bỏ các ca đã giải quyết. */
export function medicalRecordChoices(records = [], followUps = [], { openOnly = false } = {}) {
    const cases = medicalCases(records, followUps).filter(item => !openOnly || !item.resolved);
    return cases.map(item => {
        const record = item.record;
        const date = new Date(record.examinationAt);
        const examinedAt = !record.examinationAt || Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
        const title = msg(MSG.MEDICAL_RECORD_NUMBER, { number: item.number });
        return { value: record.id, record, medicalCase: item, examinedAt, title, label: [title, item.first.reason || record.reason, record.diagnosis, examinedAt].filter(Boolean).join(' · ') || msg(MSG.MEDICAL_RECORD_CHOICES_HO_SO_KHAM) };
    });
}
