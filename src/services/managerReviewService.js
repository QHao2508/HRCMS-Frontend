import api from "./api.js";
import { getRegistration } from "./registrationService.js";
import { REGISTRATION_STATUS } from "../constants/registration.js";
import { validDate } from "./registrationValidation.js";

export const MANAGER_FIELDS = Object.freeze(["name", "registrationNumber", "boardingStart", "boardingEnd"]);
export const canReview = (status) => status === REGISTRATION_STATUS.PendingReview;
export function managerEditForm(record) {
    return Object.fromEntries(MANAGER_FIELDS.map((field) => [field, record[field] ?? ""]));
}
export function managerEditPayload(values) {
    // Manager PUT preserves omitted/null values. Never use Owner replacement mapping.
    return Object.fromEntries(MANAGER_FIELDS.filter((field) => Object.hasOwn(values, field)).map((field) => {
        const value = values[field] == null ? null : String(values[field]).trim();
        return [field, field.startsWith("boarding") && value === "" ? null : value];
    }));
}
export function validateManagerEdit(values, original) {
    const errors = {};
    if (!values.name.trim() || values.name.trim().length > 200) errors.name = "Enter a name of 1–200 characters.";
    if (values.registrationNumber.trim().length > 100) errors.registrationNumber = "Use at most 100 characters.";
    if (!validDate(values.boardingStart) || values.boardingStart === "0001-01-01") errors.boardingStart = "Enter a valid boarding start date.";
    if (values.boardingEnd && (!validDate(values.boardingEnd) || values.boardingEnd === "0001-01-01" || values.boardingEnd < values.boardingStart)) errors.boardingEnd = "End date must be valid and on or after the start date.";
    if (original.boardingEnd && !values.boardingEnd) errors.boardingEnd = "A saved end date cannot be cleared during Manager review; enter a date or discard the edit.";
    return errors;
}
export function revisionReasonError(reason) {
    return typeof reason !== "string" || !reason.trim() || reason.trim().length > 2000
        ? "Enter a revision reason of 1–2000 characters." : "";
}
export function isUncertainReviewError(error) {
    return !!error.uncertain || !error.status || [401, 403, 404, 409].includes(error.status) || error.status >= 500;
}
export async function saveManagerEdit(id, values) {
    await api.put(`/api/registrations/${encodeURIComponent(id)}`, managerEditPayload(values), { retryOnUnauthorized: false });
    try { return await getRegistration(id); }
    catch (error) { error.uncertain = true; throw error; }
}
export async function reviewRegistration(id, { approve, reason }) {
    if (typeof approve !== "boolean") throw new Error("Choose a review decision.");
    if (!approve && revisionReasonError(reason)) throw new Error(revisionReasonError(reason));
    const { data } = await api.post(`/api/registrations/${encodeURIComponent(id)}/review`, {
        approve, reason: approve ? null : reason.trim(),
    }, { retryOnUnauthorized: false });
    const expected = approve ? REGISTRATION_STATUS.Approved : REGISTRATION_STATUS.RevisionRequired;
    if (data?.registration?.id !== id || data.registration.status !== expected
        || (approve ? typeof data.horseId !== "string" || !data.horseId.trim() : data.horseId !== null)) {
        const error = new Error("The review result could not be confirmed. Reload the registration before continuing.");
        error.uncertain = true;
        throw error;
    }
    return data;
}
