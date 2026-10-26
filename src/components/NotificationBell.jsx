import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../services/api.js';
import { getRealtimeRevision, notifyRealtime, subscribeRealtime } from '../services/realtimeEvents.js';
import { MSG, msg } from '../messages/index.js';
import { relativeTime } from '../services/relativeTime.js';
import { notificationSubject, notificationTarget, notificationText } from '../messages/notifications.js';

const PAGE_SIZE = 10;
/**
 * Chuông thông báo: danh sách gần nhất, mục mới có chấm màu. Bấm vào một thông báo sẽ mở màn hình liên quan
 * và tự ghi nhận đã xem, nên không cần nút thao tác riêng.
 */
export default function NotificationBell() {
    const revision = useSyncExternalStore(subscribeRealtime, getRealtimeRevision, getRealtimeRevision);
    const [state, setState] = useState({ items: [], unread: 0 });
    const [error, setError] = useState(false);
    const panel = useRef(null);
    const navigate = useNavigate();
    const load = useCallback(() => Promise.all([
        api.get('/api/notifications', { params: { page: 1, pageSize: PAGE_SIZE } }),
        api.get('/api/notifications', { params: { unread: true, page: 1, pageSize: 1 } }),
    ]).then(([list, unread]) => ({ items: list.data.items, unread: unread.data.total })), []);
    useEffect(() => {
        let active = true;
        load().then(data => { if (active) { setState(data); setError(false); } }, () => { if (active) setError(true); });
        return () => { active = false; };
    }, [load, revision]);
    useEffect(() => {
        const close = event => { if (panel.current?.open && !panel.current.contains(event.target)) panel.current.open = false; };
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, []);
    async function open(item) {
        if (panel.current) panel.current.open = false;
        if (!item.read) {
            try { await api.post(`/api/notifications/${encodeURIComponent(item.id)}/read`); notifyRealtime(); }
            catch { setError(true); }
        }
        const target = notificationTarget(item);
        if (target) navigate(target);
    }
    return <details ref={panel} className="notification-bell">
        <summary className="notification-trigger" aria-label={msg(MSG.NOTIFICATION_BELL_LABEL, { count: state.unread })}>
            <Bell size={20} aria-hidden="true" />
            {state.unread > 0 && <span className="notification-count" aria-hidden="true">{state.unread > 99 ? '99+' : state.unread}</span>}
        </summary>
        <section className="notification-panel" aria-label={msg(MSG.NOTIFICATION_TITLE)}>
            <header className="notification-panel-header"><h2>{msg(MSG.NOTIFICATION_TITLE)}</h2>{state.unread > 0 && <span>{msg(MSG.NOTIFICATION_NEW_COUNT, { count: state.unread })}</span>}</header>
            {error && <p className="notification-state" role="alert">{msg(MSG.NOTIFICATION_LOAD_FAILED)}</p>}
            {!state.items.length && !error && <p className="notification-state">{msg(MSG.NOTIFICATION_EMPTY)}</p>}
            <ul className="notification-list">{state.items.map(item => {
                const subject = notificationSubject(item);
                return <li key={item.id}>
                    <button type="button" className={'notification-item' + (item.read ? '' : ' is-new')} onClick={() => void open(item)}>
                        <span className="notification-dot" aria-hidden="true" />
                        <span className="notification-body">
                            {!item.read && <span className="visually-hidden">{msg(MSG.NOTIFICATION_NEW_MARK)}</span>}
                            {subject && <strong className="notification-subject">{subject}</strong>}
                            <span className="notification-text">{notificationText(item)}</span>
                            <time className="notification-time" dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time>
                        </span>
                    </button>
                </li>;
            })}</ul>
        </section>
    </details>;
}
