import api from "./api.js";
import { canManagePlan, getTrainingPlan } from "./trainingPlanService.js";
import { TRAINING_SESSION_EDITABLE_STATUSES, TRAINING_SESSION_STATUSES } from "../constants/training.js";
import { isAssignedWorkRider, sessionForm, sessionInstant, sessionMedicalBlocks, sessionPayload, sessionResultPayload, validSessionDateTime,
    validSessionResult, validTrainingSession, validateSession, validateSessionResult, validateSkipReason } from "./trainingSessionModel.js";

const root = "/api/training/sessions";
function uncertain(message) { return Object.assign(new Error(message), { requiresReload: true }); }
function pageOptions(detail) { return { sessionPage: detail.sessionPage, sessionPageSize: detail.sessionPageSize }; }
async function refreshedPlan(detail) { return getTrainingPlan(detail.plan.id, pageOptions(detail)); }

export function isUncertainSessionMutationError(error) {
    return !!error?.requiresReload || !error?.status || [401, 403, 404, 409].includes(error.status) || error.status >= 500;
}

export async function listTrainingSessions({ horseId = "", status = "", from = "", to = "", page = 1, pageSize = 20 } = {}) {
    if (status && !TRAINING_SESSION_STATUSES.includes(status)) throw new Error("Choose a supported Training Session status.");
    if (from && !validSessionDateTime(from) || to && !validSessionDateTime(to)) throw new Error("Choose valid session date filters.");
    const { data } = await api.get(root, { params: { page, pageSize, ...(horseId ? { horseId } : {}), ...(status ? { status } : {}),
        ...(from ? { from: sessionInstant(from) } : {}), ...(to ? { to: sessionInstant(to) } : {}) } });
    if (!data || !Array.isArray(data.items) || !data.items.every((session) => validTrainingSession(session))
        || !Number.isInteger(data.page) || !Number.isInteger(data.pageSize) || !Number.isInteger(data.total))
        throw new Error("The Training Session list response is invalid.");
    return data;
}

export async function getTrainingSession(id) {
    const { data } = await api.get(`${root}/${encodeURIComponent(id)}`);
    if (!data || !validTrainingSession(data.session, { id }) || !("result" in data) || !("evaluation" in data)
        || data.result !== null && !validSessionResult(data.result, { sessionId: id }))
        throw new Error("The Training Session detail response is invalid.");
    return data;
}

export async function listWorkRiderCandidates() {
    const candidates = [];
    let page = 1;
    for (;;) {
        const { data } = await api.get("/api/staff/directory", { params: { role: "WorkRider", page, pageSize: 20 } });
        if (!data || !Array.isArray(data.items) || !Number.isInteger(data.page) || !Number.isInteger(data.pageSize) || !Number.isInteger(data.total))
            throw new Error("The WorkRider directory response is invalid.");
        candidates.push(...data.items.filter((person) => person?.role === "WorkRider" && typeof person.id === "string" && person.id));
        if (!data.items.length || data.page * data.pageSize >= data.total) break;
        if (data.page + 1 <= page) throw new Error("Unable to load WorkRider candidates.");
        page = data.page + 1;
    }
    return candidates;
}

function validateOperation(detail, values, rider) {
    if (detail?.plan?.status !== "Active") throw new Error("Sessions can be changed only while the Training Plan is Active.");
    if (Object.keys(validateSession(values)).length) throw new Error("Check the Training Session fields.");
    if (values.riderId && (!rider || rider.id !== values.riderId || rider.role !== "WorkRider")) throw new Error("Choose an eligible WorkRider.");
    if (sessionMedicalBlocks(detail.horseDetail, detail.restrictions, values).length) throw new Error("This session is blocked by the current health or applicable medical restrictions.");
}

export async function createTrainingSession(detail, values, rider) {
    validateOperation(detail, values, rider);
    const payload = sessionPayload(values);
    const { data } = await api.post(`/api/training/plans/${encodeURIComponent(detail.plan.id)}/sessions`, payload, { retryOnUnauthorized: false });
    const expectedStatus = payload.riderId ? "Assigned" : "Planned";
    if (!validTrainingSession(data, { horseId: detail.plan.horseId, planId: detail.plan.id }) || data.status !== expectedStatus)
        throw uncertain("The session may have been created, but the response could not be confirmed. Reload before trying again.");
    try { return await refreshedPlan(detail); }
    catch { throw uncertain("The session was submitted, but the authoritative plan could not be loaded. Reload before trying again."); }
}

export async function updateTrainingSession(detail, session, values, rider) {
    if (!validTrainingSession(session, { horseId: detail?.plan?.horseId, planId: detail?.plan?.id }) || !TRAINING_SESSION_EDITABLE_STATUSES.includes(session.status))
        throw new Error("Only unstarted Planned or Assigned sessions can be edited.");
    validateOperation(detail, values, rider);
    const payload = sessionPayload(values, session);
    const { data } = await api.put(`${root}/${encodeURIComponent(session.id)}`, payload, { retryOnUnauthorized: false });
    const expectedStatus = payload.riderId ? "Assigned" : "Planned";
    if (!validTrainingSession(data, session) || data.status !== expectedStatus)
        throw uncertain("The session may have been updated, but the response could not be confirmed. Reload before trying again.");
    try { return await refreshedPlan(detail); }
    catch { throw uncertain("The session was updated, but the authoritative plan could not be loaded. Reload before continuing."); }
}

export async function assignTrainingSession(detail, session, rider) {
    if (detail?.plan?.status !== "Active" || !validTrainingSession(session, { horseId: detail?.plan?.horseId, planId: detail?.plan?.id })
        || !TRAINING_SESSION_EDITABLE_STATUSES.includes(session.status)) throw new Error("Only unstarted sessions on an Active plan can be assigned.");
    if (!rider || rider.role !== "WorkRider" || typeof rider.id !== "string" || !rider.id) throw new Error("Choose an eligible WorkRider.");
    if (sessionMedicalBlocks(detail.horseDetail, detail.restrictions, sessionForm(session)).length)
        throw new Error("This session is blocked by the current health or applicable medical restrictions.");
    const { data } = await api.post(`${root}/${encodeURIComponent(session.id)}/assign`, { riderId: rider.id }, { retryOnUnauthorized: false });
    if (!validTrainingSession(data, session) || data.riderId !== rider.id || data.status !== "Assigned")
        throw uncertain("The rider assignment may have changed, but the response could not be confirmed. Reload before trying again.");
    try { return await refreshedPlan(detail); }
    catch { throw uncertain("The rider was assigned, but the authoritative plan could not be loaded. Reload before continuing."); }
}

function findRefreshedSession(detail, id, status) {
    const session = detail.sessions.find((item) => item.id === id);
    if (!session || session.status !== status) throw uncertain("The session changed, but the authoritative state could not be confirmed. Reload before continuing.");
    return detail;
}

async function refetchExecution(detail, session, status) {
    try { return findRefreshedSession(await refreshedPlan(detail), session.id, status); }
    catch (error) { throw error?.requiresReload ? error : uncertain("The session changed, but the authoritative plan could not be loaded. Reload before continuing."); }
}

export async function startTrainingSession(detail, session, user) {
    if (!isAssignedWorkRider(user, session)) throw new Error("Only the assigned WorkRider may start this session.");
    if (session.status !== "Assigned" || detail?.plan?.status !== "Active") throw new Error("Only an Assigned session on an Active plan can be started.");
    await api.post(`${root}/${encodeURIComponent(session.id)}/start`, undefined, { retryOnUnauthorized: false });
    return refetchExecution(detail, session, "InProgress");
}

export async function submitTrainingSessionResult(detail, session, user, values) {
    if (!isAssignedWorkRider(user, session)) throw new Error("Only the assigned WorkRider may submit this session result.");
    if (session.status !== "InProgress") throw new Error("Start this session before submitting its result.");
    if (Object.keys(validateSessionResult(values)).length) throw new Error("Check the Training Session result fields.");
    const payload = sessionResultPayload(values);
    const { data } = await api.post(`${root}/${encodeURIComponent(session.id)}/results`, payload, { retryOnUnauthorized: false });
    if (!validSessionResult(data, { sessionId: session.id }) || data.distanceMetres !== payload.distanceMetres || data.timeSeconds !== payload.timeSeconds
        || data.heartRate !== payload.heartRate || data.intensity !== payload.intensity || data.feedback !== payload.feedback
        || payload.abnormalObservation && data.abnormalObservation !== true)
        throw uncertain("The result may have been submitted, but the response could not be confirmed. Reload before trying again.");
    return refetchExecution(detail, session, data.abnormalObservation ? "IssueReported" : "Completed");
}

export async function skipTrainingSession(detail, session, user, reason) {
    const riderAllowed = isAssignedWorkRider(user, session);
    const trainerAllowed = canManagePlan(user, detail?.horseDetail);
    if (!riderAllowed && !trainerAllowed) throw new Error("Only the assigned WorkRider or current Trainer may skip this session.");
    if (!["Planned", "Assigned", "InProgress"].includes(session.status)) throw new Error("This Training Session is already final.");
    const error = validateSkipReason(reason);
    if (error) throw new Error(error);
    await api.post(`${root}/${encodeURIComponent(session.id)}/skip`, { reason: reason.trim() }, { retryOnUnauthorized: false });
    return refetchExecution(detail, session, "Skipped");
}

export function createSessionMutation(run) {
    let pending = false;
    let blocked = false;
    return async (...args) => {
        if (pending || blocked) return null;
        pending = true;
        try { return await run(...args); }
        catch (error) { blocked = isUncertainSessionMutationError(error); throw Object.assign(error, { requiresReload: blocked }); }
        finally { pending = false; }
    };
}
