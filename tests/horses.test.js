import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import axios from "axios";
import { ALL_ROLES, ROLES } from "../src/constants/roles.js";
import { HORSE_BROWSING_ROLES, HEALTH_STATUSES, healthDisplay } from "../src/constants/horses.js";
import { getNavigationForRole } from "../src/routes/navigation.js";

let server, api, store, service, photoResource, AuthContext, AppRoutes, List, ListResults, Profile, ProfileResult, PhotoView, Assignments, Approval, Review;
const user = { id: "owner-id", role: ROLES.HorseOwner, active: true, emailVerified: true };
const horse = { id: "horse-id", registrationId: "registration-id", ownerId: "owner-id", name: "Comet", registrationNumber: "REG-17", breed: "Thoroughbred",
    sire: "Sire", dam: "Dam", dateOfBirth: "2020-01-01", gender: "Gelding", healthStatus: "Monitoring", boardingStart: "2026-01-01", boardingEnd: "2026-12-31", archived: false };
const detail = { horse, latestMeasurement: { id: "measurement-id", horseId: horse.id, date: "2026-02-01", heightCm: 167.5, weightKg: 480.25 },
    preferences: { preferredHeadTrainerId: "preferred-head", preferredGroomId: "preferred-groom", preferredVeterinarianId: "preferred-vet" },
    assignments: [{ id: "current-id", role: "HeadTrainer", staffId: "official-head", startDate: "2026-01-02", endDate: null, active: true, notes: "Current record" },
        { id: "previous-id", role: "Groom", staffId: "previous-groom", startDate: "2025-01-01", endDate: "2025-12-31", active: false, notes: "Previous record" }],
    currentStall: { id: "occupancy-id", stallId: "stall-id", horseId: horse.id, endedAt: null, createdAt: "2026-01-02T10:00:00Z" } };
const reply = (config, data, status = 200) => ({ config, data, status, statusText: "", headers: {} });
function reject(config, status, data) { throw new axios.AxiosError("Rejected", "ERR_BAD_RESPONSE", config, null, reply(config, data, status)); }
const originalCreate = URL.createObjectURL;
const originalRevoke = URL.revokeObjectURL;
function plugin() {
    return { name: "horse-render-tests", enforce: "post",
        transform(code, id) {
            if (!id.replaceAll("\\", "/").includes("/src/")) return;
            return code.replaceAll('"react-router-dom"', '"virtual:horse-router"').replaceAll('"react/jsx-dev-runtime"', '"virtual:horse-jsx"');
        },
        resolveId(source) { if (source.startsWith("virtual:horse-")) return `\0${source}`; },
        load(id) {
            if (id === "\0virtual:horse-router") return `export * from 'react-router-dom';
                export function Navigate(props) { globalThis.__horse.redirects.push(props); return null; }`;
            if (id === "\0virtual:horse-jsx") return `import { jsxDEV as original } from 'react/jsx-dev-runtime';
                export { Fragment } from 'react/jsx-dev-runtime';
                export function jsxDEV(type, props, ...rest) {
                    if (type === 'button') globalThis.__horse.buttons.push(props);
                    if (type === 'img') globalThis.__horse.images.push(props);
                    return original(type, props, ...rest);
                }`;
        },
    };
}
before(async () => {
    const storage = new Map();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
        getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key),
    } });
    server = await createServer({ configFile: false, plugins: [plugin(), react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom", logLevel: "error" });
    ({ default: api } = await server.ssrLoadModule("/src/services/api.js"));
    store = await server.ssrLoadModule("/src/services/sessionStore.js");
    service = await server.ssrLoadModule("/src/services/horseService.js");
    photoResource = await server.ssrLoadModule("/src/services/horsePhotoResource.js");
    ({ AuthContext } = await server.ssrLoadModule("/src/context/useAuth.js"));
    ({ default: AppRoutes } = await server.ssrLoadModule("/src/routes/AppRoutes.jsx"));
    ({ default: List, HorseListResults: ListResults } = await server.ssrLoadModule("/src/pages/horses/HorseList.jsx"));
    ({ HorseProfileContent: Profile, HorseProfileResult: ProfileResult } = await server.ssrLoadModule("/src/pages/horses/HorseProfile.jsx"));
    ({ HorsePhotoView: PhotoView } = await server.ssrLoadModule("/src/components/horses/HorsePhoto.jsx"));
    ({ default: Assignments } = await server.ssrLoadModule("/src/components/horses/HorseAssignments.jsx"));
    ({ ApprovalResult: Approval, RegistrationReviewContent: Review } = await server.ssrLoadModule("/src/pages/management/RegistrationReview.jsx"));
});
beforeEach(() => {
    globalThis.__horse = { redirects: [], buttons: [], images: [] };
    store.clearSession();
    store.setTokens({ accessToken: "horse-access", refreshToken: "horse-refresh", expiresIn: 3600 }, store.getSession().generation);
    store.setCurrentUser(user, store.getSession().generation);
    api.defaults.adapter = async () => { throw new Error("Unexpected request: tests never contact the backend."); };
});
afterEach(() => { URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; });
after(async () => { await server?.close(); delete globalThis.__horse; });
function render(element, role = ROLES.HorseOwner, path = "/horses", extra = {}) {
    return renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(AuthContext.Provider,
        { value: { user: { ...user, role }, isAuthenticated: true, loading: false, logout: async () => {}, ...extra } }, element)));
}
for (const role of ALL_ROLES) {
    test(`Horse routes and navigation support backend-scoped ${role} access`, () => {
        for (const path of ["/horses", "/horses/horse-id"]) {
            assert.match(render(h(AppRoutes), role, path), /Đang tải hồ sơ ngựa/);
            assert.deepEqual(globalThis.__horse.redirects, []);
        }
        assert.ok(getNavigationForRole(role).some((item) => item.to === "/horses"));
        assert.ok(HORSE_BROWSING_ROLES.includes(role));
    });
}
test("unknown roles and role labels are denied Horse routes and navigation", () => {
    for (const role of ["Admin", "Horse Owner", "UnknownRole", 0]) {
        for (const path of ["/horses", "/horses/horse-id"]) {
            render(h(AppRoutes), role, path);
            assert.equal(globalThis.__horse.redirects.at(-1).to, "/permission-denied");
        }
        assert.equal(getNavigationForRole(role).some((item) => item.to === "/horses"), false);
    }
    render(h(AppRoutes), "", "/horses", { user: { ...user, role: undefined } });
    assert.equal(globalThis.__horse.redirects.at(-1).to, "/permission-denied");
});
test("anonymous Horse access preserves destination and restoration waits", () => {
    render(h(AppRoutes), ROLES.HorseOwner, "/horses/horse-id", { isAuthenticated: false, user: null });
    assert.equal(globalThis.__horse.redirects[0].to, "/login");
    assert.equal(globalThis.__horse.redirects[0].state.from.pathname, "/horses/horse-id");
    globalThis.__horse.redirects = [];
    assert.match(render(h(AppRoutes), ROLES.HorseOwner, "/horses", { loading: true, isAuthenticated: false, user: null }), /Loading/);
    assert.deepEqual(globalThis.__horse.redirects, []);
});
test("Horse list sends only supported search/health/pagination parameters and consumes exact page envelope", async () => {
    const page = { items: [horse], page: 2, pageSize: 20, total: 41 };
    api.defaults.adapter = async (config) => {
        assert.equal(config.method, "get"); assert.equal(config.url, "/api/horses");
        assert.deepEqual(config.params, { search: "REG-17", healthStatus: "Monitoring", page: 2, pageSize: 20 });
        return reply(config, page);
    };
    const result = await service.listHorses({ search: " REG-17 ", healthStatus: "Monitoring", page: 2, ownerId: "forged", archived: true, status: "Approved" });
    assert.deepEqual(result, page);
    const pages = [];
    const html = render(h(ListResults, { resource: { data: result }, onPage: (value) => pages.push(value) }));
    assert.match(html, /Trang 2 \/ 3/); assert.match(html, /REG-17/); assert.match(html, /href="\/horses\/horse-id"/);
    globalThis.__horse.buttons.find((button) => button.children === "Sau").onClick(); assert.deepEqual(pages, [3]);
});
test("Horse list uses a neutral placeholder without inventing photo URLs", () => {
    const html = render(h(ListResults, { resource: { data: { items: [horse], page: 1, pageSize: 20, total: 1 } }, onPage: () => {} }));
    assert.match(html, /class="hrcms-horse-list-placeholder" aria-hidden="true"/);
    assert.deepEqual(globalThis.__horse.images, []);
    assert.doesNotMatch(html, /<img[^>]+src=|\/api\/horses\/horse-id\/photo/);
});
test("empty Horse filters omit query keys and UI health choices exactly match backend enum", async () => {
    api.defaults.adapter = async (config) => { assert.deepEqual(config.params, { page: 1, pageSize: 20 }); return reply(config, { items: [], page: 1, pageSize: 20, total: 0 }); };
    await service.listHorses({ search: " " });
    assert.deepEqual(HEALTH_STATUSES, ["Fit", "Monitoring", "Injured", "Isolated"]);
    const html = render(h(List));
    for (const status of HEALTH_STATUSES) assert.ok(html.includes(`value="${status}"`));
    assert.doesNotMatch(html, /value="Approved"|value="Healthy"/);
});
test("Horse list empty state stays within returned server scope", () => {
    const html = render(h(ListResults, { resource: { data: { items: [], page: 1, pageSize: 20, total: 0 } } }));
    assert.match(html, /Không có hồ sơ ngựa phù hợp với bộ lọc trong phạm vi truy cập/);
    assert.ok(globalThis.__horse.buttons.every((button) => button.disabled));
});
test("Horse list loading and safe error with retry", () => {
    assert.match(render(h(ListResults, { resource: { loading: true } })), /Đang tải hồ sơ ngựa/);
    let retries = 0;
    const html = render(h(ListResults, { resource: { error: { status: 500, message: "internal diagnostics" }, reload: () => retries++ } }));
    assert.doesNotMatch(html, /internal diagnostics/);
    globalThis.__horse.buttons[0].onClick(); assert.equal(retries, 1);
});
test("Horse detail consumes the composite contract and renders only verified data", async () => {
    api.defaults.adapter = async (config) => { assert.equal(config.url, "/api/horses/horse-id"); assert.equal(config.method, "get"); return reply(config, detail); };
    const response = await service.getHorse(horse.id);
    assert.deepEqual(response, detail);
    const html = render(h(Profile, { data: response }));
    for (const value of ["Comet", "Sire", "Dam", "Gelding", "Thoroughbred", "owner-id", "Monitoring", "2020-01-01"]) assert.ok(html.includes(value), value);
    assert.doesNotMatch(html, /Owner email|Training lock|Medical records|href="\/registrations/);
});
test("missing optional Horse detail data is safe without fabricated measurement, staff or stall names", () => {
    const html = render(h(Profile, { data: { horse: { ...horse, boardingEnd: null }, latestMeasurement: null, currentStall: null, preferences: null, assignments: null } }));
    for (const text of ["Chưa cung cấp", "Chưa có vị trí chuồng", "Chưa có số đo", "Chưa có đề xuất", "Chưa có nhân sự chính thức được trả về", "Chưa có lịch sử phân công được trả về"]) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /stall-id|occupancy-id/);
    assert.match(render(h(Profile, { data: null })), /Không có chi tiết hồ sơ ngựa được trả về/);
});
test("latest physical measurement uses date/heightCm/weightKg from detail without a second endpoint", () => {
    const html = render(h(Profile, { data: detail }));
    assert.match(html, /Ngày đo gần nhất/); assert.match(html, /2026-02-01/);
    assert.match(html, /Chiều cao/); assert.match(html, /167\.5/); assert.match(html, /Cân nặng/); assert.match(html, /480\.25/);
    assert.deepEqual(globalThis.__horse.buttons, []);
});
test("preferences stay in their own column and never become official staff", () => {
    const html = render(h(Profile, { data: detail }));
    const staffSection = html.split('id="horse-current-assignments"')[1].split("</section>")[0];
    assert.match(staffSection, /không phải phân công chính thức/);
    assert.match(staffSection, /<td>Head Trainer<\/td><td>preferred-head<\/td><td>official-head<\/td>/);
    assert.match(staffSection, /<td>Groom \/ Stable Hand<\/td><td>preferred-groom<\/td><td>Chưa xác nhận<\/td>/);
    assert.match(staffSection, /<td>Veterinarian<\/td><td>preferred-vet<\/td><td>Chưa xác nhận<\/td>/);
});
test("preferences alone produce no current official assignments", () => {
    const html = render(h(Profile, { data: { ...detail, assignments: [] } }));
    assert.match(html, /preferred-head/); assert.match(html, /Chưa có nhân sự chính thức được trả về/);
});
test("current assignments depend on exact active=true; history preserves inactive records and exact role names", () => {
    const html = render(h(Assignments, { assignments: [...detail.assignments, { id: "unknown-id", staffId: "uncertain-staff", role: "UnknownRole", active: "true" }] }));
    const current = html.split('id="horse-current-assignments"')[1].split("</section>")[0];
    assert.match(current, /official-head/); assert.match(current, /Head Trainer/);
    assert.doesNotMatch(current, /previous-groom|uncertain-staff/);
    const history = html.split('id="horse-assignment-history"')[1];
    assert.match(history, /previous-groom/); assert.match(history, /2025-12-31/); assert.match(history, /Inactive/); assert.match(history, /Unrecognized role/);
    assert.doesNotMatch(history, /UnknownRole/);
});
test("assignment sections expose no mutation, measurement or archive controls", () => {
    const html = render(h(Profile, { data: detail }));
    assert.doesNotMatch(html, /<button|<form|<input|<select/);
    assert.deepEqual(globalThis.__horse.buttons, []);
});
test("boarding and stall occupancy use returned dates and ids without inventing stable/stall names", () => {
    const html = render(h(Profile, { data: detail }));
    for (const value of ["2026-12-31", "Vị trí chuồng", "stall-id", "occupancy-id", "2026-01-02T10:00:00Z"]) assert.ok(html.includes(value));
    assert.doesNotMatch(html, /Stable name|Stall name/);
});
test("unknown health and gender enums use neutral fallbacks", () => {
    for (const value of ["Healthy", "__proto__", "constructor", 0, null]) assert.equal(healthDisplay(value).label, "Unknown health status");
    const html = render(h(Profile, { data: { ...detail, horse: { ...horse, healthStatus: "SecretUnknownStatus", gender: "InventedGender" } } }));
    assert.match(html, /Unknown health status/); assert.match(html, /Không rõ giới tính/); assert.doesNotMatch(html, /SecretUnknownStatus|InventedGender/);
});
test("protected Horse photo uses Bearer and blob through the shared client", async () => {
    const blob = new Blob([new Uint8Array([255, 216, 255])], { type: "image/jpeg" });
    api.defaults.adapter = async (config) => {
        assert.equal(config.method, "get"); assert.equal(config.url, "/api/horses/horse-id/photo"); assert.equal(config.responseType, "blob");
        assert.equal(config.headers.get("Authorization"), "Bearer horse-access"); return reply(config, blob);
    };
    assert.equal(await service.getHorsePhoto(horse.id), blob);
});
test("photo object URL is released exactly once when its effect is disposed", async () => {
    const blob = new Blob(["image"], { type: "image/png" });
    api.defaults.adapter = async (config) => reply(config, blob);
    const created = [], revoked = [];
    URL.createObjectURL = (value) => { created.push(value); return "blob:test-horse-photo"; };
    URL.revokeObjectURL = (value) => revoked.push(value);
    let dispose;
    const result = await new Promise((resolve) => { dispose = photoResource.loadHorsePhoto(horse.id, resolve); });
    assert.deepEqual(result, { url: "blob:test-horse-photo" }); assert.deepEqual(created, [blob]);
    dispose(); dispose(); assert.deepEqual(revoked, ["blob:test-horse-photo"]);
});
test("photo response after unmount or route change creates no URL and publishes no stale image", async () => {
    let release; const wait = new Promise((resolve) => { release = resolve; });
    api.defaults.adapter = async (config) => { await wait; return reply(config, new Blob(["image"], { type: "image/png" })); };
    let created = 0, published = 0;
    URL.createObjectURL = () => { created++; return "blob:unexpected"; };
    const dispose = photoResource.loadHorsePhoto(horse.id, () => published++);
    dispose(); release(); await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(created, 0); assert.equal(published, 0);
});
test("photo view uses object URL, descriptive alt text and a decode-error handler", () => {
    let errors = 0;
    const html = render(h(PhotoView, { resource: { url: "blob:test-photo" }, name: horse.name, onImageError: () => errors++ }));
    assert.match(html, /src="blob:test-photo"/); assert.match(html, /Ảnh của Comet/);
    assert.doesNotMatch(html, /src="\/api|horse-access/);
    globalThis.__horse.images[0].onError(); assert.equal(errors, 1);
});
test("photo loading, absent photo and authorization failure have safe distinct states", () => {
    assert.match(render(h(PhotoView, { resource: null })), /Đang tải ảnh ngựa/);
    assert.match(render(h(PhotoView, { resource: { error: { status: 404 } } })), /Chưa có ảnh ngựa/);
    assert.match(render(h(PhotoView, { resource: { error: { status: 403, message: "Private diagnostics" } } })), /không có quyền xem ảnh ngựa/);
    const html = render(h(PhotoView, { resource: { error: { status: 500, message: "Private diagnostics" } } }));
    assert.doesNotMatch(html, /Private diagnostics/); assert.match(html, /Thử tải ảnh/);
});
test("missing photo error publishes no URL and normalizes JSON error blobs", async () => {
    api.defaults.adapter = async (config) => reject(config, 404, new Blob([JSON.stringify({ detail: "Photo unavailable" })], { type: "application/json" }));
    const result = await new Promise((resolve) => photoResource.loadHorsePhoto(horse.id, resolve));
    assert.equal(result.error.status, 404); assert.equal(result.error.message, "Photo unavailable"); assert.equal(result.url, undefined);
});
test("invalid photo content and empty images fail safely", async () => {
    for (const blob of [new Blob(["<html>"], { type: "text/html" }), new Blob([], { type: "image/png" }), new Blob(["svg"], { type: "image/svg+xml" })]) {
        api.defaults.adapter = async (config) => reply(config, blob);
        await assert.rejects(service.getHorsePhoto(horse.id), /could not be displayed/);
    }
});
for (const status of [403, 404, 409]) {
    test(`${status} Horse detail fails safely without logout or a mutation`, async () => {
        let calls = 0; const previous = store.getSession();
        api.defaults.adapter = async (config) => { calls++; assert.equal(config.method, "get"); reject(config, status, { detail: "Private record details" }); };
        let failure;
        try { await service.getHorse(horse.id); } catch (error) { failure = error; }
        assert.equal(failure.status, status); assert.equal(calls, 1); assert.equal(store.getSession(), previous);
        const html = render(h(ProfileResult, { resource: { error: failure, reload: () => {} } }));
        assert.doesNotMatch(html, /Private record details/); assert.match(html, /Thử lại hồ sơ/);
    });
}
test("Horse service exports only verified read operations", () => {
    assert.deepEqual(Object.keys(service).sort(), ["getHorse", "getHorsePhoto", "listHorses"]);
});
test("approval links only a returned horseId; reopened approved intake does not invent one", () => {
    assert.match(render(h(Approval, { horseId: "returned-horse-id" })), /href="\/horses\/returned-horse-id"/);
    assert.equal(render(h(Approval, {})), "");
    const html = render(h(Review, { initialRecord: { id: "registration-id", status: "Approved", name: "Comet" }, attachments: [], reload: () => {} }), ROLES.ClubManager);
    assert.doesNotMatch(html, /href="\/horses\/|Official Horse ID/);
});
