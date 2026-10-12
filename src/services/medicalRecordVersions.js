// Corrections are separate audit rows, linked by supersedesRecordId, not new examinations.
export function currentMedicalRecords(records = []) {
    const unique = [...new Map(records.filter(record => record.id).map(record => [record.id, record])).values()];
    const replaced = new Set(unique.map(record => record.supersedesRecordId).filter(Boolean));
    return unique.filter(record => !replaced.has(record.id));
}

export function previousMedicalRecordVersions(record, records = []) {
    const byId = new Map(records.map(item => [item.id, item]));
    const visited = new Set([record.id]);
    const previous = [];
    let priorId = record.supersedesRecordId;
    while (priorId && byId.has(priorId) && !visited.has(priorId)) {
        visited.add(priorId);
        const prior = byId.get(priorId);
        previous.push(prior);
        priorId = prior.supersedesRecordId;
    }
    return previous;
}