import { useEffect, useState } from "react";
import { AUTH_POLICY } from "../services/authValidation.js";

function readDeadline(purpose) {
    try {
        const deadline = Number(sessionStorage.getItem(`hrcms.auth.${purpose}.retryAfter`));
        // Reject corrupted or stale future values instead of disabling the UI indefinitely.
        if (Number.isFinite(deadline) && deadline > Date.now()
            && deadline <= Date.now() + AUTH_POLICY.resendSeconds * 1000) return deadline;
    } catch { /* Storage is optional for the UI cooldown. */ }
    return 0;
}

export function startAuthCooldown(purpose) {
    const deadline = Date.now() + AUTH_POLICY.resendSeconds * 1000;
    try { sessionStorage.setItem(`hrcms.auth.${purpose}.retryAfter`, String(deadline)); }
    catch { /* Keep the cooldown in component memory when storage is unavailable. */ }
    return deadline;
}

export function useAuthCooldown(purpose) {
    const [deadline, setDeadline] = useState(() => readDeadline(purpose));
    const [now, setNow] = useState(Date.now);
    const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));

    useEffect(() => {
        if (deadline <= Date.now()) return;
        const timer = setInterval(() => {
            const time = Date.now();
            setNow(time);
            if (time >= deadline) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [deadline]);

    function start() {
        setNow(Date.now());
        setDeadline(startAuthCooldown(purpose));
    }

    return { seconds, start };
}
