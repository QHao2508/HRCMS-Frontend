// Per-mounted-user feed. No cached notification data is shared between sessions.
export function createNotificationFeed(client, onRead = () => {}) {
    const initial = () => ({ view: 'unread', page: 1, items: [], total: 0, unreadTotal: null,
        loading: true, error: false, pendingIds: [], errors: {}, blockedIds: [], notice: false });
    let state = initial();
    let alive = false, sequence = 0, lifetime = 0;
    const listeners = new Set(), pending = new Set(), blocked = new Set();
    function publish(update) { state = { ...state, ...update }; listeners.forEach(listener => listener()); }
    async function refresh() {
        if (!alive) return false;
        const request = ++sequence, view = state.view, page = state.page;
        publish({ loading: true, error: false, items: [] });
        try {
            const list = client.get('/api/notifications', { params: { page, pageSize: 10, ...(view === 'unread' && { unread: true }) } });
            const count = view === 'unread' ? list : client.get('/api/notifications', { params: { unread: true, page: 1, pageSize: 1 } });
            const [response, unread] = await Promise.all([list, count]);
            if (!alive || request !== sequence) return false;
            const data = response.data;
            const lastPage = Math.max(1, Math.ceil(data.total / 10));
            if (page > lastPage) { publish({ page: lastPage }); return refresh(); }
            // A fresh response resolves uncertain outcomes only for records it actually contains.
            const errors = { ...state.errors };
            for (const item of data.items) {
                if (typeof item.read === 'boolean' && (blocked.has(item.id) || item.read)) { blocked.delete(item.id); delete errors[item.id]; }
            }
            publish({ items: data.items, total: data.total, unreadTotal: unread.data.total,
                loading: false, error: false, errors, blockedIds: [...blocked] });
            return true;
        } catch {
            if (alive && request === sequence) publish({ loading: false, error: true, unreadTotal: null });
            return false;
        }
    }
    async function read(id) {
        if (!alive || pending.has(id) || blocked.has(id) || !state.items.some(item => item.id === id && item.read === false)) return false;
        const operation = lifetime;
        pending.add(id);
        const errors = { ...state.errors }; delete errors[id];
        publish({ pendingIds: [...pending], errors, notice: false });
        try {
            await client.post(`/api/notifications/${encodeURIComponent(id)}/read`);
            if (!alive || operation !== lifetime) return false;
            await refresh();
            if (!alive || operation !== lifetime) return false;
            publish({ notice: true }); onRead();
            return true;
        } catch (error) {
            if (alive && operation === lifetime) {
                const status = error.response?.status ?? error.status;
                if (!status || status >= 500) blocked.add(id);
                publish({ errors: { ...state.errors, [id]: true }, blockedIds: [...blocked] });
            }
            return false;
        } finally {
            if (operation === lifetime) { pending.delete(id); if (alive) publish({ pendingIds: [...pending] }); }
        }
    }
    return {
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        getSnapshot: () => state,
        start() { alive = true; lifetime++; return refresh(); },
        stop() { alive = false; lifetime++; sequence++; pending.clear(); blocked.clear(); publish(initial()); },
        refresh, read,
        changeView(view) {
            if (!['unread', 'all'].includes(view) || view === state.view) return;
            publish({ view, page: 1, total: 0, notice: false }); return refresh();
        },
        goToPage(page) {
            if (!Number.isInteger(page) || page < 1 || page > Math.max(1, Math.ceil(state.total / 10)) || page === state.page) return;
            publish({ page, notice: false }); return refresh();
        },
    };
}
