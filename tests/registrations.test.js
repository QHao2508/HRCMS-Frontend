import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import axios from "axios";
import { ALL_ROLES, ROLES } from "../src/constants/roles.js";
import { ATTACHMENT_TYPES, PREFERENCES, canEditRegistration, statusDisplay } from "../src/constants/registration.js";
import { EDITABLE_FIELDS, registrationForm, registrationPayload, submissionMissing, validateDraft } from "../src/services/registrationValidation.js";

// Real components/services rendered with Vite. Only navigation and DOM event
// discovery are instrumented. Requests use Axios adapters, never the network.
let server, api, store, services, files, AuthContext, AppRoutes, ListContent, DetailContent, Attachments, Create, ErrorView;
const storage = new Map();
const owner = { id: "owner", role: ROLES.HorseOwner, active: true, emailVerified: true, firstName: "Test" };
const draft = { id: "record-1", ownerId: "owner", status: "Draft", createdAt: "2026-01-02T12:00:00Z", name: "Comet",
    sire: "Sire", dam: "Dam", dateOfBirth: "2020-01-01", gender: "Gelding", breed: "Thoroughbred", registrationNumber: "REG-7",
    heightCm: 165.5, weightKg: 480, measurementDate: "2026-01-01", declaredHealth: "Owner declaration", healthNotes: "Keep this note",
    boardingStart: "2026-02-01", boardingEnd: "2026-12-31", preferredHeadTrainerId: "head-id", preferredGroomId: "groom-id", preferredVeterinarianId: "vet-id" };
const attachments = [
    { id: "photo", type: "HorsePhoto", fileName: "horse.jpg", length: 200, contentType: "image/jpeg" },
    { id: "cert", type: "Certificate", fileName: "certificate.pdf", length: 300, contentType: "application/pdf", certificateNumber: "CERT-7", issueDate: "2020-01-01", expiryDate: "2030-01-01" },
];
const reply = (config, data, status = 200) => ({ config, data, status, statusText: "", headers: {} });
function reject(config, status, data) { throw new axios.AxiosError("Rejected", "ERR_BAD_RESPONSE", config, null, reply(config, data, status)); }
function harness() {
    return {
        name: "registration-test-harness", enforce: "post",
        transform(code, id) {
            if (!id.replaceAll("\\", "/").includes("/src/")) return;
            return code.replaceAll('"react-router-dom"', '"virtual:intake-router"').replaceAll('"react/jsx-dev-runtime"', '"virtual:intake-jsx"');
        },
        resolveId(source) { if (source.startsWith("virtual:intake-")) return `\0${source}`; },
        load(id) {
            if (id === "\0virtual:intake-router") return `
                export * from 'react-router-dom';
                export function Navigate(props) { globalThis.__intake.redirects.push(props); return null; }
                export function useNavigate() { return (...args) => globalThis.__intake.navigation.push(args); }
            `;
            if (id === "\0virtual:intake-jsx") return `
                import { jsxDEV as original } from 'react/jsx-dev-runtime';
                export { Fragment } from 'react/jsx-dev-runtime';
                export function jsxDEV(type, props, ...rest) {
                    if (type === 'button') globalThis.__intake.buttons.push(props);
                    if (type === 'form') globalThis.__intake.forms.push(props);
                    if (type?.name === 'RegistrationAttachments') globalThis.__intake.attachmentPanel = props;
                    return original(type, props, ...rest);
                }
            `;
        },
    };
}
before(async () => {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
        getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key),
    } });
    server = await createServer({ configFile: false, plugins: [harness(), react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom", logLevel: "error" });
    ({ default: api } = await server.ssrLoadModule("/src/services/api.js"));
    store = await server.ssrLoadModule("/src/services/sessionStore.js");
    services = await server.ssrLoadModule("/src/services/registrationService.js");
    files = await server.ssrLoadModule("/src/services/registrationAttachments.js");
    ({ AuthContext } = await server.ssrLoadModule("/src/context/useAuth.js"));
    ({ default: AppRoutes } = await server.ssrLoadModule("/src/routes/AppRoutes.jsx"));
    ({ RegistrationListContent: ListContent } = await server.ssrLoadModule("/src/pages/registrations/RegistrationList.jsx"));
    ({ RegistrationDetailContent: DetailContent } = await server.ssrLoadModule("/src/pages/registrations/RegistrationDetail.jsx"));
    ({ default: Create } = await server.ssrLoadModule("/src/pages/registrations/RegistrationCreate.jsx"));
    ({ default: Attachments } = await server.ssrLoadModule("/src/components/registrations/RegistrationAttachments.jsx"));
    ({ default: ErrorView } = await server.ssrLoadModule("/src/components/registrations/RegistrationError.jsx"));
});
beforeEach(() => {
    globalThis.__intake = { redirects: [], navigation: [], forms: [], buttons: [] };
    store.clearSession(); storage.clear();
    store.setTokens({ accessToken: "owner-access", refreshToken: "owner-refresh", expiresIn: 3600 }, store.getSession().generation);
    store.setCurrentUser(owner, store.getSession().generation);
    api.defaults.adapter = async () => { throw new Error("Unexpected request: no live backend allowed."); };
});
after(async () => { await server?.close(); delete globalThis.__intake; });
function render(element, role = ROLES.HorseOwner, path = "/registrations") {
    return renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] }, h(AuthContext.Provider,
        { value: { user: { ...owner, role }, loading: false, isAuthenticated: true, logout: async () => {} } }, element)));
}
function detail(record = draft, items = attachments) {
    return render(h(DetailContent, { initialRecord: record, initialAttachments: items, reload: () => {} }));
}
function button(label) { return globalThis.__intake.buttons.find((props) => props.children === label); }

test("all three registration routes allow only HorseOwner, denying every other role and unknown roles", () => {
    for (const path of ["/registrations", "/registrations/new", "/registrations/record-1"]) {
        render(h(AppRoutes), ROLES.HorseOwner, path);
        assert.deepEqual(globalThis.__intake.redirects, []);
        for (const role of [...ALL_ROLES.filter((value) => value !== ROLES.HorseOwner), "Unknown", "Horse Owner"]) {
            const html = render(h(AppRoutes), role, path);
            assert.equal(globalThis.__intake.redirects.at(-1).to, "/permission-denied");
            assert.doesNotMatch(html, /Create draft|Loading registration|Save draft/);
        }
        globalThis.__intake.redirects = [];
    }
});
test("registration list uses backend pagination and exact status filtering", async () => {
    const data = { items: [draft], page: 2, pageSize: 20, total: 21 };
    api.defaults.adapter = async (config) => {
        assert.equal(config.url, "/api/registrations"); assert.equal(config.method, "get");
        assert.deepEqual(config.params, { page: 2, pageSize: 20, status: "RevisionRequired" });
        assert.equal(config.headers.get("Authorization"), "Bearer owner-access");
        return reply(config, data);
    };
    assert.deepEqual(await services.listRegistrations({ page: 2, status: "RevisionRequired" }), data);
    const html = render(h(ListContent, { data }));
    assert.match(html, /Comet/); assert.match(html, /REG-7/); assert.match(html, /2026-01-02/); assert.match(html, /View \/ edit/);
});
test("empty list has an explicit empty state and all-status requests omit status", async () => {
    api.defaults.adapter = async (config) => { assert.equal(Object.hasOwn(config.params, "status"), false); return reply(config, { items: [], page: 1, pageSize: 20, total: 0 }); };
    assert.match(render(h(ListContent, { data: await services.listRegistrations() })), /No registrations match this filter/);
});
test("partial draft is valid and create whitelists all 17 nullable keys without ownerId or Trainer", async () => {
    assert.equal(EDITABLE_FIELDS.length, 17);
    assert.deepEqual(validateDraft(registrationForm()), {});
    api.defaults.adapter = async (config) => {
        assert.equal(config.method, "post"); assert.equal(config.url, "/api/registrations");
        const body = JSON.parse(config.data);
        assert.deepEqual(Object.keys(body).sort(), [...EDITABLE_FIELDS].sort());
        assert.equal(body.name, "Partial"); assert.equal(body.sire, null);
        assert.equal(Object.hasOwn(body, "ownerId"), false); assert.equal(Object.hasOwn(body, "preferredTrainerId"), false);
        return reply(config, { id: "created", status: "Draft", ...body }, 201);
    };
    assert.equal((await services.createRegistration({ name: "Partial", ownerId: "forged", preferredTrainerId: "trainer" })).id, "created");
});
test("create page saves an empty partial draft and navigates using the returned persistent id", async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => { calls++; assert.ok(Object.values(JSON.parse(config.data)).every((value) => value === null)); return reply(config, { id: "new-id", status: "Draft" }, 201); };
    render(h(Create));
    await globalThis.__intake.forms[0].onSubmit({ preventDefault() {} });
    assert.equal(calls, 1);
    assert.deepEqual(globalThis.__intake.navigation, [["/registrations/new-id", { replace: true }]]);
});
test("existing draft loads unwrapped and maps all editable values without losing dates or numbers", async () => {
    api.defaults.adapter = async (config) => { assert.equal(config.url, "/api/registrations/record-1"); return reply(config, draft); };
    const record = await services.getRegistration("record-1");
    const form = registrationForm(record);
    assert.equal(form.heightCm, "165.5"); assert.equal(form.dateOfBirth, "2020-01-01");
    assert.deepEqual(registrationPayload(form), Object.fromEntries(EDITABLE_FIELDS.map((key) => [key, draft[key]])));
});
test("Owner PUT replaces all editable fields, preserving untouched values when only name changes", async () => {
    const form = { ...registrationForm(draft), name: "Updated" };
    api.defaults.adapter = async (config) => {
        assert.equal(config.method, "put"); assert.equal(config.url, "/api/registrations/record-1");
        const body = JSON.parse(config.data);
        assert.deepEqual(body, { ...Object.fromEntries(EDITABLE_FIELDS.map((key) => [key, draft[key]])), name: "Updated" });
        return reply(config, { ...draft, ...body });
    };
    assert.equal((await services.updateRegistration(draft.id, form)).healthNotes, "Keep this note");
});
test("intentionally cleared text, dates, numbers and preference ids become null, never zero or omitted", () => {
    const cleared = ["healthNotes", "boardingEnd", "heightCm", "preferredGroomId", "registrationNumber"];
    const form = registrationForm(draft);
    for (const field of cleared) form[field] = "  ";
    const body = registrationPayload(form);
    for (const field of cleared) assert.equal(body[field], null);
    assert.equal(body.weightKg, 480); assert.equal(body.preferredVeterinarianId, "vet-id");
});
for (const status of ["Draft", "RevisionRequired", "PendingReview", "Approved", "Cancelled", "UnexpectedStatus"]) {
    test(`${status}: correct editable/upload/submit/cancel action availability`, () => {
        const html = detail({ ...draft, status, reviewReason: status === "RevisionRequired" ? "Add a clearer certificate" : null });
        const editable = ["Draft", "RevisionRequired"].includes(status);
        assert.equal(canEditRegistration(status), editable);
        assert.equal(!!button("Save changes"), editable);
        assert.equal(!!button("Upload attachment"), editable);
        assert.equal(!!button("Cancel registration"), editable);
        assert.equal(!!button(status === "RevisionRequired" ? "Resubmit registration" : "Submit registration"), editable);
        if (!editable) { assert.match(html, /read-only/); assert.match(html, /fieldset disabled/); }
        if (status === "RevisionRequired") assert.match(html, /Add a clearer certificate/);
        if (status === "UnexpectedStatus") { assert.match(html, /Unknown status/); assert.doesNotMatch(html, /UnexpectedStatus/); }
        assert.ok(button("Download"));
    });
}
test("unknown status labels fail safely even for inherited object-property names", () => {
    for (const status of ["Submitted", "__proto__", "constructor", undefined, 0]) {
        assert.equal(canEditRegistration(status), false); assert.equal(statusDisplay(status).label, "Unknown status");
    }
});
test("staff directory filters each allowed role on the server, follows pagination and removes wrong-role results", async () => {
    const requests = [];
    api.defaults.adapter = async (config) => {
        assert.equal(config.url, "/api/staff/directory");
        const { role, page, pageSize } = config.params; requests.push({ role, page });
        assert.equal(pageSize, 20);
        return reply(config, { items: [{ id: `${role}-${page}`, role, firstName: "Staff", lastName: "Member" }, { id: "wrong", role: "Trainer" }], page, pageSize: 2, total: 4 });
    };
    const result = await services.listPreferredStaff();
    assert.deepEqual(Object.keys(result), ["HeadTrainer", "Groom", "Veterinarian"]);
    assert.equal(requests.length, 6);
    for (const [role, people] of Object.entries(result)) { assert.equal(people.length, 2); assert.ok(people.every((person) => person.role === role)); }
    assert.deepEqual(PREFERENCES.map((value) => value.field), ["preferredHeadTrainerId", "preferredGroomId", "preferredVeterinarianId"]);
    const html = detail();
    assert.doesNotMatch(html, /preferredTrainerId|WorkRider|Official assignment/);
    assert.match(html, /not official assignments/);
});
test("attachment list is a plain array with metadata and authenticated downloads, not a paginated envelope", async () => {
    api.defaults.adapter = async (config) => { assert.equal(config.url, "/api/registrations/record-1/attachments"); return reply(config, attachments); };
    const data = await files.listAttachments(draft.id);
    assert.ok(Array.isArray(data)); assert.equal(data.length, 2);
    const html = render(h(Attachments, { registrationId: draft.id, attachments: data, editable: false }));
    assert.match(html, /CERT-7/); assert.match(html, /2020-01-01/); assert.match(html, /2030-01-01/);
    assert.doesNotMatch(html, /href=".*attachments/);
});
test("attachment empty state and absence of invented delete/replace controls", () => {
    const html = render(h(Attachments, { registrationId: draft.id, attachments: [], editable: true }));
    assert.match(html, /No attachments uploaded yet/);
    assert.match(html, /cannot currently be removed or replaced/);
    assert.ok(globalThis.__intake.buttons.every((props) => !/delete|replace|remove/i.test(String(props.children))));
    assert.doesNotMatch(html, /IncidentPhoto/);
    assert.deepEqual(ATTACHMENT_TYPES, ["HorsePhoto", "Certificate", "MedicalDocument"]);
});
for (const type of ATTACHMENT_TYPES) {
    test(`${type} upload uses authenticated FormData, correct metadata and no JSON header`, async () => {
        const file = new File([type === "HorsePhoto" ? new Uint8Array([255, 216, 255]) : "%PDF-"], type === "HorsePhoto" ? "horse.jpg" : "document.pdf");
        const values = { type, file, certificateNumber: "CERT-123", issueDate: "2020-01-01", expiryDate: "2030-01-01" };
        assert.equal(files.validateAttachment(values), "");
        api.defaults.adapter = async (config) => {
            assert.equal(config.url, "/api/registrations/record-1/attachments"); assert.equal(config.method, "post");
            assert.equal(config.headers.get("Authorization"), "Bearer owner-access");
            assert.ok(config.data instanceof FormData);
            assert.doesNotMatch(config.headers.get("Content-Type") || "", /application\/json|boundary=/);
            assert.equal(config.data.get("type"), type); assert.equal(config.data.get("file").name, file.name);
            assert.deepEqual([...config.data.keys()], type === "Certificate" ? ["file", "type", "certificateNumber", "issueDate", "expiryDate"] : ["file", "type"]);
            if (type === "Certificate") assert.equal(config.data.get("certificateNumber"), "CERT-123");
            return reply(config, { id: "uploaded", type, fileName: file.name, length: file.size }, 201);
        };
        assert.equal((await files.uploadAttachment(draft.id, values)).type, type);
        assert.equal(storage.size, 1); // Only the existing authentication session.
        assert.ok([...storage.values()].every((value) => !String(value).includes(file.name)));
    });
}
test("upload validation respects confirmed extensions, size, count and certificate dates", () => {
    const good = { file: { name: "horse.JPG", size: 10485760 }, type: "HorsePhoto" };
    assert.equal(files.validateAttachment(good), "");
    for (const values of [{ ...good, type: "IncidentPhoto" }, { ...good, file: null }, { ...good, file: { name: "empty.png", size: 0 } },
        { ...good, file: { name: "big.png", size: 10485761 } }, { ...good, file: { name: "photo.pdf", size: 5 } },
        { ...good, file: { name: "photo.svg", size: 5 } }, { ...good, type: "Certificate", issueDate: "2020-02-30" },
        { ...good, type: "Certificate", issueDate: "2025-01-01", expiryDate: "2024-01-01" }]) assert.ok(files.validateAttachment(values));
    assert.ok(files.validateAttachment(good, 20));
    assert.equal(files.validateAttachment({ ...good, type: "Certificate" }), "");
});
test("download fetches a protected blob with the shared Bearer client", async () => {
    const blob = new Blob(["%PDF-"], { type: "application/pdf" });
    api.defaults.adapter = async (config) => {
        assert.equal(config.url, "/api/registrations/record-1/attachments/cert"); assert.equal(config.responseType, "blob");
        assert.equal(config.headers.get("Authorization"), "Bearer owner-access"); return reply(config, blob);
    };
    assert.equal(await files.fetchAttachment(draft.id, "cert"), blob);
});
test("submit completeness requires exactly the verified fields plus HorsePhoto and Certificate", () => {
    assert.deepEqual(submissionMissing(draft, attachments), []);
    assert.equal(submissionMissing({}, []).length, 13);
    assert.deepEqual(submissionMissing(draft, [attachments[0]]), ["Certificate attachment"]);
    assert.deepEqual(submissionMissing(draft, [attachments[1]]), ["Horse photo attachment"]);
    const optionalEmpty = { ...draft, registrationNumber: null, healthNotes: null, boardingEnd: null, preferredHeadTrainerId: null, preferredGroomId: null, preferredVeterinarianId: null };
    assert.deepEqual(submissionMissing(optionalEmpty, attachments), []);
});
test("incomplete saved draft cannot invoke submit from the rendered detail", async () => {
    let calls = 0; api.defaults.adapter = async (config) => { calls++; return reply(config, {}); };
    const html = detail({ ...draft, sire: null }, []);
    assert.equal(button("Submit registration").disabled, true);
    await button("Submit registration").onClick();
    assert.equal(calls, 0); assert.match(html, /Horse photo attachment/); assert.match(html, /Certificate attachment/);
});
for (const status of ["Draft", "RevisionRequired"]) {
    test(`${status} submission invokes the same POST, then fetches PendingReview instead of inventing Submitted`, async () => {
        const calls = [];
        api.defaults.adapter = async (config) => {
            calls.push([config.method, config.url]);
            return config.method === "post" ? reply(config, "", 204) : reply(config, { ...draft, status: "PendingReview" });
        };
        detail({ ...draft, status });
        const action = button(status === "Draft" ? "Submit registration" : "Resubmit registration");
        assert.equal(action.disabled, false); await action.onClick();
        assert.deepEqual(calls, [["post", "/api/registrations/record-1/submit"], ["get", "/api/registrations/record-1"]]);
        const record = await services.submitRegistration(draft.id);
        assert.equal(record.status, "PendingReview");
    });
}
test("cancel calls the verified endpoint, refreshes Cancelled and never deletes the record", async () => {
    const calls = [];
    api.defaults.adapter = async (config) => { calls.push([config.method, config.url]); return config.method === "post" ? reply(config, "", 204) : reply(config, { ...draft, status: "Cancelled" }); };
    const record = await services.cancelRegistration(draft.id);
    assert.deepEqual(calls, [["post", "/api/registrations/record-1/cancel"], ["get", "/api/registrations/record-1"]]);
    assert.equal(record.status, "Cancelled"); assert.equal(canEditRegistration(record.status), false);
});
test("draft validation accepts incomplete data but rejects invalid supplied dates and measurements", () => {
    assert.deepEqual(validateDraft(registrationForm(draft), "2026-10-01"), {});
    const errors = validateDraft({ ...registrationForm(draft), dateOfBirth: "2027-01-01", measurementDate: "2020-02-30", heightCm: "abc", weightKg: "2001", boardingEnd: "2025-01-01", gender: "Stallion" }, "2026-10-01");
    for (const field of ["dateOfBirth", "measurementDate", "heightCm", "weightKg", "boardingEnd", "gender"]) assert.ok(errors[field]);
});
for (const status of [400, 403, 404, 409]) {
    test(`${status} registration failure uses normalized errors without refreshing or logging out`, async () => {
        const previous = store.getSession(); let calls = 0;
        api.defaults.adapter = async (config) => { calls++; reject(config, status, { title: "Request rejected", detail: "The registration cannot be changed." }); };
        await assert.rejects(services.updateRegistration(draft.id, registrationForm(draft)), (error) => error.status === status && error.message === "The registration cannot be changed.");
        assert.equal(calls, 1); assert.equal(store.getSession(), previous);
    });
}
test("failed submit is not retried and never reports a fabricated success state", async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => { calls++; reject(config, 409, { detail: "Only drafts or revisions may be submitted." }); };
    await assert.rejects(services.submitRegistration(draft.id), { status: 409 });
    assert.equal(calls, 1);
});
test("detail upload refreshes attachment metadata before reporting success", async () => {
    const calls = [];
    api.defaults.adapter = async (config) => {
        calls.push([config.method, config.url]);
        return config.method === "post" ? reply(config, { id: "uploaded", type: "HorsePhoto" }, 201) : reply(config, attachments);
    };
    detail();
    assert.equal(await globalThis.__intake.attachmentPanel.onUpload({ type: "HorsePhoto", file: new File(["image"], "photo.jpg") }), true);
    assert.deepEqual(calls, [["post", "/api/registrations/record-1/attachments"], ["get", "/api/registrations/record-1/attachments"]]);
});
test("detail upload failure reports failure without retrying or synthesizing attachment metadata", async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => { calls++; reject(config, 400, { detail: "File extension must match its content." }); };
    detail();
    assert.equal(await globalThis.__intake.attachmentPanel.onUpload({ type: "HorsePhoto", file: new File(["bad content"], "photo.jpg") }), false);
    assert.equal(calls, 1);
});
test("double submit is locked while a mutation is pending", async () => {
    let finish; let posts = 0;
    api.defaults.adapter = async (config) => {
        if (config.method === "post") { posts++; await new Promise((resolve) => { finish = resolve; }); return reply(config, "", 204); }
        return reply(config, { ...draft, status: "PendingReview" });
    };
    detail();
    const action = button("Submit registration").onClick;
    const first = action();
    await action();
    // Let the Axios request interceptors reach the adapter.
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(posts, 1); finish(); await first;
});
test("read-only detail rejects even a directly invoked save handler", async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => { calls++; return reply(config, draft); };
    detail({ ...draft, status: "PendingReview" });
    await globalThis.__intake.forms[0].onSubmit({ preventDefault() {} });
    assert.equal(calls, 0);
});
test("download JSON errors in Blob responses remain normalized", async () => {
    api.defaults.adapter = async (config) => reject(config, 404, new Blob([JSON.stringify({ detail: "Stored attachment is unavailable." })], { type: "application/json" }));
    await assert.rejects(files.fetchAttachment(draft.id, "missing"), { status: 404, message: "Stored attachment is unavailable." });
});
test("server diagnostics and restricted-resource details are not rendered", () => {
    assert.doesNotMatch(render(h(ErrorView, { error: { status: 500, message: "Sensitive stack trace" } })), /Sensitive stack trace/);
    assert.doesNotMatch(render(h(ErrorView, { error: { status: 403, message: "Other owner's private record" } })), /Other owner/);
});
