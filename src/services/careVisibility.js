const clinicalTypes = new Set(['Treatment', 'IceBath']);

export function careTaskText(row, role, field) {
    if (clinicalTypes.has(row.type) && !['Groom', 'Veterinarian'].includes(role)) return null;
    return row[field];
}
