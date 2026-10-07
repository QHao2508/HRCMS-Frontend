import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { setImmediate } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import axios from "axios";
import { ROLES } from "../src/constants/roles.js";

let server, api, store, service, model, constants, planService, Sessions, Form;
const trainer = { id: "trainer-id", role: ROLES.Trainer, active: true, emailVerified: true };
const plan = { id: "plan-id", horseId: "horse-id", trainerId: "recorded-id", templateId: "template-id", goal: "Condition",
    phase: "Base", startDate: "2026-10-01", endDate: "2026-11-30", notes: "", status: "Active" };
const session = { id: "session-id", horseId: plan.horseId, planId: plan.id, riderId: null, scheduledAt: "2026-10-15T03:00:00Z",
    trainingType: "Trot", distanceMetres: 1200, intensity: "Moderate", surface: "Track", target: "Aerobic base", notes: "Steady", status: "Planned", startedAt: null };
const horseDetail = { horse: { id: plan.horseId, healthStatus: "Fit", archived: false },
    assignments: [{ horseId: plan.horseId, staffId: trainer.id, role: "Trainer", active: true }], preferences: { preferredTrainerId: "preferred-id" } };
const detail = { plan, sessions: [session], restrictions: [], sessionPage: 1, sessionPageSize: 20, sessionTotal: 1, horseDetail };
const rider = { id: "rider-id", firstName: "Rae", lastName: "Rider", role: "WorkRider" };
const values = { scheduledAt: "2026-10-15T10:00:00", trainingType: "Trot", distanceMetres: "1200", intensity: "Moderate",
    surface: " Track ", target: " Aerobic base ", notes: "Steady", riderId: "" };
const reply = (config, data, status = 200) => ({ config, data, status, statusText: "", headers: {} });
function reject(config, status, data = { detail: "Session operation failed." }) {
    throw new axios.AxiosError("Rejected", "ERR_BAD_RESPONSE", config, null, reply(config, data, status));
}
function plugin() {
    return { name: "training-session-test-harness", enforce: "post", transform(code, id) {
        if (!id.replaceAll("\\", "/").includes("/src/")) return;
        return code.replaceAll('"react/jsx-dev-runtime"', '"virtual:sessions-jsx"');
    }, resolveId(source) { if (source === "virtual:sessions-jsx") return `\0${source}`; }, load(id) {
        if (id === "\0virtual:sessions-jsx") return `import {jsxDEV as original} from 'react/jsx-dev-runtime'; export {Fragment} from 'react/jsx-dev-runtime';
            export function jsxDEV(type,props,...rest) { if(type==='button') globalThis.__sessions.buttons.push(props); if(type==='form') globalThis.__sessions.forms.push(props); return original(type,props,...rest); }`;
    } };
}
before(async () => {
    const storage = new Map();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) } });
    server = await createServer({ configFile: false, plugins: [plugin(), react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom", logLevel: "error" });
    ({ default: api } = await server.ssrLoadModule("/src/services/api.js"));
    store = await server.ssrLoadModule("/src/services/sessionStore.js");
    service = await server.ssrLoadModule("/src/services/trainingSessionService.js");
    model = await server.ssrLoadModule("/src/services/trainingSessionModel.js");
    constants = await server.ssrLoadModule("/src/constants/training.js");
    planService = await server.ssrLoadModule("/src/services/trainingPlanService.js");
    ({ default: Sessions } = await server.ssrLoadModule("/src/components/training/TrainingSessions.jsx"));
    ({ default: Form } = await server.ssrLoadModule("/src/components/training/TrainingSessionForm.jsx"));
});
beforeEach(() => {
    globalThis.__sessions = { buttons: [], forms: [] };
    store.clearSession();
    store.setTokens({ accessToken: "session-access", refreshToken: "session-refresh", expiresIn: 3600 }, store.getSession().generation);
    store.setCurrentUser(trainer, store.getSession().generation);
    api.defaults.adapter = async () => { throw new Error("Unexpected request; tests do not contact the backend."); };
});
after(async () => { await server?.close(); delete globalThis.__sessions; });
function render(element) { return renderToStaticMarkup(element); }
function installMutationAdapter(mutate, refreshedSession = session) {
    const calls = [];
    api.defaults.adapter = async (config) => {
        calls.push(config);
        if (config.method !== "get") return mutate(config);
        if (config.url === "/api/training/plans/plan-id") return reply(config, { ...detail, sessions: [refreshedSession], horseDetail: undefined });
        if (config.url === "/api/horses/horse-id") return reply(config, horseDetail);
        throw new Error(`Unexpected ${config.method} ${config.url}`);
    };
    return calls;
}

test("session constants contain exact backend enum values", () => {
    assert.deepEqual(constants.TRAINING_TYPES, ["Walk", "Trot", "Canter", "Gallop", "Sprint", "Recovery"]);
    assert.deepEqual(constants.TRAINING_INTENSITIES, ["Light", "Moderate", "Heavy"]);
    assert.deepEqual(constants.TRAINING_SESSION_STATUSES, ["Planned", "Assigned", "InProgress", "Completed", "Skipped", "IssueReported"]);
    assert.deepEqual(constants.TRAINING_SESSION_EDITABLE_STATUSES, ["Planned", "Assigned"]);
});
test("session authority remains the current active Trainer assignment for this Horse", () => {
    assert.equal(planService.canManagePlan(trainer, horseDetail), true);
    assert.equal(planService.canManagePlan({ ...trainer, role: "WorkRider" }, horseDetail), false);
    assert.equal(planService.canManagePlan(trainer, { ...horseDetail, assignments: [{ ...horseDetail.assignments[0], active: false }] }), false);
    assert.equal(planService.canManagePlan(trainer, { ...horseDetail, assignments: [{ ...horseDetail.assignments[0], staffId: "replacement" }] }), false);
    assert.equal(planService.canManagePlan({ ...trainer, id: "preferred-id" }, { ...horseDetail, assignments: [] }), false);
});
test("session validation accepts exact enums and distance/text boundaries", () => {
    assert.deepEqual(model.validateSession(values), {});
    assert.deepEqual(model.validateSession({ ...values, trainingType: "Sprint", intensity: "Heavy", distanceMetres: "100000",
        surface: "s".repeat(4000), target: "t".repeat(4000), notes: "n".repeat(4000) }), {});
    for (const [field, value] of [["scheduledAt", "bad"], ["trainingType", "Run"], ["distanceMetres", 0], ["distanceMetres", 100001],
        ["distanceMetres", "nan"], ["intensity", "Extreme"], ["surface", " "], ["surface", "s".repeat(4001)], ["target", ""], ["notes", "n".repeat(4001)]])
        assert.ok(model.validateSession({ ...values, [field]: value })[field], `${field} should fail`);
});
test("unchanged edit timestamp is preserved exactly while a new local value becomes an ISO instant", () => {
    const form = model.sessionForm({ ...session, scheduledAt: "2026-10-15T03:00:00.1234567+00:00" });
    assert.equal(model.sessionPayload(form, { ...session, scheduledAt: "2026-10-15T03:00:00.1234567+00:00" }).scheduledAt, "2026-10-15T03:00:00.1234567+00:00");
    assert.match(model.sessionPayload(values).scheduledAt, /^2026-10-15T\d{2}:00:00\.000Z$/);
});
test("list uses only verified filters and explicit ISO timestamps", async () => {
    api.defaults.adapter = async (config) => {
        assert.equal(config.url, "/api/training/sessions");
        assert.deepEqual(config.params, { page: 2, pageSize: 10, horseId: "horse-id", status: "Assigned",
            from: new Date("2026-10-01T10:00:00").toISOString(), to: new Date("2026-10-31T10:00:00").toISOString() });
        return reply(config, { items: [{ ...session, riderId: rider.id, status: "Assigned" }], page: 2, pageSize: 10, total: 11 });
    };
    assert.equal((await service.listTrainingSessions({ horseId: "horse-id", status: "Assigned", from: "2026-10-01T10:00:00", to: "2026-10-31T10:00:00", page: 2, pageSize: 10, search: "ignored" })).total, 11);
});
test("session detail consumes the verified composite without adding execution behavior", async () => {
    api.defaults.adapter = async (config) => { assert.equal(config.url, "/api/training/sessions/session-id"); return reply(config, { session, result: null, evaluation: null }); };
    assert.deepEqual(await service.getTrainingSession(session.id), { session, result: null, evaluation: null });
});
test("malformed list and detail responses fail safely", async () => {
    for (const body of [null, {}, { items: [{ ...session, status: "Draft" }], page: 1, pageSize: 20, total: 1 }]) {
        api.defaults.adapter = async (config) => reply(config, body);
        await assert.rejects(service.listTrainingSessions());
    }
    api.defaults.adapter = async (config) => reply(config, { session, result: null });
    await assert.rejects(service.getTrainingSession(session.id));
});
test("WorkRider directory uses server role filtering, pagination, and exact-role fail closed", async () => {
    let request = 0;
    api.defaults.adapter = async (config) => {
        request++; assert.equal(config.url, "/api/staff/directory"); assert.deepEqual(config.params, { role: "WorkRider", page: request, pageSize: 20 });
        return reply(config, request === 1 ? { items: [rider, { ...rider, id: "trainer", role: "Trainer" }], page: 1, pageSize: 1, total: 2 }
            : { items: [{ ...rider, id: "rider-2" }], page: 2, pageSize: 1, total: 2 });
    };
    assert.deepEqual((await service.listWorkRiderCandidates()).map(({ id }) => id), ["rider-id", "rider-2"]);
});
test("create sends the exact full DTO, leaves rider nullable, and authoritatively refetches", async () => {
    const calls = installMutationAdapter((config) => {
        assert.equal(config.method, "post"); assert.equal(config.url, "/api/training/plans/plan-id/sessions"); assert.equal(config.retryOnUnauthorized, false);
        assert.deepEqual(JSON.parse(config.data), { scheduledAt: new Date(values.scheduledAt).toISOString(), trainingType: "Trot", distanceMetres: 1200,
            intensity: "Moderate", surface: "Track", target: "Aerobic base", notes: "Steady", riderId: null });
        return reply(config, session, 201);
    });
    assert.deepEqual(await service.createTrainingSession(detail, values, null), detail);
    assert.deepEqual(calls.map(({ method, url }) => `${method} ${url}`), ["post /api/training/plans/plan-id/sessions", "get /api/training/plans/plan-id", "get /api/horses/horse-id"]);
});
test("create with a verified WorkRider expects Assigned and generates no other operation", async () => {
    const assigned = { ...session, riderId: rider.id, status: "Assigned" };
    const assignedValues = { ...values, riderId: rider.id };
    const calls = installMutationAdapter((config) => {
        assert.equal(JSON.parse(config.data).riderId, rider.id); return reply(config, assigned, 201);
    }, assigned);
    assert.equal((await service.createTrainingSession(detail, assignedValues, rider)).sessions[0].status, "Assigned");
    assert.equal(calls.filter(({ method }) => method === "post").length, 1);
});
test("edit is full PUT, preserves identities outside the DTO and supports explicit unassignment", async () => {
    const assigned = { ...session, riderId: rider.id, status: "Assigned" };
    const editValues = { ...model.sessionForm(assigned), target: "Changed", riderId: "" };
    const calls = installMutationAdapter((config) => {
        assert.equal(config.method, "put"); assert.equal(config.url, "/api/training/sessions/session-id"); assert.equal(config.retryOnUnauthorized, false);
        const body = JSON.parse(config.data);
        assert.deepEqual(Object.keys(body).sort(), ["distanceMetres", "intensity", "notes", "riderId", "scheduledAt", "surface", "target", "trainingType"]);
        assert.equal(body.horseId, undefined); assert.equal(body.planId, undefined); assert.equal(body.status, undefined); assert.equal(body.riderId, null);
        return reply(config, { ...session, target: "Changed" });
    }, { ...session, target: "Changed" });
    assert.equal((await service.updateTrainingSession(detail, assigned, editValues, null)).sessions[0].target, "Changed");
    assert.equal(calls.length, 3);
});
test("separate rider assignment sends only riderId and authoritatively refetches", async () => {
    const assigned = { ...session, riderId: rider.id, status: "Assigned" };
    const calls = installMutationAdapter((config) => {
        assert.equal(config.method, "post"); assert.equal(config.url, "/api/training/sessions/session-id/assign"); assert.equal(config.retryOnUnauthorized, false);
        assert.deepEqual(JSON.parse(config.data), { riderId: rider.id }); return reply(config, assigned);
    }, assigned);
    assert.equal((await service.assignTrainingSession(detail, session, rider)).sessions[0].riderId, rider.id);
    assert.equal(calls.length, 3);
});
test("terminal, started, and non-Active-plan sessions cannot be managed", async () => {
    for (const status of ["InProgress", "Completed", "Skipped", "IssueReported"])
        await assert.rejects(service.updateTrainingSession(detail, { ...session, status }, values, null), /Only unstarted/);
    await assert.rejects(service.createTrainingSession({ ...detail, plan: { ...plan, status: "Paused" } }, values, null), /only while/);
    await assert.rejects(service.assignTrainingSession(detail, { ...session, status: "Completed" }, rider), /Only unstarted/);
});

function blocks(overrides = {}, restriction) {
    return model.sessionMedicalBlocks({ ...horseDetail, horse: { ...horseDetail.horse, ...overrides } }, restriction ? [restriction] : [], values);
}
test("medical guard distinguishes isolated and injured-Heavy health blocks", () => {
    assert.deepEqual(blocks({ healthStatus: "Isolated" }).map(({ code }) => code), ["isolated"]);
    assert.deepEqual(model.sessionMedicalBlocks({ ...horseDetail, horse: { ...horseDetail.horse, healthStatus: "Injured" } }, [], { ...values, intensity: "Heavy" }).map(({ code }) => code), ["injured-heavy"]);
    assert.deepEqual(blocks({ healthStatus: "Injured" }), []);
});
const activeRestriction = { id: "restriction-id", validFrom: "2026-10-01T00:00:00Z", validUntil: "2026-10-31T23:59:59Z", reason: "Recovery", cleared: false };
for (const [name, restriction, changed, code] of [
    ["trainingLock blocks only Heavy", { trainingLock: true }, { intensity: "Heavy" }, "training-lock"],
    ["blockAll blocks every session", { blockAllTraining: true }, {}, "block-all"],
    ["maxIntensity uses backend enum ordering", { maxIntensity: "Light" }, { intensity: "Moderate" }, "max-intensity"],
    ["maxDistance blocks excess distance", { maxDistanceMetres: 1000 }, { distanceMetres: "1001" }, "max-distance"],
    ["noSprint blocks Sprint", { noSprint: true }, { trainingType: "Sprint" }, "no-sprint"],
]) test(name, () => {
    const result = model.sessionMedicalBlocks(horseDetail, [{ ...activeRestriction, ...restriction }], { ...values, ...changed });
    assert.ok(result.some((block) => block.code === code));
});
test("future, expired and cleared restrictions are not treated as applicable", () => {
    for (const restriction of [{ ...activeRestriction, validFrom: "2026-11-01T00:00:00Z", blockAllTraining: true },
        { ...activeRestriction, validUntil: "2026-10-01T00:00:00Z", blockAllTraining: true }, { ...activeRestriction, cleared: true, blockAllTraining: true }])
        assert.deepEqual(model.sessionMedicalBlocks(horseDetail, [restriction], values), []);
});
test("medical blocks stop create locally without a request or override", async () => {
    let calls = 0; api.defaults.adapter = async () => { calls++; throw new Error("must not request"); };
    await assert.rejects(service.createTrainingSession({ ...detail, horseDetail: { ...horseDetail, horse: { ...horseDetail.horse, healthStatus: "Isolated" } } }, values, null), /blocked/);
    assert.equal(calls, 0);
    const html = render(h(Form, { detail: { ...detail, restrictions: [{ ...activeRestriction, blockAllTraining: true }] }, session: { ...session, ...model.sessionPayload(values) },
        candidates: { loading: false, data: [], reload() {} }, busy: false, onSave() {}, onCancel() {} }));
    assert.match(html, /Session blocked/); assert.match(html, /no medical override/i); assert.doesNotMatch(html, /Override restriction|Proceed anyway/);
});
test("Plan detail pagination consumes its returned sessions without an invented child-list call", async () => {
    const assigned = { ...session, riderId: rider.id, status: "Assigned" };
    const urls = [];
    api.defaults.adapter = async (config) => {
        urls.push(config.url);
        if (config.url === "/api/training/plans/plan-id") { assert.deepEqual(config.params, { sessionPage: 2, sessionPageSize: 5 }); return reply(config, { ...detail, sessions: [assigned], horseDetail: undefined, sessionPage: 2, sessionPageSize: 5, sessionTotal: 6 }); }
        return reply(config, horseDetail);
    };
    assert.equal((await planService.getTrainingPlan(plan.id, { sessionPage: 2, sessionPageSize: 5 })).sessions[0].id, session.id);
    assert.deepEqual(urls, ["/api/training/plans/plan-id", "/api/horses/horse-id"]);
});
test("read-only roles and terminal states receive no Trainer management controls", () => {
    const readOnly = render(h(Sessions, { detail, canManage: false, busy: false, blocked: false }));
    assert.doesNotMatch(readOnly, /Create Training Session|>Edit<|Assign rider/);
    const terminal = render(h(Sessions, { detail: { ...detail, sessions: [{ ...session, status: "Completed" }] }, canManage: true, busy: false, blocked: false }));
    assert.match(terminal, /Read only after start/); assert.doesNotMatch(terminal, />Edit<|Assign rider/);
    const paused = render(h(Sessions, { detail: { ...detail, plan: { ...plan, status: "Paused" } }, canManage: true, busy: false, blocked: false }));
    assert.match(paused, /read-only unless the Training Plan is Active/); assert.doesNotMatch(paused, /Create Training Session/);
});
test("synchronous mutation lock prevents duplicate session submissions", async () => {
    let release, calls = 0;
    const mutation = service.createSessionMutation(async () => { calls++; await new Promise((resolve) => { release = resolve; }); return detail; });
    const first = mutation(); assert.equal(await mutation(), null);
    while (!release) await new Promise((resolve) => setImmediate(resolve));
    release(); assert.deepEqual(await first, detail); assert.equal(calls, 1);
});
for (const status of [400, 403, 404, 409, 500]) {
    test(`${status} session mutation is not replayed and preserves session state`, async () => {
        let calls = 0; const previous = store.getSession();
        api.defaults.adapter = async (config) => { calls++; reject(config, status); };
        const mutation = service.createSessionMutation(() => service.createTrainingSession(detail, values, null));
        await assert.rejects(mutation(), (error) => error.status === status && error.requiresReload === (status !== 400));
        if (status === 400) await assert.rejects(mutation()); else assert.equal(await mutation(), null);
        assert.equal(calls, status === 400 ? 2 : 1); assert.equal(store.getSession(), previous);
    });
}
test("exact timestamp conflict 409 is never rescheduled or retried", async () => {
    const bodies = [];
    api.defaults.adapter = async (config) => { bodies.push(JSON.parse(config.data)); reject(config, 409, { detail: "Rider already has a session at this time." }); };
    const mutation = service.createSessionMutation(() => service.createTrainingSession(detail, { ...values, riderId: rider.id }, rider));
    await assert.rejects(mutation(), (error) => error.status === 409 && error.requiresReload);
    assert.equal(await mutation(), null); assert.equal(bodies.length, 1); assert.equal(bodies[0].scheduledAt, new Date(values.scheduledAt).toISOString());
});
test("401 refreshes tokens but never replays unsafe session creation", async () => {
    const urls = [];
    api.defaults.adapter = async (config) => {
        urls.push(config.url);
        if (config.url === "/api/auth/refresh") return reply(config, { accessToken: "renewed", refreshToken: "renewed-refresh", expiresIn: 3600 });
        reject(config, 401, { detail: "Expired." });
    };
    await assert.rejects(service.createSessionMutation(() => service.createTrainingSession(detail, values, null))(), (error) => error.status === 401 && error.requiresReload);
    assert.deepEqual(urls, ["/api/training/plans/plan-id/sessions", "/api/auth/refresh"]);
});
test("network uncertainty blocks another session mutation", async () => {
    let calls = 0; api.defaults.adapter = async (config) => { calls++; throw new axios.AxiosError("offline", "ERR_NETWORK", config); };
    const mutation = service.createSessionMutation(() => service.createTrainingSession(detail, values, null));
    await assert.rejects(mutation(), (error) => error.requiresReload); assert.equal(await mutation(), null); assert.equal(calls, 1);
});
test("malformed success and failed authoritative refetch are uncertain", async () => {
    api.defaults.adapter = async (config) => reply(config, { ...session, status: "Draft" }, 201);
    await assert.rejects(service.createTrainingSession(detail, values, null), (error) => error.requiresReload);
    api.defaults.adapter = async (config) => config.method === "post" ? reply(config, session, 201) : reply(config, null);
    await assert.rejects(service.createTrainingSession(detail, values, null), (error) => error.requiresReload);
});
test("training service introduces no evaluation or future-adjustment operation", () => {
    for (const name of ["evaluateTrainingSession", "adjustFutureSessions"])
        assert.equal(service[name], undefined);
});
