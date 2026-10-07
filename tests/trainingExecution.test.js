import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { setImmediate } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import axios from "axios";
import { ROLES } from "../src/constants/roles.js";

let server, api, store, service, model, Sessions, ResultForm, StartConfirmation, SkipForm;
const riderUser = { id: "rider-id", role: ROLES.WorkRider, active: true, emailVerified: true };
const trainerUser = { id: "trainer-id", role: ROLES.Trainer, active: true, emailVerified: true };
const plan = { id: "plan-id", horseId: "horse-id", trainerId: "recorded-id", templateId: "template-id", goal: "Condition", phase: "Base",
    startDate: "2026-10-01", endDate: "2026-11-30", notes: "", status: "Active" };
const assigned = { id: "session-id", horseId: plan.horseId, planId: plan.id, riderId: riderUser.id, scheduledAt: "2026-10-15T03:00:00Z",
    trainingType: "Trot", distanceMetres: 1200, intensity: "Moderate", surface: "Track", target: "Aerobic base", notes: "Steady", status: "Assigned", startedAt: null };
const horseDetail = { horse: { id: plan.horseId, healthStatus: "Fit", archived: false },
    assignments: [{ horseId: plan.horseId, staffId: trainerUser.id, role: "Trainer", active: true }], preferences: { preferredTrainerId: "other" } };
const detail = { plan, sessions: [assigned], restrictions: [], sessionPage: 1, sessionPageSize: 20, sessionTotal: 1, horseDetail };
const resultValues = { distanceMetres: "1000", timeSeconds: "125.5", heartRate: "", intensity: "Moderate", feedback: "Completed comfortably", abnormalObservation: false };
const result = { id: "result-id", sessionId: assigned.id, distanceMetres: 1000, timeSeconds: 125.5, speedMetresPerSecond: 7.968,
    heartRate: null, intensity: "Moderate", feedback: "Completed comfortably", abnormalObservation: false };
const reply = (config, data, status = 200) => ({ config, data, status, statusText: "", headers: {} });
function reject(config, status, data = { detail: "Execution failed." }) {
    throw new axios.AxiosError("Rejected", "ERR_BAD_RESPONSE", config, null, reply(config, data, status));
}
function plugin() {
    return { name: "training-execution-test-harness", enforce: "post", transform(code, id) {
        if (!id.replaceAll("\\", "/").includes("/src/")) return;
        return code.replaceAll('"react/jsx-dev-runtime"', '"virtual:execution-jsx"');
    }, resolveId(source) { if (source === "virtual:execution-jsx") return `\0${source}`; }, load(id) {
        if (id === "\0virtual:execution-jsx") return `import {jsxDEV as original} from 'react/jsx-dev-runtime'; export {Fragment} from 'react/jsx-dev-runtime';
            export function jsxDEV(type,props,...rest) { if(type==='button') globalThis.__execution.buttons.push(props); if(type==='form') globalThis.__execution.forms.push(props); return original(type,props,...rest); }`;
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
    ({ default: Sessions } = await server.ssrLoadModule("/src/components/training/TrainingSessions.jsx"));
    ({ TrainingResultForm: ResultForm, StartSessionConfirmation: StartConfirmation, SkipSessionForm: SkipForm }
        = await server.ssrLoadModule("/src/components/training/TrainingExecutionForms.jsx"));
});
beforeEach(() => {
    globalThis.__execution = { buttons: [], forms: [] };
    store.clearSession();
    store.setTokens({ accessToken: "execution-access", refreshToken: "execution-refresh", expiresIn: 3600 }, store.getSession().generation);
    store.setCurrentUser(riderUser, store.getSession().generation);
    api.defaults.adapter = async () => { throw new Error("Unexpected request; tests do not contact the backend."); };
});
after(async () => { await server?.close(); delete globalThis.__execution; });
function render(element) { return renderToStaticMarkup(element); }
function finalSession(status) { return { ...assigned, status, startedAt: status === "Assigned" ? null : "2026-10-15T03:01:00Z" }; }
function installExecutionAdapter(mutate, final) {
    const calls = [];
    api.defaults.adapter = async (config) => {
        calls.push(config);
        if (config.method !== "get") return mutate(config);
        if (config.url === "/api/training/plans/plan-id") return reply(config, { ...detail, sessions: [final], horseDetail: undefined });
        if (config.url === "/api/horses/horse-id") return reply(config, horseDetail);
        throw new Error(`Unexpected ${config.method} ${config.url}`);
    };
    return calls;
}

test("execution authority requires exact WorkRider role and matching riderId", () => {
    assert.equal(model.isAssignedWorkRider(riderUser, assigned), true);
    assert.equal(model.isAssignedWorkRider({ ...riderUser, id: "other-rider" }, assigned), false);
    assert.equal(model.isAssignedWorkRider({ ...riderUser, role: "Trainer" }, assigned), false);
    assert.equal(model.isAssignedWorkRider(riderUser, { ...assigned, riderId: null }), false);
    assert.equal(model.isAssignedWorkRider({ ...riderUser, id: "RIDER-ID" }, assigned), true);
});
test("assigned WorkRider sees start and skip, while wrong Rider and unrelated roles see no execution controls", () => {
    const allowed = render(h(Sessions, { detail, user: riderUser, canManage: false, busy: false, blocked: false }));
    assert.match(allowed, /Start session/); assert.match(allowed, /Skip session/); assert.doesNotMatch(allowed, /Submit result/);
    for (const user of [{ ...riderUser, id: "wrong" }, { id: "owner", role: "HorseOwner" }, { id: "manager", role: "ClubManager" },
        { id: "head", role: "HeadTrainer" }, { id: "vet", role: "Veterinarian" }, { id: "groom", role: "Groom" }]) {
        const html = render(h(Sessions, { detail, user, canManage: false, busy: false, blocked: false }));
        assert.doesNotMatch(html, /Start session|Submit result|Skip session/);
    }
});
test("Trainer receives verified skip and planning controls but no Rider-only start/result", () => {
    const html = render(h(Sessions, { detail, user: trainerUser, canManage: true, busy: false, blocked: false }));
    assert.match(html, />Edit</); assert.match(html, /Change rider/); assert.match(html, /Skip session/);
    assert.doesNotMatch(html, /Start session|Submit result/);
});
test("InProgress assigned Rider sees result and skip only", () => {
    const html = render(h(Sessions, { detail: { ...detail, sessions: [finalSession("InProgress")] }, user: riderUser, canManage: false, busy: false, blocked: false }));
    assert.match(html, /Submit result/); assert.match(html, /Skip session/); assert.doesNotMatch(html, /Start session|>Edit</);
});
for (const status of ["Completed", "Skipped", "IssueReported"]) {
    test(`${status} is terminal and exposes no execution controls`, () => {
        const html = render(h(Sessions, { detail: { ...detail, sessions: [finalSession(status)] }, user: riderUser, canManage: false, busy: false, blocked: false }));
        assert.match(html, /Read only after start \/ terminal/); assert.doesNotMatch(html, /Start session|Submit result|Skip session/);
    });
}
test("start uses exact POST path, empty body, replay opt-out and authoritative refetch", async () => {
    const started = finalSession("InProgress");
    const calls = installExecutionAdapter((config) => {
        assert.equal(config.method, "post"); assert.equal(config.url, "/api/training/sessions/session-id/start");
        assert.equal(config.data, undefined); assert.equal(config.retryOnUnauthorized, false); return reply(config, "", 204);
    }, started);
    assert.equal((await service.startTrainingSession(detail, assigned, riderUser)).sessions[0].status, "InProgress");
    assert.deepEqual(calls.map(({ method, url }) => `${method} ${url}`), ["post /api/training/sessions/session-id/start", "get /api/training/plans/plan-id", "get /api/horses/horse-id"]);
});
test("wrong Rider, Trainer, wrong status, and inactive plan cannot invoke start", async () => {
    let calls = 0; api.defaults.adapter = async () => { calls++; throw new Error("must not request"); };
    await assert.rejects(service.startTrainingSession(detail, assigned, { ...riderUser, id: "wrong" }), /assigned WorkRider/);
    await assert.rejects(service.startTrainingSession(detail, assigned, trainerUser), /assigned WorkRider/);
    await assert.rejects(service.startTrainingSession(detail, { ...assigned, status: "Planned" }, riderUser), /Only an Assigned/);
    await assert.rejects(service.startTrainingSession({ ...detail, plan: { ...plan, status: "Paused" } }, assigned, riderUser), /Active plan/);
    assert.equal(calls, 0);
});
test("start confirmation describes server timing without changing scheduledAt", () => {
    const html = render(h(StartConfirmation, { session: assigned, busy: false, onConfirm() {}, onCancel() {} }));
    assert.match(html, /early-start window/); assert.match(html, /will not be changed/); assert.match(html, new RegExp(assigned.scheduledAt));
});
test("early-start 409 is displayed as uncertainty without rescheduling or replay", async () => {
    const urls = [];
    api.defaults.adapter = async (config) => { urls.push(config.url); reject(config, 409, { detail: "Session is not due to start yet." }); };
    const mutation = service.createSessionMutation(() => service.startTrainingSession(detail, assigned, riderUser));
    await assert.rejects(mutation(), (error) => error.status === 409 && error.requiresReload);
    assert.equal(await mutation(), null); assert.deepEqual(urls, ["/api/training/sessions/session-id/start"]); assert.equal(assigned.scheduledAt, "2026-10-15T03:00:00Z");
});
test("duplicate start is synchronously locked", async () => {
    let release, calls = 0;
    const mutation = service.createSessionMutation(async () => { calls++; await new Promise((resolve) => { release = resolve; }); return detail; });
    const first = mutation(); assert.equal(await mutation(), null);
    while (!release) await new Promise((resolve) => setImmediate(resolve));
    release(); await first; assert.equal(calls, 1);
});
test("result validation accepts exact numeric boundaries and nullable heart rate", () => {
    for (const values of [{ ...resultValues, distanceMetres: "0", timeSeconds: "0.001", heartRate: "1", intensity: "Light" },
        { ...resultValues, distanceMetres: "100000", timeSeconds: "86400", heartRate: "300", intensity: "Heavy" }, resultValues])
        assert.deepEqual(model.validateSessionResult(values), {});
    for (const [field, value] of [["distanceMetres", -1], ["distanceMetres", 100001], ["timeSeconds", 0], ["timeSeconds", 86401],
        ["heartRate", 0], ["heartRate", 301], ["heartRate", 1.5], ["intensity", "Extreme"], ["feedback", " "]])
        assert.ok(model.validateSessionResult({ ...resultValues, [field]: value })[field], `${field} should fail`);
});
test("normal result sends exact DTO without speed and refetches Completed", async () => {
    const inProgress = finalSession("InProgress");
    const completed = finalSession("Completed");
    const calls = installExecutionAdapter((config) => {
        assert.equal(config.url, "/api/training/sessions/session-id/results"); assert.equal(config.retryOnUnauthorized, false);
        const body = JSON.parse(config.data);
        assert.deepEqual(body, { distanceMetres: 1000, timeSeconds: 125.5, heartRate: null, intensity: "Moderate", feedback: "Completed comfortably", abnormalObservation: false });
        assert.equal(body.speedMetresPerSecond, undefined); return reply(config, result);
    }, completed);
    assert.equal((await service.submitTrainingSessionResult({ ...detail, sessions: [inProgress] }, inProgress, riderUser, resultValues)).sessions[0].status, "Completed");
    assert.equal(calls.length, 3);
});
test("heart rate is sent only as nullable bounded integer", async () => {
    const inProgress = finalSession("InProgress");
    const completed = finalSession("Completed");
    const withHeart = { ...resultValues, heartRate: "155" };
    const returned = { ...result, heartRate: 155 };
    installExecutionAdapter((config) => { assert.equal(JSON.parse(config.data).heartRate, 155); return reply(config, returned); }, completed);
    await service.submitTrainingSessionResult({ ...detail, sessions: [inProgress] }, inProgress, riderUser, withHeart);
});
test("explicit abnormal result refetches IssueReported", async () => {
    const inProgress = finalSession("InProgress");
    const issue = finalSession("IssueReported");
    const abnormalValues = { ...resultValues, abnormalObservation: true };
    installExecutionAdapter((config) => reply(config, { ...result, abnormalObservation: true }), issue);
    assert.equal((await service.submitTrainingSessionResult({ ...detail, sessions: [inProgress] }, inProgress, riderUser, abnormalValues)).sessions[0].status, "IssueReported");
});
test("backend medical issue may promote a normal submission to IssueReported", async () => {
    const inProgress = finalSession("InProgress");
    const issue = finalSession("IssueReported");
    installExecutionAdapter((config) => { assert.equal(JSON.parse(config.data).abnormalObservation, false); return reply(config, { ...result, abnormalObservation: true }); }, issue);
    assert.equal((await service.submitTrainingSessionResult({ ...detail, sessions: [inProgress] }, inProgress, riderUser, resultValues)).sessions[0].status, "IssueReported");
});
test("wrong Rider and non-InProgress session cannot submit a result", async () => {
    const inProgress = finalSession("InProgress");
    await assert.rejects(service.submitTrainingSessionResult({ ...detail, sessions: [inProgress] }, inProgress, { ...riderUser, id: "wrong" }, resultValues), /assigned WorkRider/);
    await assert.rejects(service.submitTrainingSessionResult(detail, assigned, riderUser, resultValues), /Start this session/);
});
test("result form has no client speed field and explains abnormal final status", () => {
    const html = render(h(ResultForm, { session: finalSession("InProgress"), busy: false, onSave() {}, onCancel() {} }));
    assert.match(html, /Speed is calculated by the backend/); assert.match(html, /IssueReported/);
    assert.doesNotMatch(html, /id="result-speed|name="speedMetresPerSecond/);
});
test("WorkRider skip sends exact trimmed reason and refetches Skipped", async () => {
    const skipped = finalSession("Skipped");
    const calls = installExecutionAdapter((config) => {
        assert.equal(config.url, "/api/training/sessions/session-id/skip"); assert.equal(config.retryOnUnauthorized, false);
        assert.deepEqual(JSON.parse(config.data), { reason: "Unsafe footing" }); return reply(config, "", 204);
    }, skipped);
    assert.equal((await service.skipTrainingSession(detail, assigned, riderUser, "  Unsafe footing  ")).sessions[0].status, "Skipped");
    assert.equal(calls.length, 3);
});
test("current Trainer can skip Planned, Assigned, or InProgress sessions", async () => {
    for (const status of ["Planned", "Assigned", "InProgress"]) {
        const source = { ...finalSession(status), riderId: status === "Planned" ? null : riderUser.id };
        installExecutionAdapter((config) => reply(config, "", 204), { ...source, status: "Skipped" });
        assert.equal((await service.skipTrainingSession({ ...detail, sessions: [source] }, source, trainerUser, "Plan adjustment")).sessions[0].status, "Skipped");
    }
});
test("unassigned Rider, unrelated roles, terminal state, and invalid reason cannot skip", async () => {
    let calls = 0; api.defaults.adapter = async () => { calls++; throw new Error("must not request"); };
    await assert.rejects(service.skipTrainingSession(detail, assigned, { ...riderUser, id: "wrong" }, "Reason"), /assigned WorkRider or current Trainer/);
    await assert.rejects(service.skipTrainingSession(detail, assigned, { id: "owner", role: "HorseOwner" }, "Reason"), /assigned WorkRider or current Trainer/);
    await assert.rejects(service.skipTrainingSession(detail, { ...assigned, status: "Completed" }, riderUser, "Reason"), /already final/);
    await assert.rejects(service.skipTrainingSession(detail, assigned, riderUser, " "), /skip reason/);
    await assert.rejects(service.skipTrainingSession(detail, assigned, riderUser, "r".repeat(2001)), /skip reason/);
    assert.equal(calls, 0);
});
test("skip form requires an explicit reason and confirmation", async () => {
    let calls = 0;
    render(h(SkipForm, { session: assigned, busy: false, onSave() { calls++; }, onCancel() {} }));
    await globalThis.__execution.forms[0].onSubmit({ preventDefault() {} }); assert.equal(calls, 0);
    const html = render(h(SkipForm, { session: assigned, busy: false, onSave() {}, onCancel() {} }));
    assert.match(html, /marked Skipped/); assert.match(html, /Confirm skip/);
});
for (const status of [400, 403, 404, 409, 500]) {
    test(`${status} execution mutation is not replayed and preserves auth state`, async () => {
        let calls = 0; const previous = store.getSession();
        api.defaults.adapter = async (config) => { calls++; reject(config, status); };
        const mutation = service.createSessionMutation(() => service.startTrainingSession(detail, assigned, riderUser));
        await assert.rejects(mutation(), (error) => error.status === status && error.requiresReload === (status !== 400));
        if (status === 400) await assert.rejects(mutation()); else assert.equal(await mutation(), null);
        assert.equal(calls, status === 400 ? 2 : 1); assert.equal(store.getSession(), previous);
    });
}
test("401 refreshes auth but never replays an unsafe execution mutation", async () => {
    const urls = [];
    api.defaults.adapter = async (config) => {
        urls.push(config.url);
        if (config.url === "/api/auth/refresh") return reply(config, { accessToken: "renewed", refreshToken: "renewed-refresh", expiresIn: 3600 });
        reject(config, 401, { detail: "Expired." });
    };
    await assert.rejects(service.createSessionMutation(() => service.startTrainingSession(detail, assigned, riderUser))(), (error) => error.status === 401 && error.requiresReload);
    assert.deepEqual(urls, ["/api/training/sessions/session-id/start", "/api/auth/refresh"]);
});
test("network ambiguity blocks another execution attempt", async () => {
    let calls = 0; api.defaults.adapter = async (config) => { calls++; throw new axios.AxiosError("offline", "ERR_NETWORK", config); };
    const mutation = service.createSessionMutation(() => service.startTrainingSession(detail, assigned, riderUser));
    await assert.rejects(mutation(), (error) => error.requiresReload); assert.equal(await mutation(), null); assert.equal(calls, 1);
});
test("malformed result success is uncertain and never fabricates completion", async () => {
    const inProgress = finalSession("InProgress");
    api.defaults.adapter = async (config) => reply(config, { ...result, speedMetresPerSecond: undefined });
    await assert.rejects(service.submitTrainingSessionResult({ ...detail, sessions: [inProgress] }, inProgress, riderUser, resultValues), (error) => error.requiresReload);
});
test("failed or contradictory authoritative refetch after start is uncertain", async () => {
    api.defaults.adapter = async (config) => config.method === "post" ? reply(config, "", 204) : reply(config, null);
    await assert.rejects(service.startTrainingSession(detail, assigned, riderUser), (error) => error.requiresReload);
    installExecutionAdapter((config) => reply(config, "", 204), assigned);
    await assert.rejects(service.startTrainingSession(detail, assigned, riderUser), (error) => error.requiresReload);
});
test("execution service introduces no Evaluation or future-adjustment operation", () => {
    assert.equal(service.evaluateTrainingSession, undefined); assert.equal(service.adjustFutureSessions, undefined);
});
