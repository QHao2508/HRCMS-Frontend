import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import axios from "axios";

// Reuse the project's Vite/SSR approach. Model hook state across renders and
// disabled-fieldset semantics to exercise real handlers/effect cleanup. These
// focused tests do not establish real browser focus or keyboard behavior.
function harness() {
    return {
        name: "registration-safety-tests", enforce: "post",
        transform(code, id) {
            const file = id.replaceAll("\\", "/");
            if (!file.endsWith("/RegistrationCreate.jsx") && !file.endsWith("/ReviewConfirmation.jsx")) return;
            return code.replaceAll('"react"', '"virtual:safety-react"')
                .replaceAll('"react-router-dom"', '"virtual:safety-router"')
                .replaceAll('"react/jsx-dev-runtime"', '"virtual:safety-jsx"');
        },
        resolveId(id) { if (id.startsWith("virtual:safety-")) return `\0${id}`; },
        load(id) {
            if (id === "\0virtual:safety-router") return `export * from 'react-router-dom';
                export function useNavigate() { return (...args) => globalThis.__safety.navigation.push(args); }`;
            if (id === "\0virtual:safety-jsx") return `
                import { jsxDEV as original } from 'react/jsx-dev-runtime';
                export { Fragment } from 'react/jsx-dev-runtime';
                export function jsxDEV(type, props, ...rest) {
                    if (type === 'form') globalThis.__safety.forms.push(props);
                    if (type === 'button') globalThis.__safety.buttons.push(props);
                    if (type?.name === 'RegistrationForm') globalThis.__safety.fields = props;
                    return original(type, props, ...rest);
                }`;
            if (id === "\0virtual:safety-react") return `
                export * from 'react';
                import { useState as state, useRef as ref, useEffect as effect } from 'react';
                function slot(initial) {
                    const model = globalThis.__safety;
                    return model.slots[model.cursor++] ||= initial();
                }
                export function useState(initial) {
                    const real = state(initial);
                    const saved = slot(() => ({ value: real[0] }));
                    return [saved.value, next => { saved.value = typeof next === 'function' ? next(saved.value) : next; }];
                }
                export function useRef(initial) {
                    const real = ref(initial);
                    return slot(() => real);
                }
                export function useEffect(create, deps) {
                    effect(create, deps);
                    const saved = slot(() => ({}));
                    if (!saved.deps || deps.some((value, index) => !Object.is(value, saved.deps[index]))) {
                        globalThis.__safety.effects.push(() => {
                            saved.cleanup?.(); saved.cleanup = create(); saved.deps = deps;
                        });
                    }
                }`;
        },
    };
}

let server, api, store, AuthContext, Create, Confirmation;
const owner = { id: "owner-id", role: "HorseOwner", active: true, emailVerified: true };
const reply = (config, data, status = 200) => ({ config, data, status, statusText: "", headers: {} });
const originalDocument = globalThis.document;
const originalAnimationFrame = globalThis.requestAnimationFrame;
before(async () => {
    server = await createServer({ configFile: false, plugins: [harness(), react()],
        server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom", logLevel: "error" });
    ({ default: api } = await server.ssrLoadModule("/src/services/api.js"));
    store = await server.ssrLoadModule("/src/services/sessionStore.js");
    ({ AuthContext } = await server.ssrLoadModule("/src/context/useAuth.js"));
    ({ default: Create } = await server.ssrLoadModule("/src/pages/registrations/RegistrationCreate.jsx"));
    ({ default: Confirmation } = await server.ssrLoadModule("/src/components/registrations/ReviewConfirmation.jsx"));
});
beforeEach(() => {
    globalThis.__safety = { cursor: 0, slots: [], effects: [], frames: [], navigation: [], forms: [], buttons: [] };
    globalThis.document = { activeElement: null, body: { style: { overflow: "auto" } } };
    globalThis.requestAnimationFrame = (callback) => { globalThis.__safety.frames.push(callback); };
    store.clearSession();
    store.setTokens({ accessToken: "test-access", refreshToken: "test-refresh", expiresIn: 3600 }, store.getSession().generation);
    store.setCurrentUser(owner, store.getSession().generation);
    api.defaults.adapter = async () => { throw new Error("Unexpected request: no live backend allowed."); };
});
function unmount() {
    for (const slot of globalThis.__safety.slots) {
        if (typeof slot.cleanup === "function") {
            slot.cleanup(); slot.cleanup = undefined;
        }
    }
}
afterEach(unmount);
after(async () => {
    await server?.close();
    delete globalThis.__safety;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalAnimationFrame === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = originalAnimationFrame;
});
function render(element) {
    const model = globalThis.__safety;
    model.cursor = 0; model.forms = []; model.buttons = []; model.effects = [];
    return renderToStaticMarkup(h(MemoryRouter, null, h(AuthContext.Provider,
        { value: { user: owner, isAuthenticated: true, loading: false } }, element)));
}
const renderCreate = () => render(h(Create));
const submit = () => globalThis.__safety.forms[0].onSubmit({ preventDefault() {} });
const saveButton = () => globalThis.__safety.buttons.find((button) => button.children === "Lưu bản nháp");

test("successful creation preserves the payload and returned-id navigation", async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => {
        calls++;
        assert.equal(config.url, "/api/registrations"); assert.equal(config.method, "post");
        assert.equal(JSON.parse(config.data).name, "Comet");
        assert.equal(Object.hasOwn(JSON.parse(config.data), "ownerId"), false);
        return reply(config, { id: "created-draft", status: "Draft" }, 201);
    };
    renderCreate();
    globalThis.__safety.fields.onChange({ target: { name: "name", value: "Comet" } });
    renderCreate(); await submit();
    assert.equal(calls, 1);
    assert.deepEqual(globalThis.__safety.navigation, [["/registrations/created-draft", { replace: true }]]);
});
test("a saved draft with a lost response locks retries even across form rerenders", async () => {
    const savedDrafts = [];
    api.defaults.adapter = async (config) => {
        savedDrafts.push({ id: "already-saved", ...JSON.parse(config.data) });
        throw new axios.AxiosError("Response lost after save", "ERR_NETWORK", config);
    };
    renderCreate(); await submit();
    const html = renderCreate();
    assert.match(html, /Bản nháp có thể đã được lưu trên máy chủ/);
    assert.match(html, /href="\/registrations"[^>]*>Kiểm tra danh sách đăng ký/);
    assert.equal(saveButton().disabled, true);
    assert.equal(globalThis.__safety.fields.disabled, true);
    await submit();
    assert.equal(savedDrafts.length, 1);
    assert.deepEqual(globalThis.__safety.navigation, []);
});
for (const [label, code, status] of [
    ["timeout", "ECONNABORTED", null], ["request timeout response", "ERR_BAD_RESPONSE", 408],
    ["server failure", "ERR_BAD_RESPONSE", 500], ["unavailable server", "ERR_BAD_RESPONSE", 503],
]) {
    test(`${label} leaves creation blocked until the form is left`, async () => {
        let calls = 0;
        api.defaults.adapter = async (config) => {
            calls++;
            throw new axios.AxiosError("Uncertain result", code, config, null,
                status === null ? undefined : reply(config, {}, status));
        };
        renderCreate(); await submit(); renderCreate();
        assert.equal(saveButton().disabled, true);
        await submit(); assert.equal(calls, 1);
        assert.deepEqual(globalThis.__safety.navigation, []);
    });
}
test("definitive validation failure permits correction and a successful save", async () => {
    const bodies = [];
    api.defaults.adapter = async (config) => {
        bodies.push(JSON.parse(config.data));
        if (bodies.length === 1) throw new axios.AxiosError("Validation", "ERR_BAD_REQUEST", config, null,
            reply(config, { detail: "Please correct the horse name." }, 400));
        return reply(config, { id: "corrected-draft", status: "Draft" }, 201);
    };
    renderCreate(); await submit();
    const html = renderCreate();
    assert.match(html, /Please correct the horse name/);
    assert.doesNotMatch(html, /Bản nháp có thể đã được lưu/);
    assert.equal(saveButton().disabled, false);
    globalThis.__safety.fields.onChange({ target: { name: "name", value: "Corrected" } });
    renderCreate(); await submit();
    assert.equal(bodies.length, 2); assert.equal(bodies[1].name, "Corrected");
    assert.deepEqual(globalThis.__safety.navigation, [["/registrations/corrected-draft", { replace: true }]]);
});

function dialogDom(approve) {
    const element = { isConnected: true, fieldsetDisabled: false };
    const controls = (approve ? ["cancel", "confirm"] : ["reason", "cancel", "confirm"]).map((name) => ({
        name, disabled: false, isConnected: true,
        focus() { if (!this.disabled && !element.fieldsetDisabled) document.activeElement = this; },
    }));
    Object.assign(element, {
        controls,
        focus() { document.activeElement = this; },
        contains(control) { return control === this || controls.includes(control); },
        querySelectorAll(selector) {
            // Attribute selectors do not account for disabled ancestors;
            // :disabled does. No descendant has its own disabled attribute.
            return controls.filter((control) => !control.disabled && (!selector.includes(":disabled") || !this.fieldsetDisabled));
        },
        querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
    });
    return element;
}
function renderDialog(dom, props) {
    dom.fieldsetDisabled = !!props.busy;
    const html = render(h(Confirmation, props));
    globalThis.__safety.forms[0].ref.current = dom;
    for (const run of globalThis.__safety.effects) run();
    return html;
}
function tab(shiftKey = false) {
    let prevented = false;
    globalThis.__safety.forms[0].onKeyDown({ key: "Tab", shiftKey, preventDefault() { prevented = true; } });
    return prevented;
}
for (const approve of [true, false]) {
    const label = approve ? "Approval" : "Revision";
    test(`${label}: pending Tab and Shift+Tab stay on the dialog, with no dismissal or repeat submit`, async () => {
        const dom = dialogDom(approve);
        let calls = 0, closes = 0;
        renderDialog(dom, { approve, busy: true, onConfirm: async () => calls++, onBack: () => closes++ });
        assert.equal(document.activeElement, dom);
        for (const shift of [false, true]) {
            assert.equal(tab(shift), true); assert.equal(document.activeElement, dom);
        }
        globalThis.__safety.forms[0].onKeyDown({ key: "Escape", preventDefault() { assert.fail("Pending dialog dismissed"); } });
        await submit(); assert.equal(calls, 0); assert.equal(closes, 0);
    });
    test(`${label}: idle Tab wraps both boundaries and handles a dialog with no enabled controls`, () => {
        const dom = dialogDom(approve);
        renderDialog(dom, { approve, busy: false });
        const first = dom.controls[0], last = dom.controls.at(-1);
        first.focus(); assert.equal(tab(true), true); assert.equal(document.activeElement, last);
        assert.equal(tab(), true); assert.equal(document.activeElement, first);
        dom.focus(); assert.equal(tab(), true); assert.equal(document.activeElement, first);
        dom.focus(); assert.equal(tab(true), true); assert.equal(document.activeElement, last);
        dom.fieldsetDisabled = true; dom.focus();
        assert.equal(tab(), true); assert.equal(document.activeElement, dom);
        assert.equal(tab(true), true); assert.equal(document.activeElement, dom);
    });
    test(`${label}: focus enters, returns after pending, and goes back to the trigger on close; error stays inside modal`, () => {
        const dom = dialogDom(approve);
        const trigger = { disabled: false, isConnected: true, focus() { document.activeElement = this; } };
        const props = { approve, busy: false, returnFocus: trigger,
            requestError: { status: 400, message: "Review could not be completed." } };
        document.activeElement = trigger;
        const html = renderDialog(dom, props);
        assert.equal(document.activeElement, dom.controls[0]);
        assert.equal(document.body.style.overflow, "hidden");
        const modal = html.slice(html.indexOf('role="dialog"'));
        assert.match(modal, /role="alert">Review could not be completed/);
        renderDialog(dom, { ...props, busy: true }); assert.equal(document.activeElement, dom);
        renderDialog(dom, props); assert.equal(document.activeElement, dom.controls[0]);
        dom.isConnected = false; unmount();
        assert.equal(document.body.style.overflow, "auto");
        for (const frame of globalThis.__safety.frames) frame();
        assert.equal(document.activeElement, trigger);
    });
}
