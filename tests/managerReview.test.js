import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import axios from "axios";
import { ALL_ROLES, ROLES } from "../src/constants/roles.js";
import { getNavigationForRole } from "../src/routes/navigation.js";

let server, api, store, service, shared, files, AuthContext, AppRoutes, Queue, Results, Detail, Outcome, Edit, Confirmation;
const manager = { id: "manager-id", role: ROLES.ClubManager, active: true, emailVerified: true };
const record = { id: "record-id", ownerId: "owner-id", status: "PendingReview", name: "Comet", sire: "Sire", dam: "Dam",
    dateOfBirth: "2020-01-01", gender: "Gelding", breed: "Thoroughbred", registrationNumber: "REG-7", heightCm: 160, weightKg: 470,
    measurementDate: "2026-01-01", declaredHealth: "Owner declaration", healthNotes: "Owner notes", boardingStart: "2026-02-01", boardingEnd: "2026-12-31",
    preferredHeadTrainerId: "preferred-head-id", preferredGroomId: "preferred-groom-id", preferredVeterinarianId: "preferred-vet-id", createdAt: "2026-01-01T00:00:00Z" };
const attachments = [{ id: "certificate-id", type: "Certificate", fileName: "certificate.pdf", contentType: "application/pdf", length: 300,
    certificateNumber: "CERT-7", issueDate: "2020-01-01", expiryDate: "2030-01-01" },
{ id: "photo-id", type: "HorsePhoto", fileName: "photo.jpg", length: 123 }, { id: "medical-id", type: "MedicalDocument", fileName: "medical.pdf", length: 123 }];
const reply = (config, data, status = 200) => ({ config, data, status, statusText: "", headers: {} });
function reject(config, status, data) { throw new axios.AxiosError("Rejected", "ERR_BAD_RESPONSE", config, null, reply(config, data, status)); }
function plugin() {
    return { name: "review-render-tests", enforce: "post",
        transform(code, id) {
            if (!id.replaceAll("\\", "/").includes("/src/")) return;
            return code.replaceAll('"react-router-dom"', '"virtual:review-router"').replaceAll('"react/jsx-dev-runtime"', '"virtual:review-jsx"');
        },
        resolveId(source) { if (source.startsWith("virtual:review-")) return `\0${source}`; },
        load(id) {
            if (id === "\0virtual:review-router") return `export * from 'react-router-dom';
                export function Navigate(props) { globalThis.__review.redirects.push(props); return null; }`;
            if (id === "\0virtual:review-jsx") return `import { jsxDEV as original } from 'react/jsx-dev-runtime';
                export { Fragment } from 'react/jsx-dev-runtime';
                export function jsxDEV(type, props, ...rest) {
                    if (type === 'button') globalThis.__review.buttons.push(props);
                    if (type === 'form') globalThis.__review.forms.push(props);
                    if (type === 'input') globalThis.__review.inputs.push(props);
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
    service = await server.ssrLoadModule("/src/services/managerReviewService.js");
    shared = await server.ssrLoadModule("/src/services/registrationService.js");
    files = await server.ssrLoadModule("/src/services/registrationAttachments.js");
    ({ AuthContext } = await server.ssrLoadModule("/src/context/useAuth.js"));
    ({ default: AppRoutes } = await server.ssrLoadModule("/src/routes/AppRoutes.jsx"));
    ({ default: Queue, RegistrationQueueResults: Results } = await server.ssrLoadModule("/src/pages/management/RegistrationQueue.jsx"));
    ({ RegistrationReviewContent: Detail, ApprovalResult: Outcome } = await server.ssrLoadModule("/src/pages/management/RegistrationReview.jsx"));
    ({ default: Edit } = await server.ssrLoadModule("/src/components/registrations/ManagerEditForm.jsx"));
    ({ default: Confirmation } = await server.ssrLoadModule("/src/components/registrations/ReviewConfirmation.jsx"));
});
beforeEach(() => {
    globalThis.__review = { redirects: [], buttons: [], inputs: [], forms: [] };
    store.clearSession();
    store.setTokens({ accessToken: "manager-access", refreshToken: "manager-refresh", expiresIn: 3600 }, store.getSession().generation);
    store.setCurrentUser(manager, store.getSession().generation);
    api.defaults.adapter = async () => { throw new Error("Unexpected request: tests do not use a live backend."); };
});
after(async () => { await server?.close(); delete globalThis.__review; });
function render(element, role = ROLES.ClubManager, path = "/management/registrations") {
    return renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(AuthContext.Provider,
        { value: { user: { ...manager, role }, isAuthenticated: true, loading: false, logout: async () => {} } }, element)));
}
function detail(value = record) { return render(h(Detail, { initialRecord: value, attachments, reload: () => {} })); }
const labels = () => globalThis.__review.buttons.map((button) => button.children);

for (const role of [...ALL_ROLES, "UnknownRole"]) {
    test(`Manager routes authorize exactly ClubManager: ${role}`, () => {
        for (const path of ["/management/registrations", "/management/registrations/record-id"]) {
            globalThis.__review.redirects = [];
            const html = render(h(AppRoutes), role, path);
            if (role === ROLES.ClubManager) { assert.deepEqual(globalThis.__review.redirects, []); assert.match(html, /Đang tải danh sách chờ duyệt|Đang tải hồ sơ kiểm tra/); }
            else { assert.equal(globalThis.__review.redirects[0].to, "/permission-denied"); assert.doesNotMatch(html, /Đang tải danh sách chờ duyệt|Đang tải hồ sơ kiểm tra/); }
        }
    });
}
test("only ClubManager sees review navigation and Owner navigation stays separate", () => {
    for (const role of [...ALL_ROLES, "UnknownRole"]) {
        const paths = getNavigationForRole(role).map((item) => item.to);
        assert.equal(paths.includes("/management/registrations"), role === ROLES.ClubManager);
        assert.equal(paths.includes("/registrations"), role === ROLES.HorseOwner);
        assert.ok(paths.every((path) => !path.includes("assignment")));
    }
});
test("review queue defaults to exact PendingReview filter", () => {
    const html = render(h(Queue));
    assert.match(html, /value="PendingReview" selected=""/);
    assert.doesNotMatch(html, /value="Submitted"|value="Rejected"/);
});
test("Manager queue reuses paginated GET without an Owner filter", async () => {
    api.defaults.adapter = async (config) => {
        assert.equal(config.url, "/api/registrations"); assert.equal(config.method, "get");
        assert.deepEqual(config.params, { status: "PendingReview", page: 2, pageSize: 20 });
        assert.equal(config.headers.get("Authorization"), "Bearer manager-access");
        return reply(config, { items: [record], page: 2, pageSize: 20, total: 41 });
    };
    const data = await shared.listRegistrations({ status: "PendingReview", page: 2 });
    const pages = [];
    const html = render(h(Results, { resource: { data }, onPage: (page) => pages.push(page) }));
    assert.match(html, /Trang 2 \/ 3/); assert.match(html, /owner-id/); assert.match(html, /Comet/);
    assert.match(html, /<th scope="col">Yêu cầu \/ ngựa<\/th>/);
    assert.match(html, /href="\/management\/registrations\/record-id"/);
    globalThis.__review.buttons.find((button) => button.children === "Sau").onClick();
    assert.deepEqual(pages, [3]);
});
test("queue loading hides rows and mutations", () => {
    assert.match(render(h(Results, { resource: { loading: true } })), /Đang tải danh sách chờ duyệt/);
    assert.deepEqual(labels(), []);
});
test("queue empty state is explicit", () => {
    assert.match(render(h(Results, { resource: { data: { items: [], page: 1, pageSize: 20, total: 0 } } })), /Không có yêu cầu đăng ký phù hợp/);
    assert.ok(globalThis.__review.buttons.every((button) => button.disabled));
});
test("queue error is safe and offers retry", () => {
    let retries = 0;
    const html = render(h(Results, { resource: { error: { status: 500, message: "private stack trace" }, reload: () => retries++ } }));
    assert.doesNotMatch(html, /private stack trace/);
    globalThis.__review.buttons[0].onClick(); assert.equal(retries, 1);
});
test("Manager detail renders intake, Owner id and preferences without inventing personal or audit data", () => {
    const html = detail({ ...record, reviewReason: "Clarify certificate" });
    for (const text of ["Comet", "Sire", "Dam", "Gelding", "Thoroughbred", "160", "470", "Owner declaration", "Owner notes", "owner-id", "preferred-head-id", "Clarify certificate"]) assert.ok(html.includes(text), text);
    assert.match(html, /chưa phải phân công chính thức/);
    assert.doesNotMatch(html, /Audit history|Owner email|preferredTrainerId|name="healthStatus"/);
    assert.deepEqual(globalThis.__review.inputs, []);
});
test("Manager attachment inspection shows all intake types and metadata with no upload/delete/replace", () => {
    const html = detail();
    for (const text of ["Ảnh ngựa", "Giấy chứng nhận", "Tài liệu sức khỏe", "CERT-7", "2020-01-01", "2030-01-01"]) assert.ok(html.includes(text));
    assert.equal(labels().filter((label) => label === "Tải xuống").length, 3);
    assert.ok(labels().every((label) => !/Tải tệp lên|Xóa|Thay thế/.test(label)));
    assert.doesNotMatch(html, /type="file"/);
});
test("Manager download uses shared Bearer blob request and scoped path", async () => {
    const blob = new Blob(["%PDF-"], { type: "application/pdf" });
    api.defaults.adapter = async (config) => {
        assert.equal(config.url, "/api/registrations/record-id/attachments/certificate-id");
        assert.equal(config.headers.get("Authorization"), "Bearer manager-access"); assert.equal(config.responseType, "blob");
        return reply(config, blob);
    };
    assert.equal(await files.fetchAttachment(record.id, "certificate-id"), blob);
});
for (const status of ["PendingReview", "Draft", "RevisionRequired", "Approved", "Cancelled", "Unknown"]) {
    test(`review controls respect ${status}`, () => {
        const html = detail({ ...record, status });
        const enabled = status === "PendingReview";
        assert.equal(service.canReview(status), enabled);
        for (const label of ["Chỉnh sửa thông tin", "Yêu cầu bổ sung", "Phê duyệt"]) assert.equal(labels().includes(label), enabled);
        if (!enabled) assert.match(html, /chỉ đọc trong luồng kiểm tra/);
        if (status === "Unknown") assert.match(html, /Unknown status/);
    });
}
test("Manager edit form exposes exactly the four permitted fields", () => {
    render(h(Edit, { record, onSave: async () => {}, onDiscard: () => {} }));
    assert.deepEqual(globalThis.__review.inputs.map((input) => input.name), ["name", "registrationNumber", "boardingStart", "boardingEnd"]);
    assert.deepEqual(service.MANAGER_FIELDS, ["name", "registrationNumber", "boardingStart", "boardingEnd"]);
});
test("Manager payload excludes every Owner-only field and never performs Owner replacement", () => {
    assert.deepEqual(service.managerEditPayload(record), { name: "Comet", registrationNumber: "REG-7", boardingStart: "2026-02-01", boardingEnd: "2026-12-31" });
    assert.deepEqual(service.managerEditPayload({ name: " Renamed ", sire: "not allowed", ownerId: "forged", preferredTrainerId: "forged" }), { name: "Renamed" });
});
test("Manager omission/null preserves fields; empty registration number is sent as empty text", () => {
    assert.deepEqual(service.managerEditPayload({}), {});
    assert.deepEqual(service.managerEditPayload({ name: null, registrationNumber: "", boardingEnd: "" }), { name: null, registrationNumber: "", boardingEnd: null });
    assert.equal(Object.hasOwn(service.managerEditPayload({ name: "Only name" }), "boardingStart"), false);
});
test("Manager cannot silently clear a saved end date and validates administrative values", () => {
    const values = service.managerEditForm(record);
    assert.deepEqual(service.validateManagerEdit(values, record), {});
    assert.match(service.validateManagerEdit({ ...values, boardingEnd: "" }, record).boardingEnd, /cannot be cleared/);
    assert.deepEqual(service.validateManagerEdit({ ...values, boardingEnd: "" }, { ...record, boardingEnd: null }), {});
    const errors = service.validateManagerEdit({ name: "", registrationNumber: "x".repeat(101), boardingStart: "bad", boardingEnd: "bad" }, record);
    assert.equal(Object.keys(errors).length, 4);
});
test("limited PUT refetches authoritative registration after success", async () => {
    const calls = [];
    api.defaults.adapter = async (config) => {
        calls.push(config.method);
        if (config.method === "put") {
            assert.deepEqual(JSON.parse(config.data), { name: "Updated" }); assert.equal(config.retryOnUnauthorized, false);
            return reply(config, { ...record, name: "Ignored PUT response" });
        }
        return reply(config, { ...record, name: "Authoritative", status: "PendingReview" });
    };
    assert.equal((await service.saveManagerEdit(record.id, { name: "Updated" })).name, "Authoritative");
    assert.deepEqual(calls, ["put", "get"]);
});
test("save followed by failed refetch is explicitly uncertain even for a 400 refetch", async () => {
    api.defaults.adapter = async (config) => config.method === "put" ? reply(config, record) : reject(config, 400, { detail: "Could not load state" });
    await assert.rejects(service.saveManagerEdit(record.id, { name: "Updated" }), (error) => error.uncertain && service.isUncertainReviewError(error));
});
test("request revision requires a nonblank reason of at most 2000 characters", async () => {
    for (const reason of [undefined, "", "   ", "a".repeat(2001)]) await assert.rejects(service.reviewRegistration(record.id, { approve: false, reason }), /revision reason/);
    assert.equal(service.revisionReasonError("a".repeat(2000)), "");
    let decisions = 0;
    render(h(Confirmation, { approve: false, onConfirm: async () => decisions++, onBack: () => {} }));
    await globalThis.__review.forms[0].onSubmit({ preventDefault() {} }); assert.equal(decisions, 0);
});
test("revision sends exact false/reason and renders returned RevisionRequired with no further mutations", async () => {
    api.defaults.adapter = async (config) => {
        assert.equal(config.url, "/api/registrations/record-id/review"); assert.equal(config.method, "post");
        assert.deepEqual(JSON.parse(config.data), { approve: false, reason: "Clearer certificate needed" });
        return reply(config, { registration: { ...record, status: "RevisionRequired", reviewReason: "Clearer certificate needed" }, horseId: null });
    };
    const result = await service.reviewRegistration(record.id, { approve: false, reason: " Clearer certificate needed " });
    assert.equal(result.horseId, null);
    const html = detail(result.registration);
    assert.match(html, /Revision required/); assert.match(html, /Clearer certificate needed/); assert.equal(labels().includes("Phê duyệt"), false);
});
test("approval sends exact true/null and keeps authoritative registration and horseId", async () => {
    api.defaults.adapter = async (config) => {
        assert.deepEqual(JSON.parse(config.data), { approve: true, reason: null }); assert.equal(config.retryOnUnauthorized, false);
        return reply(config, { registration: { ...record, status: "Approved", reviewReason: null }, horseId: "official-horse-id" });
    };
    const result = await service.reviewRegistration(record.id, { approve: true, reason: "ignored", preferredTrainerId: "not sent" });
    assert.equal(result.registration.status, "Approved"); assert.equal(result.horseId, "official-horse-id");
    detail(result.registration); assert.equal(labels().includes("Phê duyệt"), false);
});
test("approval confirmation describes Horse creation and no assignments, with no mandatory comment", async () => {
    const decisions = [];
    const html = render(h(Confirmation, { approve: true, onConfirm: async (decision) => decisions.push(decision), onBack: () => {} }));
    assert.match(html, /tạo hoặc kích hoạt Horse Profile chính thức/); assert.match(html, /không được tự động phân công/); assert.doesNotMatch(html, /textarea/);
    assert.match(html, /role="dialog" aria-modal="true"/);
    await globalThis.__review.forms[0].onSubmit({ preventDefault() {} }); assert.deepEqual(decisions, [{ approve: true, reason: null }]);
});
test("revision dialog labels its reason and requires confirmation before sending", () => {
    let closes = 0;
    const html = render(h(Confirmation, { approve: false, onConfirm: async () => assert.fail("blank revision submitted"), onBack: () => closes++ }));
    assert.match(html, /aria-labelledby="review-confirmation-title" aria-describedby="review-confirmation-description"/);
    assert.match(html, /id="review-confirmation-description"/);
    assert.match(html, /<label for="review-reason">Lý do yêu cầu bổ sung/);
    assert.match(html, /<textarea id="review-reason"/);
    let prevented = false;
    globalThis.__review.forms[0].onKeyDown({ key: "Escape", preventDefault() { prevented = true; } });
    assert.equal(prevented, true); assert.equal(closes, 1);
    globalThis.__review.buttons.find((button) => button.children === "Hủy").onClick();
    assert.equal(closes, 2);
});
test("approval dialog exposes a failed review request without losing confirmation", () => {
    const html = render(h(Confirmation, { approve: true, requestError: { status: 400, message: "Review could not be completed." },
        onConfirm: async () => {}, onBack: () => {} }));
    assert.match(html, /Phê duyệt hồ sơ đăng ký/);
    assert.match(html, /role="alert">Review could not be completed/);
    assert.match(html, /Xác nhận phê duyệt/);
});
test("busy confirmation cannot invoke a second review decision", async () => {
    let calls = 0;
    render(h(Confirmation, { approve: true, busy: true, onConfirm: async () => calls++ }));
    await globalThis.__review.forms[0].onSubmit({ preventDefault() {} }); assert.equal(calls, 0);
    let closes = 0;
    render(h(Confirmation, { approve: true, busy: true, onConfirm: async () => calls++, onBack: () => closes++ }));
    globalThis.__review.forms.at(-1).onKeyDown({ key: "Escape", preventDefault() { assert.fail("busy dialog dismissed"); } });
    assert.equal(closes, 0);
});
test("approval outcome links the returned horseId to the implemented profile without inventing an assignment", () => {
    const html = render(h(Outcome, { horseId: "official-horse-id" }));
    assert.match(html, /official-horse-id/); assert.match(html, /chưa được phân công chính thức/);
    assert.match(html, /href="\/horses\/official-horse-id"/);
    assert.equal(render(h(Outcome, { horseId: null })), "");
});
test("malformed or missing review result fails uncertain instead of assuming success", async () => {
    for (const response of [null, {}, { registration: { ...record, status: "Approved" } }, { registration: record, horseId: "horse-id" }]) {
        api.defaults.adapter = async (config) => reply(config, response);
        await assert.rejects(service.reviewRegistration(record.id, { approve: true }), (error) => error.uncertain === true);
    }
});
for (const status of [400, 403, 404, 409, 500]) {
    test(`${status} review errors are normalized and never replay the decision`, async () => {
        let calls = 0; const previous = store.getSession();
        api.defaults.adapter = async (config) => { calls++; reject(config, status, { detail: "Review could not be completed." }); };
        await assert.rejects(service.reviewRegistration(record.id, { approve: true }), (error) => {
            assert.equal(error.message, "Review could not be completed."); assert.equal(error.status, status);
            assert.equal(service.isUncertainReviewError(error), status !== 400); return true;
        });
        assert.equal(calls, 1); assert.equal(store.getSession(), previous);
    });
}
test("network failure marks review state uncertain and sends only one decision", async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => { calls++; throw new axios.AxiosError("offline", "ERR_NETWORK", config); };
    await assert.rejects(service.reviewRegistration(record.id, { approve: false, reason: "Needed" }), (error) => service.isUncertainReviewError(error));
    assert.equal(calls, 1);
});
test("401 refreshes the session but does not automatically replay approval", async () => {
    const calls = [];
    api.defaults.adapter = async (config) => {
        calls.push(config.url);
        if (config.url === "/api/auth/refresh") return reply(config, { accessToken: "renewed-manager-access", refreshToken: "renewed-manager-refresh", expiresIn: 3600 });
        reject(config, 401, { detail: "Session expired" });
    };
    await assert.rejects(service.reviewRegistration(record.id, { approve: true }), (error) => error.status === 401 && service.isUncertainReviewError(error));
    assert.deepEqual(calls, ["/api/registrations/record-id/review", "/api/auth/refresh"]);
    assert.equal(store.getSession().status, "authenticated"); assert.equal(store.getSession().accessToken, "renewed-manager-access");
});
test("failed session refresh clears auth without replaying revision", async () => {
    const calls = [];
    api.defaults.adapter = async (config) => { calls.push(config.url); reject(config, 401, {}); };
    await assert.rejects(service.reviewRegistration(record.id, { approve: false, reason: "Needed" }));
    assert.deepEqual(calls, ["/api/registrations/record-id/review", "/api/auth/refresh"]);
    assert.equal(store.getSession().status, "anonymous");
});
