import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Bell } from 'lucide-react';
import api from '../services/api.js';
import { getRealtimeRevision, notifyRealtime, subscribeRealtime } from '../services/realtimeEvents.js';
import { MSG, msg } from '../messages/index.js';
import { notificationText } from '../messages/notifications.js';

export default function NotificationBell() {
    const revision = useSyncExternalStore(subscribeRealtime, getRealtimeRevision, getRealtimeRevision);
    const [resource, setResource] = useState({ items: [], total: 0 });
    const [error, setError] = useState(false);
    const load = useCallback(() => api.get('/api/notifications', { params: { unread: true, page: 1, pageSize: 10 } }).then(r => r.data), []);
    useEffect(() => {
        let active = true;
        load().then(data => { if (active) { setResource(data); setError(false); } }, () => { if (active) setError(true); });
        return () => { active = false; };
    }, [load, revision]);
    async function read(id) {
        try { await api.post(`/api/notifications/${encodeURIComponent(id)}/read`); notifyRealtime(); }
        catch { setError(true); }
    }
    return <details className="position-relative">
        <summary className="btn btn-outline-secondary" aria-label={msg(MSG.THONG_BAO_CHUA_DOC)}>
            <Bell size={18} aria-hidden="true" /> <span>{resource.total}</span>
        </summary>
        <div className="surface-card position-absolute end-0 shadow" style={{ width: 'min(340px, 85vw)', zIndex: 1050 }}>
            <h2 className="h6">{msg(MSG.THONG_BAO_CHUA_DOC)}</h2>
            {error && <p role="alert">{msg(MSG.REALTIME_NOTIFICATION_LOAD_FAILED)}</p>}
            {!resource.items.length && !error && <p>{msg(MSG.REALTIME_NO_UNREAD_NOTIFICATIONS)}</p>}
            <ul className="list-unstyled mb-0">{resource.items.map(item => <li key={item.id} className="mb-3">
                <p className="mb-1">{notificationText(item)}</p>
                <button className="btn btn-sm btn-outline-primary" onClick={() => void read(item.id)}>{msg(MSG.REALTIME_MARK_READ)}</button>
            </li>)}</ul>
        </div>
    </details>;
}
