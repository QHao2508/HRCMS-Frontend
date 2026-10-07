import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { setImmediate } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import axios from "axios";
import { ALL_ROLES, ROLES } from "../src/constants/roles.js";
import { getNavigationForRole } from "../src/routes/navigation.js";

let server, api, store, service, constants, templateService, AuthContext, AppRoutes, DetailContent, StatusControls, Form;
const trainer = { id: "trainer-id", role: ROLES.Trainer, active: true, emailVerified: true };
const plan = { id: "plan-id", horseId: "horse-id", templateId: "template-id", trainerId: "recorded-trainer-id", goal: "Build stamina",
    phase: "Conditioning", startDate: "2026-10-01", endDate: "2026-11-01", notes: "Steady work", status: "Active" };
const horse = { id: "horse-id", name: "Comet", healthStatus: "Monitoring", archived: false };
const assignment = { horseId: horse.id, staffId: trainer.id, role: ROLES.Trainer, active: true };
const horseDetail = { horse, assignments: [assignment], preferences: { preferredTrainerId: "preferred-id" } };
const restriction = { id: "restriction-id", reason: "Recovery", validFrom: "2026-10-01", validUntil: "2026-10-20",
    trainingLock: true, blockAllTraining: false, maxIntensity: "Light", maxDistanceMetres: 800, noSprint: true, medicalRecordId: "record-id" };
const detail = { plan, sessions: [], restrictions: [restriction], sessionPage: 1, sessionPageSize: 20, sessionTotal: 0, horseDetail };
const values = { horseId: horse.id, templateId: plan.templateId, goal: " Build stamina ", phase: " Conditioning ",
    startDate: plan.startDate, endDate: plan.endDate, notes: "Steady work" };
const template = { id: plan.templateId, name: "Base work", archived: false };
const page = { items: [plan], page: 1, pageSize: 20, total: 1 };
const reply = (config, data, status = 200) => ({ config, data, status, statusText: "", headers: {} });
function reject(config, status, data = { detail: "Plan operation failed." }) {
    throw new axios.AxiosError("Rejected", "ERR_BAD_RESPONSE", config, null, reply(config, data, status));
}
function plugin() {
    return { name: "training-plan-test-harness", enforce: "post", transform(code, id) {
        if (!id.replaceAll("\\", "/").includes("/src/")) return;
        return code.replaceAll('"react-router-dom"', '"virtual:plans-router"').replaceAll('"react/jsx-dev-runtime"', '"virtual:plans-jsx"');
    }, resolveId(source) { if (source.startsWith("virtual:plans-")) return `\0${source}`; }, load(id) {
        if (id === "\0virtual:plans-router") return `export * from 'react-router-dom';
            export function Navigate(props) { globalThis.__plans.redirects.push(props); return null; }`;
        if (id === "\0virtual:plans-jsx") return `import {jsxDEV as original} from 'react/jsx-dev-runtime'; export {Fragment} from 'react/jsx-dev-runtime';
            export function jsxDEV(type,props,...rest) { if(type==='button') globalThis.__plans.buttons.push(props); if(type==='form') globalThis.__plans.forms.push(props); return original(type,props,...rest); }`;
    } };
}
before(async () => {
    const storage = new Map();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) } });
    server = await createServer({ configFile: false, plugins: [plugin(), react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom", logLevel: "error" });
    ({ default: api } = await server.ssrLoadModule("/src/services/api.js"));
    store = await server.ssrLoadModule("/src/services/sessionStore.js");
    service = await server.ssrLoadModule("/src/services/trainingPlanService.js");
    templateService = await server.ssrLoadModule("/src/services/trainingTemplateService.js");
    constants = await server.ssrLoadModule("/src/constants/training.js");
    ({ AuthContext } = await server.ssrLoadModule("/src/context/useAuth.js"));
    ({ default: AppRoutes } = await server.ssrLoadModule("/src/routes/AppRoutes.jsx"));
    ({ TrainingPlanDetailContent: DetailContent, PlanStatusControls: StatusControls } = await server.ssrLoadModule("/src/pages/training/TrainingPlanDetail.jsx"));
    ({ default: Form } = await server.ssrLoadModule("/src/components/training/TrainingPlanForm.jsx"));
});
beforeEach(() => {
    globalThis.__plans = { redirects: [], buttons: [], forms: [] };
    store.clearSession();
    store.setTokens({ accessToken: "plan-access", refreshToken: "plan-refresh", expiresIn: 3600 }, store.getSession().generation);
    store.setCurrentUser(trainer, store.getSession().generation);
    api.defaults.adapter = async () => { throw new Error("Unexpected request; tests do not contact the backend."); };
});
after(async () => { await server?.close(); delete globalThis.__plans; });
function render(element, role = ROLES.Trainer, path = "/training/plans") {
    return renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(AuthContext.Provider,
        { value: { user: { ...trainer, role }, isAuthenticated: true, loading: false, logout: async () => {} } }, element)));
}
function installDetailAdapter(mutation) {
    const calls = [];
    api.defaults.adapter = async (config) => {
        calls.push(config);
        if (config.method !== "get") return mutation(config);
        if (config.url === "/api/training/plans/plan-id") return reply(config, { ...detail, horseDetail: undefined });
        if (config.url === "/api/horses/horse-id") return reply(config, horseDetail);
        throw new Error(`Unexpected ${config.method} ${config.url}`);
    };
    return calls;
}

test("plan constants contain exact backend roles and statuses", () => {
    assert.deepEqual(constants.TRAINING_PLAN_ROLES, ["ClubManager", "HorseOwner", "HeadTrainer", "Trainer", "WorkRider", "Veterinarian"]);
    assert.deepEqual(constants.TRAINING_PLAN_STATUSES, ["Active", "Paused", "Completed", "Archived"]);
});
for (const role of [ROLES.ClubManager, ROLES.HorseOwner, ROLES.HeadTrainer, ROLES.Trainer, ROLES.WorkRider, ROLES.Veterinarian]) {
    test(`${role} has plan list/detail route and navigation access`, () => {
        assert.match(render(h(AppRoutes), role), /Loading Training Plans/);
        assert.deepEqual(globalThis.__plans.redirects, []);
        assert.ok(getNavigationForRole(role).some((item) => item.to === "/training/plans"));
    });
}
for (const role of [ROLES.Groom, "Unknown", null]) {
    test(`${role} fails closed for plan routes and navigation`, () => {
        assert.doesNotMatch(render(h(AppRoutes), role), /Loading Training Plans/);
        assert.equal(globalThis.__plans.redirects[0]?.to, "/permission-denied");
        assert.equal(getNavigationForRole(role).some((item) => item.to === "/training/plans"), false);
    });
}
test("only Trainer can open plan creation", () => {
    assert.match(render(h(AppRoutes), ROLES.Trainer, "/training/plans/new"), /Loading Training Plan choices/);
    for (const role of ALL_ROLES.filter((value) => value !== ROLES.Trainer)) {
        globalThis.__plans.redirects = [];
        assert.doesNotMatch(render(h(AppRoutes), role, "/training/plans/new"), /Loading Training Plan choices/);
        assert.equal(globalThis.__plans.redirects[0]?.to, "/permission-denied");
    }
});
test("current active Trainer assignment is the only frontend mutation authority", () => {
    assert.equal(service.canManagePlan(trainer, horseDetail), true);
    assert.equal(service.canManagePlan({ ...trainer, role: ROLES.HeadTrainer }, horseDetail), false);
    assert.equal(service.canManagePlan(trainer, { ...horseDetail, assignments: [{ ...assignment, active: false }] }), false);
    assert.equal(service.canManagePlan(trainer, { ...horseDetail, assignments: [{ ...assignment, staffId: "replacement-id" }] }), false);
    assert.equal(service.canManagePlan(trainer, { ...horseDetail, assignments: [{ ...assignment, horseId: "other-horse" }] }), false);
    assert.equal(service.canManagePlan({ ...trainer, id: "preferred-id" }, { ...horseDetail, assignments: [], preferences: { preferredTrainerId: "preferred-id" } }), false);
    assert.equal(service.canManagePlan(trainer, { ...horseDetail, horse: { ...horse, archived: true } }), false);
});
test("validation handles exact lengths and date ordering without inventing a past-date rule", () => {
    assert.deepEqual(service.validatePlan(values), {});
    assert.deepEqual(service.validatePlan({ ...values, goal: "g".repeat(4000), phase: "p".repeat(4000), notes: "n".repeat(4000), startDate: "2020-01-01", endDate: "2020-01-01" }), {});
    for (const [field, value] of [["horseId", ""], ["templateId", ""], ["goal", " "], ["goal", "g".repeat(4001)], ["phase", "p".repeat(4001)],
        ["startDate", "bad"], ["startDate", "0001-01-01"], ["endDate", "2026-09-30"], ["notes", "n".repeat(4001)]])
        assert.ok(service.validatePlan({ ...values, [field]: value })[field], `${field} should fail`);
});
test("list sends only supported pagination and optional horse filter", async () => {
    api.defaults.adapter = async (config) => {
        assert.equal(config.url, "/api/training/plans");
        assert.deepEqual(config.params, { page: 3, pageSize: 25, horseId: "horse-id" });
        return reply(config, { ...page, page: 3, pageSize: 25 });
    };
    assert.equal((await service.listTrainingPlans({ horseId: "horse-id", page: 3, pageSize: 25, status: "Active", search: "ignored" })).page, 3);
});
test("malformed list and detail responses fail safely", async () => {
    for (const body of [null, {}, { ...page, items: null }, { ...page, total: "1" }]) {
        api.defaults.adapter = async (config) => reply(config, body);
        await assert.rejects(service.listTrainingPlans());
    }
    api.defaults.adapter = async (config) => reply(config, { ...detail, plan: { ...plan, status: "Draft" }, horseDetail: undefined });
    await assert.rejects(service.getTrainingPlan(plan.id));
});
test("detail uses exact session paging and loads authoritative Horse context", async () => {
    const calls = installDetailAdapter(() => { throw new Error("Unexpected mutation"); });
    assert.deepEqual(await service.getTrainingPlan(plan.id, { sessionPage: 2, sessionPageSize: 10 }), detail);
    assert.deepEqual(calls.map(({ method, url, params }) => ({ method, url, params })), [
        { method: "get", url: "/api/training/plans/plan-id", params: { sessionPage: 2, sessionPageSize: 10 } },
        { method: "get", url: "/api/horses/horse-id", params: undefined },
    ]);
});
test("all-template loading paginates and excludes archived choices", async () => {
    let count = 0;
    api.defaults.adapter = async (config) => {
        count++;
        assert.deepEqual(config.params, { page: count, pageSize: 100 });
        return reply(config, count === 1 ? { items: [template, { ...template, id: "old", archived: true }], page: 1, pageSize: 1, total: 2 }
            : { items: [{ ...template, id: "second" }], page: 2, pageSize: 1, total: 2 });
    };
    assert.deepEqual((await templateService.listAllTrainingTemplates()).map(({ id }) => id), ["template-id", "second"]);
});
test("create sends exact DTO, omits server-derived state, and authoritatively refetches", async () => {
    const calls = installDetailAdapter((config) => {
        assert.equal(config.method, "post"); assert.equal(config.url, "/api/training/plans"); assert.equal(config.retryOnUnauthorized, false);
        const body = JSON.parse(config.data);
        assert.deepEqual(body, { horseId: horse.id, templateId: template.id, goal: "Build stamina", phase: "Conditioning",
            startDate: plan.startDate, endDate: plan.endDate, notes: "Steady work" });
        assert.equal(body.trainerId, undefined); assert.equal(body.status, undefined); assert.equal(body.sessions, undefined);
        return reply(config, plan, 201);
    });
    assert.deepEqual(await service.createTrainingPlan(values, template), detail);
    assert.deepEqual(calls.map(({ method, url }) => `${method} ${url}`), ["post /api/training/plans", "get /api/training/plans/plan-id", "get /api/horses/horse-id"]);
});
test("edit preserves immutable Horse/template and refetches authoritative detail", async () => {
    const calls = installDetailAdapter((config) => {
        assert.equal(config.method, "put"); assert.equal(config.url, "/api/training/plans/plan-id"); assert.equal(config.retryOnUnauthorized, false);
        assert.deepEqual(JSON.parse(config.data), { horseId: horse.id, templateId: template.id, goal: "Changed", phase: "Conditioning",
            startDate: plan.startDate, endDate: plan.endDate, notes: "Steady work" });
        return reply(config, { ...plan, goal: "Changed" });
    });
    const result = await service.updateTrainingPlan(detail, { ...values, horseId: "other", templateId: "other", goal: " Changed " });
    assert.deepEqual(result, detail);
    assert.deepEqual(calls.map(({ method, url }) => `${method} ${url}`), ["put /api/training/plans/plan-id", "get /api/training/plans/plan-id", "get /api/horses/horse-id"]);
    await assert.rejects(service.updateTrainingPlan({ ...detail, plan: { ...plan, status: "Completed" } }, values), /cannot be edited/);
});
test("status update uses the exact DTO, valid transitions and authoritative refetch", async () => {
    const calls = installDetailAdapter((config) => {
        assert.equal(config.url, "/api/training/plans/plan-id/status"); assert.equal(config.retryOnUnauthorized, false);
        assert.deepEqual(JSON.parse(config.data), { status: "Paused" });
        return reply(config, { ...plan, status: "Paused" });
    });
    assert.deepEqual(await service.updateTrainingPlanStatus(detail, "Paused"), detail);
    assert.equal(calls.length, 3);
    await assert.rejects(service.updateTrainingPlanStatus(detail, "Draft"), /supported/);
    await assert.rejects(service.updateTrainingPlanStatus({ ...detail, plan: { ...plan, status: "Archived" } }, "Active"), /cannot be reopened/);
});
test("malformed mutation success and failed authoritative refetch are uncertain", async () => {
    api.defaults.adapter = async (config) => reply(config, { ...plan, status: "Draft" }, 201);
    await assert.rejects(service.createTrainingPlan(values, template), (error) => error.requiresReload === true);
    api.defaults.adapter = async (config) => config.method === "post" ? reply(config, plan, 201) : reply(config, null);
    await assert.rejects(service.createTrainingPlan(values, template), (error) => error.requiresReload === true);
});
test("synchronous mutation lock prevents duplicate submissions", async () => {
    let release, calls = 0;
    const mutation = service.createPlanMutation(async () => { calls++; await new Promise((resolve) => { release = resolve; }); return detail; });
    const first = mutation(); assert.equal(await mutation(), null);
    while (!release) await new Promise((resolve) => setImmediate(resolve));
    release(); assert.deepEqual(await first, detail); assert.equal(calls, 1);
});
for (const status of [400, 403, 404, 409, 500]) {
    test(`${status} plan mutation is not automatically replayed`, async () => {
        let calls = 0; const previous = store.getSession();
        api.defaults.adapter = async (config) => { calls++; reject(config, status); };
        const mutation = service.createPlanMutation(() => service.createTrainingPlan(values, template));
        await assert.rejects(mutation(), (error) => error.status === status && error.requiresReload === (status !== 400));
        if (status === 400) await assert.rejects(mutation()); else assert.equal(await mutation(), null);
        assert.equal(calls, status === 400 ? 2 : 1); assert.equal(store.getSession(), previous);
    });
}
test("401 may refresh the session but never replays the unsafe create", async () => {
    const urls = [];
    api.defaults.adapter = async (config) => {
        urls.push(config.url);
        if (config.url === "/api/auth/refresh") return reply(config, { accessToken: "renewed", refreshToken: "renewed-refresh", expiresIn: 3600 });
        reject(config, 401, { detail: "Expired." });
    };
    await assert.rejects(service.createPlanMutation(() => service.createTrainingPlan(values, template))(), (error) => error.status === 401 && error.requiresReload);
    assert.deepEqual(urls, ["/api/training/plans", "/api/auth/refresh"]);
    assert.equal(store.getSession().accessToken, "renewed");
});
test("network uncertainty blocks another mutation attempt", async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => { calls++; throw new axios.AxiosError("offline", "ERR_NETWORK", config); };
    const mutation = service.createPlanMutation(() => service.createTrainingPlan(values, template));
    await assert.rejects(mutation(), (error) => error.requiresReload);
    assert.equal(await mutation(), null); assert.equal(calls, 1);
});
test("detail renders verified fields, medical context and the read-only session section", () => {
    const html = render(h(DetailContent, { detail, canManage: false, editing: false, statusChoice: "", busy: false, error: null }));
    for (const text of ["Build stamina", "template-id", "recorded-trainer-id", "Monitoring", "Recovery", "Maximum intensity: Light", "Maximum distance: 800 m", "No Sprint", "No Training Sessions are available on this page"])
        assert.match(html, new RegExp(text));
    assert.doesNotMatch(html, /Override|Start session|Assign rider|Record result|Evaluate/);
});
test("read-only detail hides mutations while Trainer sees only verified status transitions", () => {
    const readOnly = render(h(DetailContent, { detail, canManage: false, editing: false, statusChoice: "", busy: false, error: null }));
    assert.doesNotMatch(readOnly, /Edit plan|Pause plan|Completed plan|Archived plan/);
    const active = render(h(StatusControls, { plan, busy: false, selected: "", onSelect() {} }));
    assert.match(active, /Pause plan/); assert.match(active, /Completed plan/); assert.match(active, /Archived plan/); assert.doesNotMatch(active, /Resume plan/);
    const paused = render(h(StatusControls, { plan: { ...plan, status: "Paused" }, busy: false, selected: "", onSelect() {} }));
    assert.match(paused, /Resume plan/); assert.doesNotMatch(paused, /Pause plan/);
    assert.match(render(h(StatusControls, { plan: { ...plan, status: "Completed" } })), /terminal state/);
});
test("form filters archived templates, keeps edit identities read-only and promises no session generation", () => {
    const createHtml = render(h(Form, { horses: [horse], templates: [template, { ...template, id: "archived", name: "Old", archived: true }], busy: false, onSave() {}, onCancel() {} }));
    assert.match(createHtml, /Base work/); assert.doesNotMatch(createHtml, />Old/); assert.match(createHtml, /does not generate Training Sessions/);
    const editHtml = render(h(Form, { plan, busy: false, onSave() {}, onCancel() {} }));
    assert.doesNotMatch(editHtml, /id="plan-horseId"|id="plan-templateId"/);
    assert.match(editHtml, /Horse and template cannot be changed/); assert.match(editHtml, /reject dates that exclude any existing session/);
});
test("service exposes no session, result, evaluation, delete, restore or template-detail operations", () => {
    for (const name of ["createTrainingSession", "assignWorkRider", "startTrainingSession", "recordSessionResult", "evaluateTrainingSession",
        "deleteTrainingPlan", "restoreTrainingPlan", "getTrainingTemplate"])
        assert.equal(service[name], undefined);
});
