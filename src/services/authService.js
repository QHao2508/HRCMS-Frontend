import api from "./api.js";
import { clearSession, getSession, setCurrentUser, setTokens } from "./sessionStore.js";

async function fetchCurrentUser(generation) {
    const { data } = await api.get("/api/auth/me");
    setCurrentUser(data, generation);
    return data;
}

export async function login(credentials) {
    clearSession();
    const { generation } = getSession();
    try {
        const { data } = await api.post("/api/auth/login", credentials, { skipAuth: true });
        setTokens(data, generation);
        return await fetchCurrentUser(generation);
    } catch (error) {
        clearSession(generation);
        throw error;
    }
}

let restorationPromise = null;

export function restoreSession() {
    if (restorationPromise) return restorationPromise;
    if (getSession().status !== "loading") return Promise.resolve();
    const { accessToken, generation } = getSession();
    // Share startup work across React StrictMode's repeated effect setup.
    restorationPromise = (async () => {
        try {
            if (accessToken) await fetchCurrentUser(generation);
            else clearSession(generation);
        } catch {
            clearSession(generation);
        }
    })();
    return restorationPromise;
}

export async function logout() {
    const { accessToken, generation } = getSession();
    try {
        if (accessToken) await api.post("/api/auth/logout");
    } finally {
        clearSession(generation);
    }
}

export async function register({ firstName, lastName, userName, email, phone, address, nationalId, password, confirmPassword }) {
    const response = await api.post("/api/auth/register", {
        firstName: firstName.trim(), lastName: lastName.trim(), userName: userName.trim(),
        email: email.trim(), phone: phone.trim(), address: address.trim(),
        nationalId: nationalId?.trim() || null, password, confirmPassword,
    }, { skipAuth: true });
    // Registration returns a profile, not tokens. Only login establishes a session.
    return response.data;
}

export async function verifyEmail({ email, code }) {
    const { data } = await api.post("/api/auth/verify-email", { email: email.trim(), code: code.trim() }, { skipAuth: true });
    if (data?.verified !== true) {
        throw new Error("We could not verify this code. Check your email and code, or request a new code.");
    }
    return data;
}

export async function resendVerification({ email }) {
    const { data } = await api.post("/api/auth/resend-verification", { email: email.trim() }, { skipAuth: true });
    return data;
}

export async function forgotPassword({ email }) {
    const { data } = await api.post("/api/auth/forgot-password", { email: email.trim() }, { skipAuth: true });
    return data;
}

async function submitPassword(path, { email, code, password, confirmPassword }, failureMessage) {
    const { generation } = getSession();
    const { data } = await api.post(path, {
        email: email.trim(), code: code.trim(), password, confirmPassword,
    }, { skipAuth: true });
    if (data?.changed !== true) throw new Error(failureMessage);
    // Password changes revoke tokens on the backend; require a fresh login locally too.
    clearSession(generation);
    return data;
}

export function resetPassword(request) {
    return submitPassword("/api/auth/reset-password", request,
        "We could not reset your password. Check your email and code, or request a new reset code.");
}

export function acceptInvitation(request) {
    return submitPassword("/api/auth/accept-invitation", request,
        "We could not accept this invitation. Check your email and code, or contact club management.");
}
