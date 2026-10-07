import api from "./api.js";
import { getHorse, listHorses } from "./horseService.js";
import { validDate } from "./registrationValidation.js";
import { TRAINING_PLAN_STATUSES } from "../constants/training.js";
import { validTrainingSession } from "./trainingSessionModel.js";

const root = "/api/training/plans";
export const emptyPlanForm = Object.freeze({ horseId: "", templateId: "", goal: "", phase: "", startDate: "", endDate: "", notes: "" });

export function planForm(plan = emptyPlanForm) {
    return Object.fromEntries(Object.keys(emptyPlanForm).map((field) => [field, plan[field] == null ? "" : String(plan[field])]));
}

export function validatePlan(values) {
    const errors = {};
    if (typeof values.horseId !== "string" || !values.horseId.trim()) errors.horseId = "Choose a Horse.";
    if (typeof values.templateId !== "string" || !values.templateId.trim()) errors.templateId = "Choose an active Training Template.";
    for (const field of ["goal", "phase"]) {
        const value = typeof values[field] === "string" ? values[field].trim() : "";
        if (!value || value.length > 4000) errors[field] = `Enter ${field} of 1–4000 characters.`;
    }
    if (!validDate(values.startDate) || values.startDate === "0001-01-01") errors.startDate = "Enter a valid start date.";
    if (!validDate(values.endDate) || values.endDate === "0001-01-01" || values.endDate < values.startDate)
        errors.endDate = "End date must be valid and on or after the start date.";
    if (typeof values.notes !== "string" || values.notes.length > 4000) errors.notes = "Use at most 4000 characters.";
    return errors;
}

export function planPayload(values, identity) {
    return {
        horseId: identity?.horseId || String(values.horseId).trim(),
        templateId: identity?.templateId || String(values.templateId).trim(),
        goal: String(values.goal).trim(),
        phase: String(values.phase).trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        notes: String(values.notes),
    };
}

function validPlan(value, expected = {}) {
    return !!(value && typeof value.id === "string" && value.id.trim()
        && typeof value.horseId === "string" && value.horseId.trim()
        && typeof value.trainerId === "string" && value.trainerId.trim()
        && typeof value.templateId === "string" && value.templateId.trim()
        && typeof value.goal === "string" && typeof value.phase === "string" && typeof value.notes === "string"
        && validDate(value.startDate) && validDate(value.endDate) && value.endDate >= value.startDate
        && TRAINING_PLAN_STATUSES.includes(value.status)
        && (!expected.id || value.id === expected.id)
        && (!expected.horseId || value.horseId === expected.horseId)
        && (!expected.templateId || value.templateId === expected.templateId));
}

function uncertain(message) { return Object.assign(new Error(message), { requiresReload: true }); }
export function isUncertainPlanMutationError(error) {
    return !!error?.requiresReload || !error?.status || [401, 403, 404, 409].includes(error.status) || error.status >= 500;
}

export function canManagePlan(user, horseDetail) {
    const horseId = horseDetail?.horse?.id;
    return user?.role === "Trainer" && typeof user.id === "string" && typeof horseId === "string"
        && horseDetail.horse.archived === false && Array.isArray(horseDetail.assignments)
        && horseDetail.assignments.some((item) => item?.active === true && item.role === "Trainer"
            && typeof item.staffId === "string" && item.staffId.toLowerCase() === user.id.toLowerCase()
            && typeof item.horseId === "string" && item.horseId.toLowerCase() === horseId.toLowerCase());
}

export async function listTrainingPlans({ horseId = "", page = 1, pageSize = 20 } = {}) {
    const { data } = await api.get(root, { params: { page, pageSize, ...(horseId ? { horseId } : {}) } });
    if (!data || !Array.isArray(data.items) || !data.items.every((plan) => validPlan(plan))
        || !Number.isInteger(data.page) || !Number.isInteger(data.pageSize) || !Number.isInteger(data.total))
        throw new Error("The Training Plan list response is invalid.");
    return data;
}

export async function getTrainingPlan(id, { sessionPage = 1, sessionPageSize = 20 } = {}) {
    const { data } = await api.get(`${root}/${encodeURIComponent(id)}`, { params: { sessionPage, sessionPageSize } });
    if (!data?.plan || !validPlan(data.plan, { id }) || !Array.isArray(data.sessions)
        || !data.sessions.every((session) => validTrainingSession(session, { horseId: data.plan.horseId, planId: data.plan.id })) || !Array.isArray(data.restrictions)
        || !Number.isInteger(data.sessionPage) || !Number.isInteger(data.sessionPageSize) || !Number.isInteger(data.sessionTotal))
        throw new Error("The Training Plan detail response is invalid.");
    const horseDetail = await getHorse(data.plan.horseId);
    if (horseDetail?.horse?.id !== data.plan.horseId || !Array.isArray(horseDetail.assignments))
        throw new Error("The Horse context response is invalid.");
    return { ...data, horseDetail };
}

export async function listAllTrainerHorses() {
    const horses = [];
    let page = 1;
    for (;;) {
        const result = await listHorses({ page, pageSize: 100 });
        horses.push(...result.items);
        if (!result.items.length || result.page * result.pageSize >= result.total) break;
        if (result.page + 1 <= page) throw new Error("Unable to load assigned Horses.");
        page = result.page + 1;
    }
    return horses;
}

export async function createTrainingPlan(values, template) {
    if (Object.keys(validatePlan(values)).length) throw new Error("Check the Training Plan fields.");
    if (!template || template.id !== values.templateId || template.archived !== false) throw new Error("Choose an active Training Template.");
    const payload = planPayload(values);
    const { data } = await api.post(root, payload, { retryOnUnauthorized: false });
    if (!validPlan(data, { horseId: payload.horseId, templateId: payload.templateId }) || data.status !== "Active")
        throw uncertain("The plan may have been created, but the response could not be confirmed. Reload before trying again.");
    try { return await getTrainingPlan(data.id); }
    catch { throw uncertain("The plan was submitted, but its authoritative detail could not be loaded. Reload before trying again."); }
}

export async function updateTrainingPlan(detail, values) {
    const plan = detail?.plan;
    if (!validPlan(plan) || !["Active", "Paused"].includes(plan.status)) throw new Error("This Training Plan cannot be edited in its current state.");
    const complete = { ...values, horseId: plan.horseId, templateId: plan.templateId };
    if (Object.keys(validatePlan(complete)).length) throw new Error("Check the Training Plan fields.");
    const payload = planPayload(complete, plan);
    const { data } = await api.put(`${root}/${encodeURIComponent(plan.id)}`, payload, { retryOnUnauthorized: false });
    if (!validPlan(data, plan)) throw uncertain("The plan may have been updated, but the response could not be confirmed. Reload before trying again.");
    try { return await getTrainingPlan(plan.id); }
    catch { throw uncertain("The plan was updated, but its authoritative detail could not be loaded. Reload before continuing."); }
}

export async function updateTrainingPlanStatus(detail, status) {
    const plan = detail?.plan;
    if (!validPlan(plan) || !["Active", "Paused"].includes(plan.status)) throw new Error("Completed or archived plans cannot be reopened.");
    if (!TRAINING_PLAN_STATUSES.includes(status)) throw new Error("Choose a supported Training Plan status.");
    const { data } = await api.put(`${root}/${encodeURIComponent(plan.id)}/status`, { status }, { retryOnUnauthorized: false });
    if (!validPlan(data, plan) || data.status !== status) throw uncertain("The plan status may have changed, but the response could not be confirmed. Reload before trying again.");
    try { return await getTrainingPlan(plan.id); }
    catch { throw uncertain("The status changed, but the authoritative plan detail could not be loaded. Reload before continuing."); }
}

export function createPlanMutation(run) {
    let pending = false;
    let blocked = false;
    return async (...args) => {
        if (pending || blocked) return null;
        pending = true;
        try { return await run(...args); }
        catch (error) { blocked = isUncertainPlanMutationError(error); throw Object.assign(error, { requiresReload: blocked }); }
        finally { pending = false; }
    };
}
