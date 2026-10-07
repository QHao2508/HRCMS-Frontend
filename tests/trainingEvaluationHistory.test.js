import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { setImmediate } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import axios from "axios";
import { ROLES } from "../src/constants/roles.js";

let server, api, store, sessionService, planService, model, constants, EvaluationContent, EvaluationForm, HistoryResult, Sessions, DetailContent;
const trainer = { id: "trainer-id", role: ROLES.Trainer, active: true, emailVerified: true };
const rider = { id: "rider-id", role: ROLES.WorkRider, active: true, emailVerified: true };
const plan = { id: "plan-id", horseId: "horse-id", trainerId: "recorded-id", templateId: "template-id", goal: "Condition", phase: "Base",
    startDate: "2026-10-01", endDate: "2026-11-30", notes: "", status: "Active" };
const session = { id: "session-id", horseId: plan.horseId, planId: plan.id, riderId: rider.id, scheduledAt: "2026-10-15T03:00:00Z",
    trainingType: "Trot", distanceMetres: 1200, intensity: "Moderate", surface: "Track", target: "Aerobic base", notes: "Steady",
    status: "Completed", startedAt: "2026-10-15T03:01:00Z" };
const result = { id: "result-id", sessionId: session.id, distanceMetres: 1000, timeSeconds: 125.5, speedMetresPerSecond: 7.968,
    heartRate: null, intensity: "Moderate", feedback: "Completed comfortably", abnormalObservation: false };
const evaluation = { id: "evaluation-id", sessionId: session.id, trainerId: trainer.id, comment: "Keep the steady progression.",
    adjustFutureSessions: true, createdAt: "2026-10-15T04:00:00Z", version: 0 };
const horseDetail = { horse: { id: plan.horseId, healthStatus: "Fit", archived: false },
    assignments: [{ horseId: plan.horseId, staffId: trainer.id, role: ROLES.Trainer, active: true }] };
const detail = { plan, sessions: [session], restrictions: [], sessionPage: 1, sessionPageSize: 20, sessionTotal: 1, horseDetail };
const sessionDetail = { session, result, evaluation: null };
const values = { comment: "  Keep the steady progression.  ", adjustFutureSessions: true };
const revision = { id: "revision-id", planId: plan.id, sessionId: session.id, actorId: trainer.id,
    snapshot: JSON.stringify({ session, result, evaluation }), createdAt: "2026-10-15T04:00:00Z", version: 0 };
const reply = (config, data, status = 200) => ({ config, data, status, statusText: "", headers: {} });
function reject(config, status, data = { detail: "Evaluation failed." }) {
    throw new axios.AxiosError("Rejected", "ERR_BAD_RESPONSE", config, null, reply(config, data, status));
}
function plugin() {
    return { name: "training-evaluation-test-harness", enforce: "post", transform(code, id) {
        if (!id.replaceAll("\\", "/").includes("/src/")) return;
        return code.replaceAll('"react/jsx-dev-runtime"', '"virtual:evaluation-jsx"');
    }, resolveId(source) { if (source === "virtual:evaluation-jsx") return `\0${source}`; }, load(id) {
        if (id === "\0virtual:evaluation-jsx") return `import {jsxDEV as original} from 'react/jsx-dev-runtime'; export {Fragment} from 'react/jsx-dev-runtime';
            export function jsxDEV(type,props,...rest) { if(type==='button') globalThis.__evaluation.buttons.push(props); if(type==='form') globalThis.__evaluation.forms.push(props); return original(type,props,...rest); }`;
    } };
}
before(async () => {
    const storage = new Map();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) } });
    server = await createServer({ configFile: false, plugins: [plugin(), react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom", logLevel: "error" });
    ({ default: api } = await server.ssrLoadModule("/src/services/api.js"));
    store = await server.ssrLoadModule("/src/services/sessionStore.js");
    sessionService = await server.ssrLoadModule("/src/services/trainingSessionService.js");
    planService = await server.ssrLoadModule("/src/services/trainingPlanService.js");
    model = await server.ssrLoadModule("/src/services/trainingSessionModel.js");
    constants = await server.ssrLoadModule("/src/constants/training.js");
    ({ SessionReviewContent: EvaluationContent, TrainerEvaluationForm: EvaluationForm } = await server.ssrLoadModule("/src/components/training/TrainerEvaluation.jsx"));
    ({ TrainingHistoryResult: HistoryResult } = await server.ssrLoadModule("/src/components/training/TrainingHistory.jsx"));
    ({ default: Sessions } = await server.ssrLoadModule("/src/components/training/TrainingSessions.jsx"));
    ({ TrainingPlanDetailContent: DetailContent } = await server.ssrLoadModule("/src/pages/training/TrainingPlanDetail.jsx"));
});
beforeEach(() => {
    globalThis.__evaluation = { buttons: [], forms: [] };
    store.clearSession();
    store.setTokens({ accessToken: "evaluation-access", refreshToken: "evaluation-refresh", expiresIn: 3600 }, store.getSession().generation);
    store.setCurrentUser(trainer, store.getSession().generation);
    api.defaults.adapter = async () => { throw new Error("Unexpected request; tests do not contact the backend."); };
});
after(async () => { await server?.close(); delete globalThis.__evaluation; });
const render = (element) => renderToStaticMarkup(element);

test("history roles exactly match the backend authorization list", () => {
    assert.deepEqual(constants.TRAINING_HISTORY_ROLES, [ROLES.ClubManager, ROLES.HorseOwner, ROLES.HeadTrainer, ROLES.Trainer, ROLES.Veterinarian]);
    assert.equal(constants.TRAINING_HISTORY_ROLES.includes(ROLES.WorkRider), false);
    assert.equal(constants.TRAINING_HISTORY_ROLES.includes(ROLES.Groom), false);
});
test("history uses the verified endpoint and page envelope", async () => {
    api.defaults.adapter = async (config) => {
        assert.equal(config.method, "get"); assert.equal(config.url, "/api/training/plans/plan-id/history");
        assert.deepEqual(config.params, { page: 2, pageSize: 10 });
        return reply(config, { items: [revision], page: 2, pageSize: 10, total: 11 });
    };
    assert.deepEqual((await planService.listTrainingHistory(plan.id, { page: 2, pageSize: 10 })).items, [revision]);
});
test("history rejects malformed revisions and mismatched plan IDs", async () => {
    for (const item of [{ ...revision, planId: "other-plan" }, { ...revision, snapshot: "" }, { ...revision, createdAt: "not-a-date" }, { ...revision, sessionId: 12 }]) {
        api.defaults.adapter = async (config) => reply(config, { items: [item], page: 1, pageSize: 20, total: 1 });
        await assert.rejects(planService.listTrainingHistory(plan.id), /History response is invalid/);
    }
});
test("history renders backend metadata and the recorded JSON snapshot read-only", () => {
    const html = render(h(HistoryResult, { resource: { loading: false, data: { items: [revision], page: 1, pageSize: 20, total: 1 } }, onPage() {} }));
    assert.match(html, /Training Session revision/); assert.match(html, /trainer-id/); assert.match(html, /session-id/);
    assert.match(html, /View recorded snapshot/); assert.match(html, /Completed comfortably/); assert.doesNotMatch(html, /Edit|Delete/);
});
test("history loading, empty, and safe error states provide no mutation controls", () => {
    assert.match(render(h(HistoryResult, { resource: { loading: true }, onPage() {} })), /Loading Training History/);
    const empty = render(h(HistoryResult, { resource: { loading: false, data: { items: [], page: 1, pageSize: 20, total: 0 } }, onPage() {} }));
    assert.match(empty, /No Training History is recorded/); assert.doesNotMatch(empty, /Edit|Delete/);
    let retried = 0;
    const failed = render(h(HistoryResult, { resource: { loading: false, error: new Error("Unavailable"), reload() { retried++; } }, onPage() {} }));
    assert.match(failed, /Retry Training History/);
    globalThis.__evaluation.buttons.find((button) => button.children === "Retry Training History").onClick(); assert.equal(retried, 1);
});
test("history pagination uses only the returned page metadata", () => {
    let selected = 0;
    render(h(HistoryResult, { resource: { loading: false, data: { items: [revision], page: 1, pageSize: 1, total: 2 } }, onPage: (page) => { selected = page; } }));
    const next = globalThis.__evaluation.buttons.find((button) => button.children === "Next history");
    assert.equal(next.disabled, false); next.onClick(); assert.equal(selected, 2);
});
test("evaluation validation requires a trimmed comment within the backend string limit", () => {
    assert.deepEqual(model.validateTrainerEvaluation(values), {});
    assert.ok(model.validateTrainerEvaluation({ comment: " ", adjustFutureSessions: false }).comment);
    assert.ok(model.validateTrainerEvaluation({ comment: "x".repeat(4001), adjustFutureSessions: false }).comment);
    assert.ok(model.validateTrainerEvaluation({ comment: "valid", adjustFutureSessions: "yes" }).adjustFutureSessions);
    assert.deepEqual(model.trainerEvaluationPayload(values), { comment: "Keep the steady progression.", adjustFutureSessions: true });
});
test("session detail validates a returned evaluation", async () => {
    api.defaults.adapter = async (config) => reply(config, { session, result, evaluation });
    assert.equal((await sessionService.getTrainingSession(session.id)).evaluation.id, evaluation.id);
    api.defaults.adapter = async (config) => reply(config, { session, result, evaluation: { ...evaluation, trainerId: "" } });
    await assert.rejects(sessionService.getTrainingSession(session.id), /detail response is invalid/);
});
test("evaluation sends only the exact DTO and confirms it with authoritative session detail", async () => {
    const calls = [];
    api.defaults.adapter = async (config) => {
        calls.push(config);
        if (config.method === "post") {
            assert.equal(config.url, "/api/training/sessions/session-id/evaluation"); assert.equal(config.retryOnUnauthorized, false);
            assert.deepEqual(JSON.parse(config.data), { comment: "Keep the steady progression.", adjustFutureSessions: true });
            return reply(config, evaluation);
        }
        assert.equal(config.url, "/api/training/sessions/session-id"); return reply(config, { session, result, evaluation });
    };
    assert.equal((await sessionService.evaluateTrainingSession(detail, sessionDetail, trainer, values)).evaluation.id, evaluation.id);
    assert.deepEqual(calls.map(({ method, url }) => `${method} ${url}`), ["post /api/training/sessions/session-id/evaluation", "get /api/training/sessions/session-id"]);
    assert.equal(sessionService.adjustFutureSessions, undefined);
});
test("evaluation authority and state checks fail locally", async () => {
    let calls = 0; api.defaults.adapter = async () => { calls++; throw new Error("must not request"); };
    await assert.rejects(sessionService.evaluateTrainingSession(detail, sessionDetail, { ...trainer, id: "other" }, values), /current Trainer/);
    await assert.rejects(sessionService.evaluateTrainingSession(detail, { ...sessionDetail, session: { ...session, status: "InProgress" } }, trainer, values), /completed session/);
    await assert.rejects(sessionService.evaluateTrainingSession(detail, { ...sessionDetail, result: null }, trainer, values), /completed session/);
    await assert.rejects(sessionService.evaluateTrainingSession(detail, { ...sessionDetail, evaluation }, trainer, values), /already has an evaluation/);
    assert.equal(calls, 0);
});
test("plan creator, preferences, inactive assignments, and replaced Trainers grant no evaluation authority", async () => {
    let calls = 0; api.defaults.adapter = async () => { calls++; throw new Error("must not request"); };
    const noCurrentAssignment = { ...detail, plan: { ...plan, trainerId: trainer.id }, horseDetail: { ...horseDetail,
        assignments: [{ horseId: plan.horseId, staffId: "replacement", role: ROLES.Trainer, active: true }], preferences: { preferredTrainerId: trainer.id } } };
    await assert.rejects(sessionService.evaluateTrainingSession(noCurrentAssignment, sessionDetail, trainer, values), /current Trainer/);
    const inactive = { ...detail, horseDetail: { ...horseDetail, assignments: [{ ...horseDetail.assignments[0], active: false }], preferences: { preferredTrainerId: trainer.id } } };
    await assert.rejects(sessionService.evaluateTrainingSession(inactive, sessionDetail, trainer, values), /current Trainer/);
    assert.equal(calls, 0);
});
test("IssueReported is eligible while Planned, Assigned, InProgress, and Skipped are denied", async () => {
    api.defaults.adapter = async (config) => config.method === "post" ? reply(config, evaluation)
        : reply(config, { session: { ...session, status: "IssueReported" }, result: { ...result, abnormalObservation: true }, evaluation });
    const issueDetail = { ...sessionDetail, session: { ...session, status: "IssueReported" }, result: { ...result, abnormalObservation: true } };
    assert.equal((await sessionService.evaluateTrainingSession(detail, issueDetail, trainer, values)).session.status, "IssueReported");
    let calls = 0; api.defaults.adapter = async () => { calls++; throw new Error("must not request"); };
    for (const status of ["Planned", "Assigned", "InProgress", "Skipped"])
        await assert.rejects(sessionService.evaluateTrainingSession(detail, { ...sessionDetail, session: { ...session, status } }, trainer, values), /completed session/);
    assert.equal(calls, 0);
});
test("evaluation mutation lock blocks a second synchronous POST", async () => {
    let release, posts = 0;
    api.defaults.adapter = async (config) => {
        if (config.method === "post") { posts++; await new Promise((resolve) => { release = resolve; }); return reply(config, evaluation); }
        return reply(config, { session, result, evaluation });
    };
    const mutation = sessionService.createSessionMutation(() => sessionService.evaluateTrainingSession(detail, sessionDetail, trainer, values));
    const first = mutation(); assert.equal(await mutation(), null);
    while (!release) await new Promise((resolve) => setImmediate(resolve));
    release(); await first; assert.equal(posts, 1);
});
for (const status of [403, 404, 409, 500]) {
    test(`${status} evaluation failure is uncertain, not replayed, and locks the mutation`, async () => {
        let calls = 0;
        api.defaults.adapter = async (config) => { calls++; reject(config, status, { type: status === 409 ? "duplicate_evaluation" : "error", detail: "Evaluation failed." }); };
        const mutation = sessionService.createSessionMutation(() => sessionService.evaluateTrainingSession(detail, sessionDetail, trainer, values));
        await assert.rejects(mutation(), (error) => error.status === status && error.requiresReload);
        assert.equal(await mutation(), null); assert.equal(calls, 1);
    });
}
test("400 evaluation remains correctable while network and malformed success become uncertain", async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => { calls++; reject(config, 400); };
    const correctable = sessionService.createSessionMutation(() => sessionService.evaluateTrainingSession(detail, sessionDetail, trainer, values));
    await assert.rejects(correctable(), (error) => error.status === 400 && !error.requiresReload);
    await assert.rejects(correctable()); assert.equal(calls, 2);
    api.defaults.adapter = async (config) => { throw new axios.AxiosError("offline", "ERR_NETWORK", config); };
    const uncertain = sessionService.createSessionMutation(() => sessionService.evaluateTrainingSession(detail, sessionDetail, trainer, values));
    await assert.rejects(uncertain(), (error) => error.requiresReload); assert.equal(await uncertain(), null);
    api.defaults.adapter = async (config) => reply(config, { ...evaluation, sessionId: "other" });
    await assert.rejects(sessionService.evaluateTrainingSession(detail, sessionDetail, trainer, values), (error) => error.requiresReload);
});
test("401 may refresh authentication but never replays the evaluation POST", async () => {
    const urls = [];
    api.defaults.adapter = async (config) => {
        urls.push(config.url);
        if (config.url === "/api/auth/refresh") return reply(config, { accessToken: "renewed", refreshToken: "renewed-refresh", expiresIn: 3600 });
        reject(config, 401, { detail: "Expired." });
    };
    const mutation = sessionService.createSessionMutation(() => sessionService.evaluateTrainingSession(detail, sessionDetail, trainer, values));
    await assert.rejects(mutation(), (error) => error.status === 401 && error.requiresReload);
    assert.deepEqual(urls, ["/api/training/sessions/session-id/evaluation", "/api/auth/refresh"]);
});
test("failed or contradictory authoritative evaluation refetch is uncertain", async () => {
    api.defaults.adapter = async (config) => config.method === "post" ? reply(config, evaluation) : reply(config, { session, result, evaluation: null });
    await assert.rejects(sessionService.evaluateTrainingSession(detail, sessionDetail, trainer, values), (error) => error.requiresReload);
});
test("session review displays result and existing evaluation without edit controls", () => {
    const html = render(h(EvaluationContent, { initialDetail: { session, result, evaluation }, planDetail: detail, user: trainer, canEvaluate: true, onClose() {} }));
    assert.match(html, /Backend-calculated speed/); assert.match(html, /Completed comfortably/); assert.match(html, /Keep the steady progression/);
    assert.match(html, /Future sessions may need adjustment/); assert.doesNotMatch(html, /Submit evaluation|Edit evaluation|Delete evaluation/);
});
test("current Trainer receives a single evaluation form and its flag explains stored behavior", () => {
    const html = render(h(EvaluationContent, { initialDetail: sessionDetail, planDetail: detail, user: trainer, canEvaluate: true, onClose() {} }));
    assert.match(html, /Submit evaluation/); assert.match(html, /does not automatically change future sessions/);
    const readOnly = render(h(EvaluationContent, { initialDetail: sessionDetail, planDetail: detail, user: { id: "owner", role: ROLES.HorseOwner }, canEvaluate: false, onClose() {} }));
    assert.match(readOnly, /No Trainer Evaluation has been recorded/); assert.doesNotMatch(readOnly, /Submit evaluation/);
});
test("evaluation form does not submit empty comments", async () => {
    let saves = 0;
    render(h(EvaluationForm, { busy: false, onSave() { saves++; }, onCancel() {} }));
    await globalThis.__evaluation.forms[0].onSubmit({ preventDefault() {} }); assert.equal(saves, 0);
});
test("terminal session review is visible to scoped readers and only the assigned WorkRider", () => {
    const props = { detail, canManage: false, busy: false, blocked: false, onReview() {}, onPage() {} };
    for (const role of [ROLES.ClubManager, ROLES.HorseOwner, ROLES.HeadTrainer, ROLES.Trainer, ROLES.Veterinarian])
        assert.match(render(h(Sessions, { ...props, user: { id: role, role } })), /Review result/);
    assert.match(render(h(Sessions, { ...props, user: rider })), /Review result/);
    assert.doesNotMatch(render(h(Sessions, { ...props, user: { ...rider, id: "other-rider" } })), /Review result/);
});
test("plan detail exposes history only to the five backend-authorized roles", () => {
    const callbacks = { onSessionPage() {}, onReviewSession() {} };
    for (const role of constants.TRAINING_HISTORY_ROLES) {
        const html = render(h(DetailContent, { detail, user: { id: role, role }, canManage: false, editing: false, busy: false, ...callbacks }));
        assert.match(html, /Training History/);
    }
    for (const role of [ROLES.WorkRider, ROLES.Groom, "UnknownRole"]) {
        const html = render(h(DetailContent, { detail, user: { id: role, role }, canManage: false, editing: false, busy: false, ...callbacks }));
        assert.doesNotMatch(html, /Training History/);
    }
});
