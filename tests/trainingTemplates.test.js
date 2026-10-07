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

let server, api, store, service, constants, AuthContext, AppRoutes, Results, Form;
const user = { id: "head-id", role: ROLES.HeadTrainer, active: true, emailVerified: true };
const template = { id: "template-id", name: "Sprint base", goal: "Build speed", phase: "Competition",
    distanceMetres: 1200, intensity: "Heavy", surface: "Turf", frequencyPerWeek: 3, notes: "Reference only", archived: false };
const values = { name: "  Sprint base  ", goal: "  Build speed  ", phase: " Competition ", distanceMetres: "1200.5",
    intensity: "Heavy", surface: " Turf ", frequencyPerWeek: "3", notes: "  Reference only  " };
const page = { items: [template], page: 1, pageSize: 20, total: 1 };
const reply = (config, data, status = 200) => ({ config, data, status, statusText: "", headers: {} });
function reject(config, status, data = { detail: "Template operation failed." }) {
    throw new axios.AxiosError("Rejected", "ERR_BAD_RESPONSE", config, null, reply(config, data, status));
}
function plugin() {
    return { name: "training-template-test-harness", enforce: "post",
        transform(code, id) {
            if (!id.replaceAll("\\", "/").includes("/src/")) return;
            return code.replaceAll('"react-router-dom"', '"virtual:templates-router"')
                .replaceAll('"react/jsx-dev-runtime"', '"virtual:templates-jsx"');
        },
        resolveId(source) { if (source.startsWith("virtual:templates-")) return `\0${source}`; },
        load(id) {
            if (id === "\0virtual:templates-router") return `export * from 'react-router-dom';
                export function Navigate(props) { globalThis.__templates.redirects.push(props); return null; }`;
            if (id === "\0virtual:templates-jsx") return `import {jsxDEV as original} from 'react/jsx-dev-runtime'; export {Fragment} from 'react/jsx-dev-runtime';
                export function jsxDEV(type,props,...rest) { if(type==='button') globalThis.__templates.buttons.push(props); if(type==='form') globalThis.__templates.forms.push(props); return original(type,props,...rest); }`;
        },
    };
}
before(async () => {
    const storage = new Map();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
        getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key),
    } });
    server = await createServer({ configFile: false, plugins: [plugin(), react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom", logLevel: "error" });
    ({ default: api } = await server.ssrLoadModule("/src/services/api.js"));
    store = await server.ssrLoadModule("/src/services/sessionStore.js");
    service = await server.ssrLoadModule("/src/services/trainingTemplateService.js");
    constants = await server.ssrLoadModule("/src/constants/training.js");
    ({ AuthContext } = await server.ssrLoadModule("/src/context/useAuth.js"));
    ({ default: AppRoutes } = await server.ssrLoadModule("/src/routes/AppRoutes.jsx"));
    ({ TrainingTemplateResults: Results } = await server.ssrLoadModule("/src/pages/training/TrainingTemplates.jsx"));
    ({ default: Form } = await server.ssrLoadModule("/src/components/training/TrainingTemplateForm.jsx"));
});
beforeEach(() => {
    globalThis.__templates = { redirects: [], buttons: [], forms: [] };
    store.clearSession();
    store.setTokens({ accessToken: "template-access", refreshToken: "template-refresh", expiresIn: 3600 }, store.getSession().generation);
    store.setCurrentUser(user, store.getSession().generation);
    api.defaults.adapter = async () => { throw new Error("Unexpected request; tests do not contact the backend."); };
});
after(async () => { await server?.close(); delete globalThis.__templates; });
function render(element, role = ROLES.HeadTrainer, path = "/training/templates") {
    return renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(AuthContext.Provider,
        { value: { user: { ...user, role }, isAuthenticated: true, loading: false, logout: async () => {} } }, element)));
}
function resource(overrides = {}) { return { loading: false, data: page, reload() {}, ...overrides }; }

test("template constants contain exact backend roles and intensities", () => {
    assert.deepEqual(constants.TRAINING_TEMPLATE_ROLES, ["ClubManager", "HeadTrainer", "Trainer"]);
    assert.deepEqual(constants.TRAINING_INTENSITIES, ["Light", "Moderate", "Heavy"]);
});
for (const role of [ROLES.ClubManager, ROLES.HeadTrainer, ROLES.Trainer]) {
    test(`${role} can access the template route and navigation`, () => {
        assert.match(render(h(AppRoutes), role), /Loading Training Templates/);
        assert.deepEqual(globalThis.__templates.redirects, []);
        assert.ok(getNavigationForRole(role).some((item) => item.to === "/training/templates"));
    });
}
for (const role of ALL_ROLES.filter((role) => ![ROLES.ClubManager, ROLES.HeadTrainer, ROLES.Trainer].includes(role)).concat(["Unknown", null])) {
    test(`${role} fails closed for template route and navigation`, () => {
        const html = render(h(AppRoutes), role);
        assert.doesNotMatch(html, /Loading Training Templates/);
        assert.equal(globalThis.__templates.redirects[0]?.to, "/permission-denied");
        assert.equal(getNavigationForRole(role).some((item) => item.to === "/training/templates"), false);
    });
}
test("list sends only page and pageSize and returns exact pagination envelope", async () => {
    api.defaults.adapter = async (config) => {
        assert.equal(config.method, "get"); assert.equal(config.url, "/api/training/templates");
        assert.deepEqual(config.params, { page: 3, pageSize: 20 }); return reply(config, { ...page, page: 3 });
    };
    assert.equal((await service.listTrainingTemplates({ page: 3, pageSize: 20, search: "not-supported", archived: true })).page, 3);
});
test("malformed list envelopes fail safely", async () => {
    for (const body of [null, {}, { ...page, items: null }, { ...page, page: "1" }, { ...page, total: null }]) {
        api.defaults.adapter = async (config) => reply(config, body);
        await assert.rejects(service.listTrainingTemplates());
    }
});
test("validation accepts exact boundaries and rejects unsupported values", () => {
    for (const intensity of constants.TRAINING_INTENSITIES) assert.deepEqual(service.validateTemplate({ ...values, intensity }), {});
    const boundary = { ...values, name: "n".repeat(200), goal: "g".repeat(4000), phase: "p".repeat(4000), surface: "s".repeat(4000),
        notes: "x".repeat(4000), distanceMetres: "1", frequencyPerWeek: "21" };
    assert.deepEqual(service.validateTemplate(boundary), {});
    for (const [field, value] of [["name", ""], ["name", "n".repeat(201)], ["goal", " "], ["phase", "p".repeat(4001)],
        ["surface", ""], ["notes", "n".repeat(4001)], ["distanceMetres", 0], ["distanceMetres", 100001],
        ["distanceMetres", "not-number"], ["frequencyPerWeek", 0], ["frequencyPerWeek", 22], ["frequencyPerWeek", 1.5], ["intensity", "Extreme"]]) {
        assert.ok(service.validateTemplate({ ...values, [field]: value })[field], `${field}=${value} should fail`);
    }
});
test("create sends exact normalized payload and opts out of automatic replay", async () => {
    api.defaults.adapter = async (config) => {
        assert.equal(config.method, "post"); assert.equal(config.url, "/api/training/templates"); assert.equal(config.retryOnUnauthorized, false);
        assert.deepEqual(JSON.parse(config.data), { name: "Sprint base", goal: "Build speed", phase: "Competition", distanceMetres: 1200.5,
            intensity: "Heavy", surface: "Turf", frequencyPerWeek: 3, notes: "  Reference only  " });
        return reply(config, template, 201);
    };
    assert.deepEqual(await service.createTrainingTemplate(values), template);
});
test("edit sends the same exact DTO to the encoded id and rejects archived templates", async () => {
    api.defaults.adapter = async (config) => {
        assert.equal(config.method, "put"); assert.equal(config.url, "/api/training/templates/template-id"); assert.equal(config.retryOnUnauthorized, false);
        assert.deepEqual(Object.keys(JSON.parse(config.data)).sort(), ["distanceMetres", "frequencyPerWeek", "goal", "intensity", "name", "notes", "phase", "surface"]);
        return reply(config, template);
    };
    assert.deepEqual(await service.updateTrainingTemplate(template, values), template);
    await assert.rejects(service.updateTrainingTemplate({ ...template, archived: true }, values), /cannot be edited/);
});
test("archive uses only the verified POST route, empty body and replay opt-out", async () => {
    api.defaults.adapter = async (config) => {
        assert.equal(config.method, "post"); assert.equal(config.url, "/api/training/templates/template-id/archive");
        assert.equal(config.data, undefined); assert.equal(config.retryOnUnauthorized, false); return reply(config, "", 204);
    };
    assert.equal(await service.archiveTrainingTemplate(template), undefined);
    await assert.rejects(service.archiveTrainingTemplate({ ...template, archived: true }), /cannot be archived/);
});
test("malformed create and edit success responses are uncertain", async () => {
    for (const [method, body] of [["create", null], ["create", { ...template, intensity: "Extreme" }], ["edit", { ...template, id: "other-id" }], ["edit", { ...template, archived: true }]]) {
        api.defaults.adapter = async (config) => reply(config, body, config.method === "post" ? 201 : 200);
        const operation = method === "create" ? service.createTrainingTemplate(values) : service.updateTrainingTemplate(template, values);
        await assert.rejects(operation, (error) => error.requiresReload === true);
    }
});
test("successful mutation invokes authoritative reload, blocked duplicate does not", async () => {
    let reloads = 0;
    assert.equal(await service.runTemplateMutation(async () => template, () => reloads++), template);
    assert.equal(await service.runTemplateMutation(async () => null, () => reloads++), null);
    assert.equal(reloads, 1);
});
test("synchronous mutation lock prevents duplicate submissions", async () => {
    let release, calls = 0;
    const mutation = service.createTemplateMutation(async () => { calls++; await new Promise((resolve) => { release = resolve; }); return template; });
    const first = mutation(); assert.equal(await mutation(), null);
    while (!release) await new Promise((resolve) => setImmediate(resolve));
    release(); assert.deepEqual(await first, template); assert.equal(calls, 1);
});
for (const status of [400, 403, 404, 409, 500]) {
    test(`${status} mutation is not replayed and preserves the authenticated session`, async () => {
        let calls = 0; const previous = store.getSession();
        api.defaults.adapter = async (config) => { calls++; reject(config, status); };
        const mutation = service.createTemplateMutation(() => service.createTrainingTemplate(values));
        await assert.rejects(mutation(), (error) => error.status === status && error.requiresReload === (status !== 400));
        if (status === 400) await assert.rejects(mutation()); else assert.equal(await mutation(), null);
        assert.equal(calls, status === 400 ? 2 : 1); assert.equal(store.getSession(), previous);
    });
}
test("401 refreshes tokens without replaying the unsafe create", async () => {
    const urls = [];
    api.defaults.adapter = async (config) => {
        urls.push(config.url);
        if (config.url === "/api/auth/refresh") return reply(config, { accessToken: "renewed-template", refreshToken: "renewed-template-refresh", expiresIn: 3600 });
        reject(config, 401, { detail: "Session expired." });
    };
    await assert.rejects(service.createTemplateMutation(() => service.createTrainingTemplate(values))(), (error) => error.status === 401 && error.requiresReload);
    assert.deepEqual(urls, ["/api/training/templates", "/api/auth/refresh"]);
    assert.equal(store.getSession().status, "authenticated"); assert.equal(store.getSession().accessToken, "renewed-template");
});
test("ambiguous network failure blocks another mutation without fabricated success", async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => { calls++; throw new axios.AxiosError("offline", "ERR_NETWORK", config); };
    const mutation = service.createTemplateMutation(() => service.createTrainingTemplate(values));
    await assert.rejects(mutation(), (error) => error.requiresReload);
    assert.equal(await mutation(), null); assert.equal(calls, 1);
});
test("list renders loading, empty, normalized error and pagination states", () => {
    assert.match(render(h(Results, { resource: resource({ loading: true, data: undefined }) })), /Loading Training Templates/);
    assert.match(render(h(Results, { resource: resource({ data: { ...page, items: [], total: 0 } }) })), /No active Training Templates/);
    assert.match(render(h(Results, { resource: resource({ error: { status: 403 }, data: undefined }) })), /permission/);
    const html = render(h(Results, { resource: resource(), onPage() {} }));
    assert.match(html, /Page 1 of 1/); assert.match(html, /Sprint base/);
});
test("ClubManager and Trainer list is read-only while HeadTrainer gets mutation actions", () => {
    for (const role of [ROLES.ClubManager, ROLES.Trainer]) {
        const html = render(h(Results, { resource: resource(), canManage: false, onPage() {} }), role);
        assert.doesNotMatch(html, /Create template|Edit|Archive/);
    }
    const html = render(h(Results, { resource: resource(), canManage: true, onPage() {}, onEdit() {}, onArchive() {} }));
    assert.match(html, />Edit</); assert.match(html, />Archive</);
});
test("archived records are read-only and archive requires explicit confirmation", () => {
    const archived = render(h(Results, { resource: resource({ data: { ...page, items: [{ ...template, archived: true }] } }), canManage: true, onPage() {} }));
    assert.match(archived, /Archived — read only/); assert.doesNotMatch(archived, />Edit</);
    const confirmation = render(h(Results, { resource: resource(), canManage: true, confirming: template.id, onPage() {}, onConfirmArchive() {}, onCancelArchive() {} }));
    assert.match(confirmation, /Confirm archive/); assert.match(confirmation, /cannot be restored/);
});
test("form offers exact intensity enum and describes reference-only semantics", () => {
    const html = render(h(Form, { busy: false, onSave() {}, onCancel() {} }));
    for (const intensity of constants.TRAINING_INTENSITIES) assert.match(html, new RegExp(`value="${intensity}"`));
    assert.doesNotMatch(html, /Extreme|VeryHeavy/); assert.match(html, /does not create a Training Plan or generate Training Sessions/);
});
test("form blocks invalid values and pending duplicate submission", async () => {
    let calls = 0;
    render(h(Form, { busy: true, onSave() { calls++; }, onCancel() {} }));
    await globalThis.__templates.forms[0].onSubmit({ preventDefault() {} }); assert.equal(calls, 0);
});
test("service exports no invented detail, restore, duplicate, search or session-generation operations", () => {
    for (const name of ["getTrainingTemplate", "restoreTrainingTemplate", "duplicateTrainingTemplate", "generateTrainingSessions", "searchTrainingTemplates"])
        assert.equal(service[name], undefined);
});
