import { HORSE_GENDERS, INTAKE_LIMITS, PREFERENCES } from "../constants/registration.js";

export const FORM_SECTIONS = [
    { title: "Horse information", fields: [
        { name: "name", label: "Horse name", maxLength: 200 },
        { name: "dateOfBirth", label: "Date of birth", type: "date" },
        { name: "gender", label: "Gender", options: HORSE_GENDERS },
        { name: "breed", label: "Breed", maxLength: 100 },
        { name: "registrationNumber", label: "Registration number", maxLength: 100 },
    ] },
    { title: "Pedigree", fields: [
        { name: "sire", label: "Sire", maxLength: 200 }, { name: "dam", label: "Dam", maxLength: 200 },
    ] },
    { title: "Physical information", fields: [
        { name: "heightCm", label: "Height (cm)", type: "number", min: INTAKE_LIMITS.minHeight, max: INTAKE_LIMITS.maxHeight },
        { name: "weightKg", label: "Weight (kg)", type: "number", min: INTAKE_LIMITS.minWeight, max: INTAKE_LIMITS.maxWeight },
        { name: "measurementDate", label: "Measurement date", type: "date" },
    ] },
    { title: "Initial health declaration", fields: [
        { name: "declaredHealth", label: "Declared health", type: "textarea", maxLength: 1000 },
        { name: "healthNotes", label: "Health notes", type: "textarea", maxLength: 2000 },
    ] },
    { title: "Boarding period", fields: [
        { name: "boardingStart", label: "Boarding start", type: "date" },
        { name: "boardingEnd", label: "Boarding end", type: "date" },
    ] },
];
const fields = FORM_SECTIONS.flatMap((section) => section.fields);
export const EDITABLE_FIELDS = Object.freeze([...fields.map(({ name }) => name), ...PREFERENCES.map(({ field }) => field)]);

export function registrationForm(record = {}) {
    return Object.fromEntries(EDITABLE_FIELDS.map((name) => [name, record[name] == null ? "" : String(record[name])]));
}
export function registrationPayload(form) {
    // Owner PUT is a replacement. Every editable key is always present.
    return Object.fromEntries(EDITABLE_FIELDS.map((name) => {
        const value = String(form[name] ?? "").trim();
        return [name, value === "" ? null : ["heightCm", "weightKg"].includes(name) ? Number(value) : value];
    }));
}
export function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "0001-01-01") return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validateDraft(form, today = new Intl.DateTimeFormat("sv-SE", { timeZone: INTAKE_LIMITS.timeZone }).format(new Date())) {
    const errors = {};
    const values = registrationPayload(form);
    for (const field of fields) {
        const value = values[field.name];
        if (value === null) continue; // Partial drafts are valid.
        if (field.maxLength && value.length > field.maxLength) errors[field.name] = `Use at most ${field.maxLength} characters.`;
        if (field.type === "number" && (!Number.isFinite(value) || value < field.min || value > field.max)) errors[field.name] = `Enter a number from ${field.min} to ${field.max}.`;
        if (field.type === "date" && (!validDate(value) || value === "0001-01-01")) errors[field.name] = "Enter a valid date.";
    }
    if (values.gender && !HORSE_GENDERS.includes(values.gender)) errors.gender = "Choose a supported gender.";
    if (values.dateOfBirth > today) errors.dateOfBirth = "Date of birth cannot be in the future.";
    if (values.measurementDate && (values.measurementDate > today || (values.dateOfBirth && values.measurementDate < values.dateOfBirth))) errors.measurementDate = "Measurement date must be between birth and today.";
    if (values.boardingStart && values.boardingEnd && values.boardingEnd < values.boardingStart) errors.boardingEnd = "Boarding end cannot precede boarding start.";
    return errors;
}
export function submissionMissing(record, attachments) {
    const required = ["name", "sire", "dam", "dateOfBirth", "gender", "breed", "heightCm", "weightKg", "measurementDate", "declaredHealth", "boardingStart"];
    const missing = required.filter((name) => record[name] == null || String(record[name]).trim() === "")
        .map((name) => fields.find((field) => field.name === name).label);
    if (!attachments.some((item) => item.type === "HorsePhoto")) missing.push("Horse photo attachment");
    if (!attachments.some((item) => item.type === "Certificate")) missing.push("Certificate attachment");
    return missing;
}
