import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { ALL_ROLES, ROLES, getRoleLabel, isKnownRole, isRoleAllowed } from "../src/constants/roles.js";
import { getNavigationForRole } from "../src/routes/navigation.js";
import { getLoginDestination } from "../src/routes/redirects.js";
import { getUserDisplayName } from "../src/utils/userDisplay.js";

// Render the real components and context with the installed Vite/React tools.
// Only browser navigation is recorded rather than executed; JSX instrumentation
// exposes the shell's real button handler without adding a DOM/test dependency.
function routingHarnessPlugin() {
    return {
        name: "routing-test-harness",
        enforce: "post",
        transform(code, id) {
            if (!id.replaceAll("\\", "/").includes("/src/")) return;
            return code.replaceAll('"react-router-dom"', '"virtual:routing-test-router"')
                .replaceAll('"react/jsx-dev-runtime"', '"virtual:routing-test-jsx"');
        },
        resolveId(source) {
            if (source === "virtual:routing-test-router") return "\0routing-test:router";
            if (source === "virtual:routing-test-jsx") return "\0routing-test:jsx";
        },
        load(id) {
            if (id === "\0routing-test:router") return `
                export * from 'react-router-dom';
                export function Navigate(props) { globalThis.__hrcmsRoutingTest.redirects.push(props); return null; }
                export function useNavigate() { return (...args) => globalThis.__hrcmsRoutingTest.navigations.push(args); }
            `;
            if (id === "\0routing-test:jsx") return `
                import { jsxDEV as original } from 'react/jsx-dev-runtime';
                export { Fragment } from 'react/jsx-dev-runtime';
                export function jsxDEV(type, props, ...rest) {
                    if (type === 'button' && props.onClick) globalThis.__hrcmsRoutingTest.buttons.push(props);
                    return original(type, props, ...rest);
                }
            `;
        },
    };
}

let server, AuthContext, RoleRoute, AppRoutes, AppLayout, store, auth, api;
const storage = new Map();
const owner = { id: "owner-id", firstName: "Test", lastName: "Owner", userName: "test.owner",
    role: ROLES.HorseOwner, active: true, emailVerified: true };
const h = createElement;

before(async () => {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, String(value)),
        removeItem: (key) => storage.delete(key),
    } });
    globalThis.__hrcmsRoutingTest = { redirects: [], navigations: [], buttons: [] };
    server = await createServer({ configFile: false, plugins: [routingHarnessPlugin(), react()],
        server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "error" });
    ({ AuthContext } = await server.ssrLoadModule("/src/context/useAuth.js"));
    ({ default: RoleRoute } = await server.ssrLoadModule("/src/routes/RoleRoute.jsx"));
    ({ default: AppRoutes } = await server.ssrLoadModule("/src/routes/AppRoutes.jsx"));
    ({ default: AppLayout } = await server.ssrLoadModule("/src/layouts/AppLayout.jsx"));
    store = await server.ssrLoadModule("/src/services/sessionStore.js");
    auth = await server.ssrLoadModule("/src/services/authService.js");
    ({ default: api } = await server.ssrLoadModule("/src/services/api.js"));
});

beforeEach(() => {
    globalThis.__hrcmsRoutingTest = { redirects: [], navigations: [], buttons: [] };
    store.clearSession();
    storage.clear();
    api.defaults.adapter = async () => { throw new Error("Unexpected request; routing tests do not contact a backend."); };
});

after(async () => {
    await server?.close();
    delete globalThis.__hrcmsRoutingTest;
});

function authValue(overrides = {}) {
    return { user: owner, isAuthenticated: true, loading: false, logout: auth.logout, ...overrides };
}

function render(element, value = authValue(), location = "/dashboard") {
    return renderToStaticMarkup(h(MemoryRouter, { initialEntries: [location] },
        h(AuthContext.Provider, { value }, element)));
}

function renderRestricted(allowedRoles, value = authValue(), location = "/restricted?tab=summary#details") {
    return render(h(RoleRoute, { allowedRoles }, h("p", null, "Restricted content")), value, location);
}

function seedSession() {
    store.setTokens({ accessToken: "test-access", refreshToken: "test-refresh", expiresIn: 3600 }, store.getSession().generation);
    store.setCurrentUser(owner, store.getSession().generation);
}

test("central roles match all seven verified backend enum names without display-label aliases", () => {
    assert.deepEqual(ALL_ROLES, ["HorseOwner", "ClubManager", "HeadTrainer", "Trainer", "WorkRider", "Veterinarian", "Groom"]);
    for (const value of ["Horse Owner", "horseowner", "StableHand", "Admin", 0, null, "__proto__"]) assert.equal(isKnownRole(value), false);
});

test("unauthenticated protected route redirects to login and preserves the complete intended location", () => {
    const html = renderRestricted(ROLES.ClubManager, authValue({ isAuthenticated: false, user: null }));
    assert.equal(html.includes("Restricted content"), false);
    const [redirect] = globalThis.__hrcmsRoutingTest.redirects;
    assert.equal(redirect.to, "/login");
    assert.equal(redirect.replace, true);
    assert.equal(redirect.state.from.pathname, "/restricted");
    assert.equal(redirect.state.from.search, "?tab=summary");
    assert.equal(redirect.state.from.hash, "#details");
    assert.equal(getLoginDestination(redirect.state), "/restricted?tab=summary#details");
});

test("restoration loading blocks content and makes no authentication or permission redirect", () => {
    const html = renderRestricted(ROLES.ClubManager, authValue({ loading: true, isAuthenticated: false, user: null }));
    assert.match(html, /Loading/);
    assert.equal(html.includes("Restricted content"), false);
    assert.deepEqual(globalThis.__hrcmsRoutingTest.redirects, []);
});

test("an authenticated allowed role renders a restricted route", () => {
    assert.match(renderRestricted(ROLES.HorseOwner), /Restricted content/);
    assert.deepEqual(globalThis.__hrcmsRoutingTest.redirects, []);
});

test("wrong-role access redirects to permission denied without clearing the session or exposing the route", () => {
    seedSession();
    const previous = store.getSession();
    const saved = storage.get("hrcms.session");
    const html = renderRestricted(ROLES.ClubManager);
    assert.equal(html.includes("Restricted content"), false);
    assert.deepEqual(globalThis.__hrcmsRoutingTest.redirects, [{ to: "/permission-denied", replace: true }]);
    assert.equal(store.getSession(), previous);
    assert.equal(storage.get("hrcms.session"), saved);
});

test("a multi-role guard accepts either exact allowed role and rejects other roles", () => {
    for (const role of [ROLES.HorseOwner, ROLES.ClubManager]) {
        assert.match(renderRestricted([ROLES.HorseOwner, ROLES.ClubManager], authValue({ user: { ...owner, role } })), /Restricted content/);
    }
    assert.deepEqual(globalThis.__hrcmsRoutingTest.redirects, []);
    assert.equal(renderRestricted([ROLES.HorseOwner, ROLES.ClubManager], authValue({ user: { ...owner, role: ROLES.Trainer } })).includes("Restricted content"), false);
    assert.equal(globalThis.__hrcmsRoutingTest.redirects[0].to, "/permission-denied");
});

test("unrestricted authenticated routes and the real dashboard work for every backend role", () => {
    for (const role of ALL_ROLES) {
        const value = authValue({ user: { ...owner, role } });
        assert.match(renderRestricted(undefined, value), /Restricted content/);
        const html = render(h(AppRoutes), value);
        assert.match(html, /Welcome, Test Owner/);
        assert.ok(html.includes(getRoleLabel(role)));
    }
    assert.deepEqual(globalThis.__hrcmsRoutingTest.redirects, []);
});

test("unknown role and invalid or empty allowlists fail closed for restricted routes", () => {
    for (const role of ["Horse Owner", "UnknownRole", "horseowner", undefined, 0]) {
        assert.equal(renderRestricted(ROLES.HorseOwner, authValue({ user: { ...owner, role } })).includes("Restricted content"), false);
    }
    for (const allowed of [[], null, ["Horse Owner"], ["UnknownRole"], 0]) {
        assert.equal(isRoleAllowed(ROLES.HorseOwner, allowed), false);
    }
    assert.equal(globalThis.__hrcmsRoutingTest.redirects.length, 5);
    assert.ok(globalThis.__hrcmsRoutingTest.redirects.every((redirect) => redirect.to === "/permission-denied"));
});

test("unknown authenticated role retains a safe home, a readable warning and no role navigation", () => {
    const html = render(h(AppRoutes), authValue({ user: { ...owner, role: "UnknownRole" } }));
    assert.match(html, /Unrecognized role/);
    assert.match(html, /Contact club management/);
    assert.match(html, /No navigation options/);
    assert.equal(html.includes("UnknownRole"), false);
    assert.deepEqual(globalThis.__hrcmsRoutingTest.redirects, []);
});

test("navigation uses exact roles and exposes only implemented links for each role", () => {
    for (const role of ALL_ROLES) {
        const expected = [{ to: "/dashboard", label: "Dashboard" }];
        if (role === ROLES.HorseOwner) expected.push({ to: "/registrations", label: "Horse registrations" });
        if (role === ROLES.ClubManager) expected.push({ to: "/management/registrations", label: "Registration review" });
        expected.push({ to: "/horses", label: "Horses" });
        if ([ROLES.ClubManager, ROLES.HeadTrainer, ROLES.Trainer].includes(role)) expected.push({ to: "/training/templates", label: "Training Templates" });
        assert.deepEqual(getNavigationForRole(role).map(({ to, label }) => ({ to, label })), expected);
    }
    for (const role of ["Horse Owner", "horseowner", "Admin", "__proto__", 0, null]) assert.deepEqual(getNavigationForRole(role), []);
});

test("shell displays the current user, readable role, navigation and nested Outlet content", () => {
    const html = render(h(Routes, null,
        h(Route, { element: h(AppLayout) }, h(Route, { path: "/dashboard", element: h("p", null, "Nested page content") }))));
    assert.match(html, /<header/);
    assert.match(html, /Test Owner/);
    assert.match(html, /Horse Owner/);
    assert.match(html, /aria-label="Main navigation"/);
    assert.match(html, /aria-current="page"/);
    assert.match(html, /Nested page content/);
    assert.match(html, /Sign out/);
    assert.equal(globalThis.__hrcmsRoutingTest.buttons.length, 1);
});

test("shell user display falls back to username without showing a token or email", () => {
    const user = { ...owner, firstName: "", lastName: "", email: "private@example.test" };
    const html = render(h(AppLayout), authValue({ user }));
    assert.match(html, /test.owner/);
    assert.equal(html.includes(user.email), false);
    assert.equal(getUserDisplayName(null), "Club member");
});

test("shell sign-out invokes the existing logout service, sends Bearer and clears session on 204", async () => {
    seedSession();
    let calls = 0;
    api.defaults.adapter = async (config) => {
        calls++;
        assert.equal(config.url, "/api/auth/logout");
        assert.equal(config.method, "post");
        assert.equal(config.headers.get("Authorization"), "Bearer test-access");
        return { config, data: "", status: 204, statusText: "", headers: {} };
    };
    render(h(AppLayout));
    await globalThis.__hrcmsRoutingTest.buttons[0].onClick();
    assert.equal(calls, 1);
    assert.equal(store.getSession().status, "anonymous");
    assert.equal(storage.has("hrcms.session"), false);
    assert.deepEqual(globalThis.__hrcmsRoutingTest.navigations, [["/login", { replace: true }]]);
});

test("shell sign-out failure still clears locally and preserves the existing login warning", async () => {
    seedSession();
    api.defaults.adapter = async () => { throw new Error("Offline"); };
    render(h(AppLayout));
    await globalThis.__hrcmsRoutingTest.buttons[0].onClick();
    assert.equal(store.getSession().status, "anonymous");
    const [destination, options] = globalThis.__hrcmsRoutingTest.navigations[0];
    assert.equal(destination, "/login");
    assert.match(options.state.logoutError, /Unable to reach the server/);
});

test("permission-denied page is authenticated-only and provides a safe dashboard link", () => {
    const html = render(h(AppRoutes), authValue(), "/permission-denied");
    assert.match(html, /Permission denied/);
    assert.match(html, /Back to dashboard/);
    render(h(AppRoutes), authValue({ isAuthenticated: false, user: null }), "/permission-denied");
    assert.equal(globalThis.__hrcmsRoutingTest.redirects[0].to, "/login");
});

test("login redirects authenticated users to their intended route and waits during restoration", () => {
    render(h(AppRoutes), authValue(), { pathname: "/login", state: { from: { pathname: "/dashboard", search: "?view=home", hash: "" } } });
    assert.equal(globalThis.__hrcmsRoutingTest.redirects[0].to, "/dashboard?view=home");
    globalThis.__hrcmsRoutingTest.redirects.length = 0;
    assert.match(render(h(AppRoutes), authValue({ loading: true, isAuthenticated: false, user: null }), "/login"), /Loading/);
    assert.deepEqual(globalThis.__hrcmsRoutingTest.redirects, []);
});

test("lifecycle forms remain directly accessible with or without an existing authenticated session", () => {
    for (const value of [authValue(), authValue({ isAuthenticated: false, user: null })]) {
        for (const path of ["/register", "/verify-email", "/forgot-password", "/reset-password", "/accept-invitation"]) {
            assert.match(render(h(AppRoutes), value, path), /<form/);
        }
    }
    assert.deepEqual(globalThis.__hrcmsRoutingTest.redirects, []);
});

test("unknown routes offer login or dashboard appropriately without exposing the requested path", () => {
    for (const authenticated of [false, true]) {
        const html = render(h(AppRoutes), authValue({ isAuthenticated: authenticated, user: authenticated ? owner : null }), "/private-looking-path");
        assert.match(html, /Page not found/);
        assert.ok(html.includes(authenticated ? 'href="/dashboard"' : 'href="/login"'));
        assert.equal(html.includes("private-looking-path"), false);
    }
});

test("intended destination rejects external URLs and login loops, including trailing/case/encoded variants", () => {
    for (const pathname of ["https://example.test", "//example.test", "/\\example.test", "/login", "/LOGIN/", "/./login", "/%6cogin", "/login%2f", "/%", null]) {
        assert.equal(getLoginDestination({ from: { pathname } }), "/dashboard");
    }
    assert.equal(getLoginDestination(null), "/dashboard");
    assert.equal(getLoginDestination({ from: { pathname: "/future-protected", search: "?page=2", hash: "#section" } }), "/future-protected?page=2#section");
});
