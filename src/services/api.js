import axios from "axios";
import { normalizeApiError } from "./apiError.js";
import { assertCurrentSession, clearSession, getSession, setTokens } from "./sessionStore.js";

const api = axios.create({
    baseURL: import.meta.env?.VITE_API_BASE_URL,
    timeout: 15000,
});

const publicAuthPaths = new Set([
    "/api/auth/login", "/api/auth/refresh", "/api/auth/register",
    "/api/auth/verify-email", "/api/auth/resend-verification",
    "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/accept-invitation",
]);

api.interceptors.request.use((config) => {
    const path = new URL(config.url, "http://api.local").pathname.replace(/\/$/, "");
    config.skipAuth = config.skipAuth || publicAuthPaths.has(path);
    if (!config.skipAuth) {
        const session = getSession();
        if (config._sessionGeneration !== undefined) assertCurrentSession(config._sessionGeneration);
        config._sessionGeneration = session.generation;
        config._accessToken = session.accessToken;
        if (session.accessToken) config.headers.set("Authorization", `Bearer ${session.accessToken}`);
        else config.headers.delete("Authorization");
    } else {
        config.headers.delete("Authorization");
    }
    // Axios serializes objects as JSON; the browser supplies FormData boundaries.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        config.headers.delete("Content-Type");
    }
    return config;
});

let refreshPromise = null;
let refreshGeneration = null;

export function refreshSession() {
    const { refreshToken, generation } = getSession();
    if (refreshPromise && refreshGeneration === generation) return refreshPromise;
    if (!refreshToken) {
        clearSession(generation);
        return Promise.reject(new Error("Please sign in again."));
    }
    refreshGeneration = generation;
    const pending = (async () => {
        try {
            const { data } = await api.post("/api/auth/refresh", { refreshToken }, { skipAuth: true });
            setTokens(data, generation);
            return getSession().accessToken;
        } catch (error) {
            clearSession(generation);
            throw error;
        } finally {
            if (refreshPromise === pending) refreshPromise = null;
        }
    })();
    refreshPromise = pending;
    return pending;
}

api.interceptors.response.use(
    (response) => {
        if (response.status === 204 || response.data === "") response.data = null;
        return response;
    },
    async (error) => {
        const config = error.config;
        if (error.response?.status === 401 && config && !config.skipAuth && config._accessToken) {
            const session = getSession();
            if (config._sessionGeneration === session.generation) {
                if (config._authRetried) {
                    clearSession(session.generation);
                } else {
                    config._authRetried = true;
                    // A late 401 may belong to the token that another request already refreshed.
                    if (config._accessToken === session.accessToken) await refreshSession();
                    // Review decisions must never be silently replayed, even after refresh.
                    if (config.retryOnUnauthorized !== false) return api.request(config);
                }
            }
        }
        throw await normalizeApiError(error);
    },
);

export default api;
