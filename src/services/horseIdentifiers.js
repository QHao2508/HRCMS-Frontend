// Horse responses: registrationNumber is the deprecated alias for the system code.
export function systemRegistrationCode(horse) {
    if (!horse) return '';
    return Object.hasOwn(horse, 'systemRegistrationCode') ? horse.systemRegistrationCode || '' : horse.registrationNumber || '';
}

// Registration responses: registrationNumber is the deprecated document-number alias.
export function externalRegistrationNumber(record) {
    if (!record) return '';
    return Object.hasOwn(record, 'externalRegistrationNumber') ? record.externalRegistrationNumber || '' : record.registrationNumber || '';
}
