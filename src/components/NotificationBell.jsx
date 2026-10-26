import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { MSG, msg } from '../messages/index.js';
import { notificationText, notificationTime } from '../messages/notifications.js';
import { useNotifications } from '../context/useNotifications.js';
import '../style/notifications.css';

export default function NotificationBell() {
    const { state, feed } = useNotifications();
    const details = useRef(null), trigger = useRef(null);
    const [open, setOpen] = useState(false);
    const location = useLocation();
    useLayoutEffect(() => {
        if (!open) return;
        function position() {
            const anchor = details.current;
            if (!anchor) return;
            const bottom = anchor.closest('header')?.getBoundingClientRect().bottom ?? anchor.getBoundingClientRect().bottom;
            anchor.style.setProperty('--notification-panel-top', `${bottom - anchor.getBoundingClientRect().top + 8}px`);
            anchor.style.setProperty('--notification-panel-height', `${Math.max(0, window.innerHeight - bottom - 16)}px`);
        }
        position();
        window.addEventListener('resize', position);
        window.addEventListener('scroll', position, { passive: true });
        return () => { window.removeEventListener('resize', position); window.removeEventListener('scroll', position); };
    }, [open]);
    useEffect(() => { if (details.current) details.current.open = false; }, [location.key]);
    useEffect(() => {
        function outside(event) { if (details.current && !details.current.contains(event.target)) details.current.open = false; }
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, []);
    function close() { details.current.open = false; trigger.current.focus(); }
    return <details ref={details} className="notification-bell" onToggle={event => setOpen(event.currentTarget.open)} onKeyDown={event => {
        if (event.key === 'Escape' && details.current.open) { event.preventDefault(); close(); }
    }}>
        <summary ref={trigger} className="btn btn-outline-secondary notification-trigger" aria-label={msg(MSG.THONG_BAO_CHUA_DOC)}>
            <Bell size={18} aria-hidden="true"/><span aria-live="polite">{state.unreadTotal ?? '…'}</span>
        </summary>
        {open && <NotificationPanel state={state} feed={feed} onClose={close}/>}
    </details>;
}

export function NotificationPanel({ state, feed, onClose }) {
    const titleId = useId();
    const panel = useRef(null);
    async function act(operation) {
        await operation();
        // A removed read row must not leave keyboard focus on the document body.
        if (panel.current && document.activeElement === document.body) panel.current.querySelector('button[aria-pressed="true"]')?.focus({ preventScroll: true });
    }
    return <section ref={panel} className="notification-panel surface-card shadow" aria-labelledby={titleId}>
            <div className="notification-heading"><div><h2 id={titleId}>{msg(MSG.NOTIF_TITLE)}</h2><p aria-live="polite">{state.unreadTotal == null ? msg(MSG.CHUA_XAC_DINH) : msg(MSG.NOTIF_UNREAD_COUNT, { count: state.unreadTotal })}</p></div><button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>{msg(MSG.UI_CLOSE)}</button></div>
            <div className="notification-toolbar"><div className="notification-filters" role="group" aria-label={msg(MSG.NOTIF_TITLE)}>
                <button type="button" className={'btn btn-sm ' + (state.view === 'unread' ? 'btn-primary' : 'btn-outline-primary')} aria-pressed={state.view === 'unread'} onClick={() => void feed.changeView('unread')}>{msg(MSG.NOTIF_UNREAD)}</button>
                <button type="button" className={'btn btn-sm ' + (state.view === 'all' ? 'btn-primary' : 'btn-outline-primary')} aria-pressed={state.view === 'all'} onClick={() => void feed.changeView('all')}>{msg(MSG.TAT_CA)}</button>
            </div><button type="button" className="btn btn-sm btn-outline-secondary" disabled={state.loading} onClick={() => void feed.refresh()}>{msg(MSG.TAI_LAI)}</button></div>
            <div className="notification-scroll" aria-busy={state.loading}>
                {state.loading && <p role="status" className="notification-state">{msg(MSG.NOTIF_LOADING)}</p>}
                {state.error && <p role="alert" className="notification-state">{msg(MSG.REALTIME_NOTIFICATION_LOAD_FAILED)}</p>}
                {state.notice && <p role="status" className="notification-notice">{msg(MSG.NOTIF_UPDATED)}</p>}
                {!state.loading && !state.error && !state.items.length && <p className="notification-state">{msg(state.view === 'unread' ? MSG.REALTIME_NO_UNREAD_NOTIFICATIONS : MSG.NOTIF_EMPTY_ALL)}</p>}
                <ul className="notification-list">{state.items.map(item => {
                    const pending = state.pendingIds.includes(item.id), blocked = state.blockedIds.includes(item.id);
                    const time = notificationTime(item.createdAt);
                    return <li key={item.id} className={'notification-item ' + (item.read === false ? 'notification-unread' : 'notification-read')}>
                        <div className="notification-meta"><span className="notification-status">{msg(item.read === true ? MSG.NOTIF_READ : item.read === false ? MSG.NOTIF_UNREAD : MSG.CHUA_XAC_DINH)}</span>{time ? <time dateTime={item.createdAt} title={msg(MSG.NOTIF_TIME_ZONE)}>{time}</time> : <span>{msg(MSG.NOTIF_TIME_UNKNOWN)}</span>}</div>
                        <p className="notification-message">{notificationText(item)}</p>
                        {Object.hasOwn(state.errors, item.id) && <p role="alert" className="notification-item-error">{msg(MSG.NOTIF_MARK_FAILED)}</p>}
                        {item.read === false && <button type="button" className="btn btn-sm btn-outline-primary" disabled={pending || blocked} onClick={() => void act(() => feed.read(item.id))}>{msg(pending ? MSG.DANG_XU_LY : MSG.REALTIME_MARK_READ)}</button>}
                    </li>;
                })}</ul>
            </div>
            {!state.error && state.total > 10 && <nav className="notification-pagination" aria-label={msg(MSG.NOTIF_PAGINATION)}><button type="button" className="btn btn-sm btn-outline-secondary" disabled={state.loading || state.page <= 1} onClick={() => void act(() => feed.goToPage(state.page - 1))}>{msg(MSG.TRUOC)}</button><span>{msg(MSG.NOTIF_PAGE, { page: state.page, pages: Math.ceil(state.total / 10) })}</span><button type="button" className="btn btn-sm btn-outline-secondary" disabled={state.loading || state.page * 10 >= state.total} onClick={() => void act(() => feed.goToPage(state.page + 1))}>{msg(MSG.SAU)}</button></nav>}
        </section>;
}
