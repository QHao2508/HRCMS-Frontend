import api from "./api.js";
import { getHorse } from "./horseService.js";
import { validDate } from "./registrationValidation.js";
import { INTAKE_LIMITS } from "../constants/registration.js";

export const ADMIN_ASSIGNMENT_ROLES = Object.freeze(["HeadTrainer", "Groom", "Veterinarian"]);
export const assignmentToday = () => new Intl.DateTimeFormat("sv-SE", { timeZone: INTAKE_LIMITS.timeZone }).format(new Date());
export const activeForRole = (assignments, role) => (assignments || []).filter((item) => item.active === true && item.role === role);
export function validateAssignment(values, assignments = [], today = assignmentToday()) {
    return validateFields(values, assignments, today, ADMIN_ASSIGNMENT_ROLES);
}
export function validateTrainerAssignment(values, assignments = [], today = assignmentToday()) {
    return validateFields(values, assignments, today, ["Trainer"]);
}
function validateFields(values, assignments, today, allowedRoles) {
    const errors = {};
    if (!allowedRoles.includes(values.role)) errors.role = "Choose a permitted assignment role.";
    if (!values.staffId) errors.staffId = "Choose an eligible staff member.";
    if (!validDate(values.startDate) || values.startDate === "0001-01-01") errors.startDate = "Enter a valid start date.";
    else if (values.startDate > today) errors.startDate = "Start date cannot be in the future.";
    else if (activeForRole(assignments, values.role).some((item) => values.startDate < item.startDate)) errors.startDate = "Replacement cannot start before the current assignment.";
    if (typeof values.notes !== "string" || values.notes.length > 2000) errors.notes = "Use at most 2000 characters.";
    return errors;
}
export async function listAssignmentCandidates(role) {
    if (!ADMIN_ASSIGNMENT_ROLES.includes(role)) throw new Error("Unsupported administrative assignment role.");
    return listCandidates(role);
}
export function listTrainerCandidates() { return listCandidates("Trainer"); }
async function listCandidates(role) {
    const candidates = [];
    let page = 1;
    for (;;) {
        const { data } = await api.get("/api/staff/directory", { params: { role, page, pageSize: 20 } });
        candidates.push(...data.items.filter((item) => item.role === role && item.active !== false));
        if (!data.items.length || data.page * data.pageSize >= data.total) break;
        if (data.page + 1 <= page) throw new Error("Unable to load staff candidates.");
        page = data.page + 1;
    }
    return candidates;
}
export async function assignAdministrativeStaff(horseId, values) {
    if (Object.keys(validateAssignment(values)).length) throw new Error("Check the assignment fields.");
    return postAssignment(horseId, values);
}
export async function assignTrainer(horseId, values) {
    if (Object.keys(validateTrainerAssignment(values)).length) throw new Error("Check the Trainer assignment fields.");
    return postAssignment(horseId, { ...values, role: "Trainer" });
}
function sameId(left, right) {
    return typeof left === "string" && left.length > 0 && typeof right === "string" && left.toLowerCase() === right.toLowerCase();
}
export function canAssignTrainer(user, data) {
    return user?.role === "HeadTrainer" && !!data?.horse?.id && !data.horse.archived
        && Array.isArray(data.assignments) && data.assignments.some((item) => item?.active === true
            && item.role === "HeadTrainer" && sameId(item.staffId, user.id) && sameId(item.horseId, data.horse.id));
}
async function postAssignment(horseId, values) {
    const { staffId, role, startDate, notes } = values;
    await api.post(`/api/horses/${encodeURIComponent(horseId)}/assignments`, { staffId, role, startDate, notes }, { retryOnUnauthorized: false });
    try {
        const detail = await getHorse(horseId);
        if (!detail?.horse || !Array.isArray(detail.assignments)) throw new Error("Invalid Horse response.");
        return detail;
    } catch {
        throw Object.assign(new Error("The assignment was submitted, but the updated profile could not be loaded. Reload before making another assignment."), { requiresReload: true });
    }
}
// Lock synchronously, including the interval before React renders disabled controls.
export function createAssignmentSubmission() {
    return submissionLock(assignAdministrativeStaff);
}
export function createTrainerSubmission() { return submissionLock(assignTrainer); }
function submissionLock(assign) {
    let pending = false;
    let blocked = false;
    return async (horseId, values) => {
        if (pending || blocked) return null;
        pending = true;
        try { return await assign(horseId, values); }
        catch (error) {
            blocked = error.status !== 400 || error.requiresReload === true;
            throw Object.assign(error, { requiresReload: blocked });
        } finally { pending = false; }
    };
}
