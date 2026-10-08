const listeners = new Set();
let revision = 0;
let timer;
const seen = new Map();

export const getRealtimeRevision = () => revision;
export function subscribeRealtime(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
export function notifyRealtime(message) {
    if (message?.eventId) {
        if (seen.has(message.eventId)) return;
        seen.set(message.eventId, true);
        if (seen.size > 500) seen.delete(seen.keys().next().value);
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
        revision++;
        listeners.forEach(listener => listener());
    }, 250);
}
