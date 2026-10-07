const storageKey = "hrcms.session";
const listeners = new Set();

const isToken = (value) => typeof value === "string" && value.trim().length > 0;

function readStoredTokens() {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (isToken(saved?.accessToken) && isToken(saved?.refreshToken)
            && Number.isFinite(saved?.expiresAt) && saved.expiresAt > 0) {
            return {
                accessToken: saved.accessToken,
                refreshToken: saved.refreshToken,
                expiresAt: saved.expiresAt,
            };
        }
    } catch {
        // Corrupt or unavailable storage must not prevent the app from opening.
    }
    return { accessToken: null, refreshToken: null, expiresAt: null };
}

let session = {
    ...readStoredTokens(),
    user: null, // A persisted profile is never proof of authentication.
    status: "loading",
    generation: 0,
};

export const getSession = () => session;

export function subscribeSession(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function publish(next) {
    session = next;
    try {
        if (session.accessToken) {
            const { accessToken, refreshToken, expiresAt, user } = session;
            localStorage.setItem(storageKey, JSON.stringify({ accessToken, refreshToken, expiresAt, user }));
        } else {
            localStorage.removeItem(storageKey);
        }
        // Discard the old scaffold's unvalidated token/profile storage.
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
    } catch {
        // Continue with an in-memory session when browser storage is unavailable.
    }
    listeners.forEach((listener) => listener());
}

export function assertCurrentSession(generation) {
    if (session.generation !== generation) {
        throw new Error("Your session changed. Please sign in again.");
    }
}

export function setTokens(data, generation) {
    assertCurrentSession(generation);
    const seconds = Number(data?.expiresIn);
    const expiresAt = Date.now() + seconds * 1000;
    if (!isToken(data?.accessToken) || !isToken(data?.refreshToken)
        || !Number.isFinite(seconds) || seconds <= 0 || !Number.isFinite(expiresAt)) {
        throw new Error("The server returned an invalid authentication response.");
    }
    publish({ ...session, accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt });
}

export function setCurrentUser(user, generation) {
    assertCurrentSession(generation);
    if (!session.accessToken || !user?.id || !user.role || user.active !== true || user.emailVerified !== true) {
        throw new Error("The server did not return an active, verified user.");
    }
    publish({ ...session, user, status: "authenticated" });
}

export function clearSession(generation = session.generation) {
    if (generation !== session.generation) return;
    publish({
        accessToken: null, refreshToken: null, expiresAt: null, user: null,
        status: "anonymous", generation: session.generation + 1,
    });
}
