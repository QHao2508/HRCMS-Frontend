import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import axios from "axios";
import { AUTH_POLICY, getNavigationEmail, validateEmail, validatePasswordSetup,
    validateRegistration, validateVerification } from "../src/services/authValidation.js";
import { startAuthCooldown } from "../src/context/useAuthCooldown.js";

const storage = new Map();
const cooldownStorage = new Map();
function mockStorage(map) {
    return { getItem: (key) => map.get(key) ?? null,
        setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) };
}
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: mockStorage(storage) });
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: mockStorage(cooldownStorage) });
const { default: api } = await import("../src/services/api.js");
const auth = await import("../src/services/authService.js");
const store = await import("../src/services/sessionStore.js");

const registration = {
    firstName: "Test", lastName: "Owner", userName: "test.owner", email: "owner@example.test",
    phone: "0900000000", address: "Test address", nationalId: "",
    password: "TestPassword123!", confirmPassword: "TestPassword123!",
};
const passwordRequest = { email: registration.email, code: "123456",
    password: registration.password, confirmPassword: registration.confirmPassword };
const owner = { id: "owner-id", email: registration.email, role: "HorseOwner", active: true, emailVerified: false };
const reply = (config, data, status = 200) => ({ config, data, status, statusText: "", headers: {} });

function seedSession() {
    store.setTokens({ accessToken: "existing-access", refreshToken: "existing-refresh", expiresIn: 3600 }, store.getSession().generation);
    store.setCurrentUser({ ...owner, emailVerified: true }, store.getSession().generation);
}

function expectRequest(path, body, response, status = 200) {
    let calls = 0;
    api.defaults.adapter = async (config) => {
        calls++;
        assert.equal(config.method, "post");
        assert.equal(config.url, path);
        assert.deepEqual(JSON.parse(config.data), body);
        assert.equal(config.headers.get("Authorization"), undefined);
        assert.equal(config.skipAuth, true);
        return reply(config, response, status);
    };
    return () => assert.equal(calls, 1);
}

beforeEach(() => {
    store.clearSession();
    storage.clear();
    cooldownStorage.clear();
    api.defaults.adapter = async () => { throw new Error("Unexpected API request; tests never use the network."); };
});

test("registration sends only owner contract fields and never authenticates or persists sensitive data", async () => {
    const verify = expectRequest("/api/auth/register", { ...registration, nationalId: null }, owner, 201);
    const result = await auth.register({ ...registration, role: "ClubManager", preferredTrainerId: "not-allowed" });
    verify();
    assert.deepEqual(result, owner);
    assert.equal(store.getSession().status, "anonymous");
    assert.equal(store.getSession().user, null);
    assert.equal(storage.size, 0);
    assert.equal(cooldownStorage.size, 0);
});

test("registration trims identity fields, preserves passwords and keeps national ID a string", async () => {
    const request = { ...registration, firstName: " Test ", email: " owner@example.test ", nationalId: " 001234567890 ",
        password: " TestPassword123! ", confirmPassword: " TestPassword123! " };
    const verify = expectRequest("/api/auth/register", { ...request, firstName: "Test", email: registration.email, nationalId: "001234567890" }, owner, 201);
    await auth.register(request);
    verify();
});

test("registration preserves an existing session instead of replacing it with the returned profile", async () => {
    seedSession();
    const previous = store.getSession();
    const verify = expectRequest("/api/auth/register", { ...registration, nationalId: null }, owner, 201);
    await auth.register(registration);
    verify();
    assert.equal(store.getSession(), previous);
});

test("registration displays normalized backend validation and account conflict errors", async () => {
    for (const status of [400, 409]) {
        api.defaults.adapter = async (config) => {
            throw new axios.AxiosError("Request failed", "ERR_BAD_REQUEST", config, null,
                reply(config, { detail: "Please check your registration details.", title: "validation_error", traceId: "test-trace" }, status));
        };
        await assert.rejects(auth.register(registration), (error) => {
            assert.equal(error.serverMessage, "Please check your registration details.");
            assert.ok(!error.message.includes("Please check"));
            assert.equal(error.status, status);
            assert.equal(error.traceId, "test-trace");
            return true;
        });
    }
    assert.equal(store.getSession().status, "anonymous");
});

test("verification requires verified=true and never authenticates", async () => {
    const verify = expectRequest("/api/auth/verify-email", { email: registration.email, code: "123456" }, { verified: true });
    assert.deepEqual(await auth.verifyEmail({ email: ` ${registration.email} `, code: " 123456 " }), { verified: true });
    verify();
    assert.equal(store.getSession().status, "anonymous");
    assert.equal(storage.size, 0);
});

test("verification HTTP 200 with verified=false is a business failure", async () => {
    const verify = expectRequest("/api/auth/verify-email", { email: registration.email, code: "123456" }, { verified: false });
    await assert.rejects(auth.verifyEmail({ email: registration.email, code: "123456" }), /Mã OTP chưa được xác thực/);
    verify();
    assert.equal(store.getSession().status, "anonymous");
});

test("resend uses the generic message and sends email only", async () => {
    const response = { message: "If eligible, a code will be emailed." };
    const verify = expectRequest("/api/auth/resend-verification", { email: registration.email }, response);
    assert.deepEqual(await auth.resendVerification({ email: ` ${registration.email} `, code: "must-not-be-sent" }), response);
    verify();
    assert.equal(storage.size, 0);
});

test("forgot-password returns the same generic result for any email", async () => {
    const response = { message: "If eligible, a reset code will be emailed." };
    for (const email of [registration.email, "unknown@example.test"]) {
        const verify = expectRequest("/api/auth/forgot-password", { email }, response);
        assert.deepEqual(await auth.forgotPassword({ email }), response);
        verify();
    }
    assert.equal(store.getSession().status, "anonymous");
});

for (const [method, path, errorText] of [
    ["resetPassword", "/api/auth/reset-password", /Chưa thể đặt lại mật khẩu/],
    ["acceptInvitation", "/api/auth/accept-invitation", /Chưa thể kích hoạt tài khoản/],
]) {
    test(`${method}: changed=true requires a fresh login and sends only the ResetRequest contract`, async () => {
        seedSession();
        const verify = expectRequest(path, passwordRequest, { changed: true });
        assert.deepEqual(await auth[method]({ ...passwordRequest, role: "Trainer", userName: "not-sent" }), { changed: true });
        verify();
        assert.equal(store.getSession().status, "anonymous");
        assert.equal(store.getSession().user, null);
        assert.equal(storage.size, 0);
        assert.equal(cooldownStorage.size, 0);
    });

    test(`${method}: HTTP 200 changed=false is a failure and preserves existing session state`, async () => {
        seedSession();
        const previous = store.getSession();
        const verify = expectRequest(path, passwordRequest, { changed: false });
        await assert.rejects(auth[method](passwordRequest), errorText);
        verify();
        assert.equal(store.getSession(), previous);
    });
}

test("missing or string business flags cannot be mistaken for successful verification/password setup", async () => {
    for (const [method, payload] of [["verifyEmail", { email: registration.email, code: "123456" }], ["resetPassword", passwordRequest], ["acceptInvitation", passwordRequest]]) {
        for (const body of [null, {}, { verified: "true", changed: "true" }]) {
            api.defaults.adapter = async (config) => reply(config, body);
            await assert.rejects(auth[method](payload));
        }
    }
    assert.equal(store.getSession().status, "anonymous");
});

test("all lifecycle methods reuse normalized network errors without refresh or session mutation", async () => {
    seedSession();
    const previous = store.getSession();
    for (const [method, payload] of [["register", registration], ["verifyEmail", passwordRequest], ["resendVerification", passwordRequest],
        ["forgotPassword", passwordRequest], ["resetPassword", passwordRequest], ["acceptInvitation", passwordRequest]]) {
        let calls = 0;
        api.defaults.adapter = async (config) => { calls++; throw new axios.AxiosError("offline", "ERR_NETWORK", config); };
        await assert.rejects(auth[method](payload), /Không kết nối được máy chủ/);
        assert.equal(calls, 1);
        assert.equal(store.getSession(), previous);
    }
});

test("public lifecycle 401 and 429 errors never refresh or imply an account exists", async () => {
    seedSession();
    const previous = store.getSession();
    for (const status of [401, 429]) {
        let calls = 0;
        api.defaults.adapter = async (config) => {
            calls++;
            throw new axios.AxiosError("Request failed", "ERR_BAD_REQUEST", config, null, reply(config, "", status));
        };
        await assert.rejects(auth.resendVerification({ email: registration.email }), (error) => error.status === status);
        assert.equal(calls, 1);
        assert.equal(store.getSession(), previous);
    }
});

test("registration validation covers required fields, email, username and length bounds", () => {
    assert.deepEqual(validateRegistration(registration), {});
    for (const field of ["firstName", "lastName", "userName", "email", "phone", "address", "password", "confirmPassword"]) {
        assert.ok(validateRegistration({ ...registration, [field]: "" })[field], field);
    }
    for (const [field, value] of [["firstName", "A".repeat(101)], ["lastName", "A".repeat(101)],
        ["userName", "ab"], ["userName", "a".repeat(81)], ["phone", "1".repeat(31)],
        ["address", "a".repeat(501)], ["email", "not-an-email"], ["email", "a".repeat(250) + "@example.test"]]) {
        assert.ok(validateRegistration({ ...registration, [field]: value })[field], field);
    }
});

test("national ID is optional under checked-in policy and validates 12 ASCII digits when provided", () => {
    assert.equal(AUTH_POLICY.requireNationalId, false);
    assert.deepEqual(validateRegistration({ ...registration, nationalId: "" }), {});
    assert.deepEqual(validateRegistration({ ...registration, nationalId: "001234567890" }), {});
    for (const nationalId of ["123", "1234567890123", "12345678901A", "１２３４５６７８９０１２"]) {
        assert.ok(validateRegistration({ ...registration, nationalId }).nationalId);
    }
});

test("password forms enforce configured length, uppercase, lowercase, digit and confirmation", () => {
    for (const password of ["Short1Aa", "a".repeat(12) + "1", "A".repeat(12) + "1", "NoDigitsHereYet", "Aa1" + "a".repeat(126)]) {
        assert.ok(validatePasswordSetup({ ...passwordRequest, password, confirmPassword: password }).password);
    }
    assert.ok(validatePasswordSetup({ ...passwordRequest, confirmPassword: "Different123!" }).confirmPassword);
    assert.deepEqual(validatePasswordSetup(passwordRequest), {});
    const boundary = "Aa1" + "a".repeat(125);
    assert.deepEqual(validatePasswordSetup({ ...passwordRequest, password: boundary, confirmPassword: boundary }), {});
});

test("verification and password setup require six-digit OTPs", () => {
    assert.deepEqual(validateVerification({ email: registration.email, code: "123456" }), {});
    for (const code of ["", "12345", "1234567", "ABCDEF"]) assert.ok(validateVerification({ email: registration.email, code }).code);
    assert.deepEqual(validatePasswordSetup(passwordRequest), {});
    assert.ok(validatePasswordSetup({ ...passwordRequest, code: " " }).code);
    for (const code of ["12345", "1234567", "ABCDEF", "A".repeat(64), "１２３４５６"]) assert.ok(validatePasswordSetup({ ...passwordRequest, code }).code);
    assert.ok(validateEmail({ email: "invalid" }).email);
});

test("direct navigation and missing/malformed state safely start with an editable empty email", () => {
    for (const state of [undefined, null, {}, { email: {} }, { email: "a".repeat(255) }]) assert.equal(getNavigationEmail(state), "");
    assert.equal(getNavigationEmail({ email: registration.email, code: "not-used" }), registration.email);
});

test("cooldowns persist only timestamps, independently by purpose, with a 60-second baseline", () => {
    const before = Date.now();
    const verification = startAuthCooldown("verification");
    startAuthCooldown("passwordReset");
    assert.ok(verification >= before + 60000 && verification <= Date.now() + 60000);
    assert.equal(cooldownStorage.size, 2);
    for (const value of cooldownStorage.values()) assert.match(value, /^\d+$/);
    assert.equal(storage.size, 0);
});
