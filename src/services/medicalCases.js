import { currentMedicalRecords } from './medicalRecordVersions.js';

/**
 * Gom hồ sơ khám theo ca bệnh: bản sửa (supersedesRecordId) và chuỗi tái khám cũ (previous → current)
 * được hiển thị là MỘT hồ sơ. Ca đã có lần tái khám kết luận khỏi (clearance) là đã giải quyết.
 */
export function medicalCases(records = [], followUps = []) {
    const parent = new Map();
    const find = id => { let root = id; while (parent.has(root) && parent.get(root) !== root) root = parent.get(root); parent.set(id, root); return root; };
    const join = (a, b) => { if (!a || !b) return; const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
    for (const record of records) { if (!record?.id) continue; if (!parent.has(record.id)) parent.set(record.id, record.id); join(record.id, record.supersedesRecordId); join(record.id, record.caseRootId); }
    for (const visit of followUps) if (visit.previousRecordId !== visit.currentRecordId) join(visit.previousRecordId, visit.currentRecordId);
    const groups = new Map();
    for (const record of currentMedicalRecords(records)) {
        const root = find(record.id);
        if (!groups.has(root)) groups.set(root, []);
        groups.get(root).push(record);
    }
    const time = value => new Date(value || 0).getTime() || 0;
    const cases = [...groups.entries()].map(([root, items]) => {
        const sorted = [...items].sort((a, b) => time(a.examinationAt) - time(b.examinationAt) || time(a.createdAt) - time(b.createdAt) || a.id.localeCompare(b.id));
        const ids = new Set(records.filter(r => r.id && find(r.id) === root).map(r => r.id));
        const visits = followUps.filter(v => ids.has(v.previousRecordId) || ids.has(v.currentRecordId)).sort((a, b) => time(a.createdAt) - time(b.createdAt));
        const latest = sorted.at(-1);
        return { id: latest.id, record: latest, first: sorted[0], ids, visits, resolved: visits.some(v => v.clearance) };
    });
    cases.sort((a, b) => time(a.first.examinationAt) - time(b.first.examinationAt));
    cases.forEach((item, index) => { item.number = index + 1; });
    return cases.sort((a, b) => time(b.record.examinationAt) - time(a.record.examinationAt));
}
export const openMedicalCases = (records, followUps) => medicalCases(records, followUps).filter(item => !item.resolved);
