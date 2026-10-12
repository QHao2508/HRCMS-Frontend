const administrativeFields = ['name', 'registrationNumber', 'boardingStart', 'boardingEnd'];

export const administrativeForm = record => Object.fromEntries(administrativeFields.map(name => [name, record[name] || '']));
export const administrativeEditPayload = form => Object.fromEntries(administrativeFields.map(name => [name, form[name]?.trim() || null]));
export const hasUnsavedAdministrativeChanges = (form, record) => administrativeFields.some(name => (form[name] || '') !== (record[name] || ''));
