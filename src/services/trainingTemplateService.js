import api from "./api.js";
import { TRAINING_INTENSITIES, TEMPLATE_LIMITS } from "../constants/training.js";

const root = "/api/training/templates";
export const emptyTemplateForm = Object.freeze({
    name: "",
    goal: "",
    phase: "",
    distanceMetres: "",
    intensity: "Light",
    surface: "",
    frequencyPerWeek: "",
    notes: "",
});

export function templateForm(template = emptyTemplateForm) {
    return Object.fromEntries(Object.keys(emptyTemplateForm).map((field) => [field, template[field] == null ? "" : String(template[field])]));
}

export function validateTemplate(values) {
    const errors = {};
    for (const field of ["name", "goal", "phase", "surface"]) {
        const value = typeof values[field] === "string" ? values[field].trim() : "";
        const maximum = field === "name" ? TEMPLATE_LIMITS.name : TEMPLATE_LIMITS.text;
        if (!value || value.length > maximum) errors[field] = `Enter ${field === "name" ? "a name" : field} of 1–${maximum} characters.`;
    }
    if (!TRAINING_INTENSITIES.includes(values.intensity)) errors.intensity = "Choose a supported intensity.";
    const distance = Number(values.distanceMetres);
    if (!Number.isFinite(distance) || distance < TEMPLATE_LIMITS.minDistance || distance > TEMPLATE_LIMITS.maxDistance)
        errors.distanceMetres = "Enter a distance from 1 to 100000 metres.";
    const frequency = Number(values.frequencyPerWeek);
    if (!Number.isInteger(frequency) || frequency < TEMPLATE_LIMITS.minFrequency || frequency > TEMPLATE_LIMITS.maxFrequency)
        errors.frequencyPerWeek = "Enter a whole number from 1 to 21.";
    if (typeof values.notes !== "string" || values.notes.length > TEMPLATE_LIMITS.text)
        errors.notes = "Use at most 4000 characters.";
    return errors;
}

export function templatePayload(values) {
    return {
        name: String(values.name).trim(),
        goal: String(values.goal).trim(),
        phase: String(values.phase).trim(),
        distanceMetres: Number(values.distanceMetres),
        intensity: values.intensity,
        surface: String(values.surface).trim(),
        frequencyPerWeek: Number(values.frequencyPerWeek),
        notes: String(values.notes),
    };
}

function validTemplate(value, expectedId) {
    return value && typeof value.id === "string" && value.id.trim()
        && (!expectedId || value.id === expectedId)
        && typeof value.name === "string" && TRAINING_INTENSITIES.includes(value.intensity)
        && value.archived === false;
}

function uncertain(message) {
    return Object.assign(new Error(message), { requiresReload: true });
}

export function isUncertainTemplateMutationError(error) {
    return !!error?.requiresReload || !error?.status || [401, 403, 404, 409].includes(error.status) || error.status >= 500;
}

export async function listTrainingTemplates({ page = 1, pageSize = 20 } = {}) {
    const { data } = await api.get(root, { params: { page, pageSize } });
    if (!data || !Array.isArray(data.items) || !Number.isInteger(data.page) || !Number.isInteger(data.pageSize)
        || !Number.isInteger(data.total)) throw new Error("The Training Template list response is invalid.");
    return data;
}

export async function createTrainingTemplate(values) {
    if (Object.keys(validateTemplate(values)).length) throw new Error("Check the template fields.");
    const { data } = await api.post(root, templatePayload(values), { retryOnUnauthorized: false });
    if (!validTemplate(data)) throw uncertain("The template may have been created, but the response could not be confirmed. Reload before trying again.");
    return data;
}

export async function updateTrainingTemplate(template, values) {
    if (!template?.id || template.archived !== false) throw new Error("Archived or invalid templates cannot be edited.");
    if (Object.keys(validateTemplate(values)).length) throw new Error("Check the template fields.");
    const { data } = await api.put(`${root}/${encodeURIComponent(template.id)}`, templatePayload(values), { retryOnUnauthorized: false });
    if (!validTemplate(data, template.id)) throw uncertain("The template may have been updated, but the response could not be confirmed. Reload before trying again.");
    return data;
}

export async function archiveTrainingTemplate(template) {
    if (!template?.id || template.archived !== false) throw new Error("Archived or invalid templates cannot be archived.");
    await api.post(`${root}/${encodeURIComponent(template.id)}/archive`, undefined, { retryOnUnauthorized: false });
}

export function createTemplateMutation(run) {
    let pending = false;
    let blocked = false;
    return async (...args) => {
        if (pending || blocked) return null;
        pending = true;
        try { return await run(...args); }
        catch (error) {
            blocked = isUncertainTemplateMutationError(error);
            throw Object.assign(error, { requiresReload: blocked });
        } finally { pending = false; }
    };
}

export async function runTemplateMutation(operation, reload) {
    const result = await operation();
    if (result !== null) reload();
    return result;
}
