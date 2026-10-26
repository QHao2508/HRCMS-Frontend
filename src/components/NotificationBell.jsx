import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { MSG, msg } from '../messages/index.js';
import { notificationSubject, notificationTarget, notificationText, notificationTime } from '../messages/notifications.js';
import { relativeTime } from '../services/relativeTime.js';
import { useNotifications } from '../context/useNotifications.js';
import '../style/notifications.css';

const PAGE_SIZE = 10;

/**
 * Chuông thông báo. Bấm vào một thông báo sẽ ghi nhận đã xem (chờ server xác nhận) rồi mở màn hình liên quan,
 * nên không có nút hay chữ "đã đọc" riêng; thông báo mới chỉ được đánh dấu bằng chấm màu.
 */
export default function NotificationBell() {
    const { state, feed } = useNotifications();
    const details = useRef(null), trigger = useRef(null);
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
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
    async function openItem(item) {
        if (item.read === false) await feed.read(item.id);
        const target = notificationTarget(item);
        if (target) { if (details.current) details.current.open = false; navigate(target); }
    }
    const unread = state.unreadTotal;
    return <details ref={details} className="notification-bell" onToggle={event => setOpen(event.currentTarget.open)} onKeyDown={event => {
        if (event.key === 'Escape' && details.current.open) { event.preventDefault(); close(); }
    }}>
        <summary ref={trigger} className="notification-trigger" aria-label={unread == null ? msg(MSG.NOTIF_TITLE) : msg(MSG.NOTIFICATION_BELL_LABEL, { count: unread })}>
            <Bell size={20} aria-hidden="true"/>
            {unread == null ? <span className="notification-count is-unknown" aria-hidden="true">…</span>
                : unread > 0 && <span className="notification-count" aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}
        </summary>
        {open && <NotificationPanel state={state} feed={feed} onClose={close} onOpenItem={openItem}/>}
    </details>;
}

export function NotificationPanel({ state, feed, onClose, onOpenItem = () => {} }) {
    const titleId = useId();
    const panel = useRef(null);
    async function act(operation) {
        await operation();
        // Dòng vừa biến mất khỏi danh sách không được để focus rơi về body.
        if (panel.current && document.activeElement === document.body) panel.current.querySelector('button[aria-pressed="true"]')?.focus({ preventScroll: true });
    }
    return <section ref={panel} className="notification-panel" aria-labelledby={titleId}>
        <div className="notification-heading"><div><h2 id={titleId}>{msg(MSG.NOTIF_TITLE)}</h2><p aria-live="polite">{state.unreadTotal == null ? msg(MSG.NOTIF_LOADING) : state.unreadTotal > 0 ? msg(MSG.NOTIFICATION_NEW_COUNT, { count: state.unreadTotal }) : msg(MSG.NOTIF_ALL_SEEN)}</p></div><button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>{msg(MSG.UI_CLOSE)}</button></div>
        <div className="notification-toolbar"><div className="notification-filters" role="group" aria-label={msg(MSG.NOTIF_FILTER)}>
            <button type="button" className={'btn btn-sm ' + (state.view === 'unread' ? 'btn-primary' : 'btn-outline-primary')} aria-pressed={state.view === 'unread'} onClick={() => void feed.changeView('unread')}>{msg(MSG.NOTIF_FILTER_NEW)}</button>
            <button type="button" className={'btn btn-sm ' + (state.view === 'all' ? 'btn-primary' : 'btn-outline-primary')} aria-pressed={state.view === 'all'} onClick={() => void feed.changeView('all')}>{msg(MSG.TAT_CA)}</button>
        </div><button type="button" className="btn btn-sm btn-outline-secondary" disabled={state.loading} onClick={() => void feed.refresh()}>{msg(MSG.TAI_LAI)}</button></div>
        <div className="notification-scroll" aria-busy={state.loading}>
            {state.loading && <p role="status" className="notification-state">{msg(MSG.NOTIF_LOADING)}</p>}
            {state.error && <p role="alert" className="notification-state">{msg(MSG.NOTIFICATION_LOAD_FAILED)}</p>}
            {!state.loading && !state.error && !state.items.length && <p className="notification-state">{msg(state.view === 'unread' ? MSG.NOTIF_EMPTY_NEW : MSG.NOTIF_EMPTY_ALL)}</p>}
            <ul className="notification-list">{state.items.map(item => {
                const isNew = item.read === false;
                const pending = state.pendingIds.includes(item.id), blocked = state.blockedIds.includes(item.id);
                const subject = notificationSubject(item);
                const exact = notificationTime(item.createdAt);
                return <li key={item.id}>
                    <button type="button" className={'notification-item' + (isNew ? ' is-new' : '')} disabled={pending} aria-busy={pending} onClick={() => void onOpenItem(item)}>
                        <span className="notification-dot" aria-hidden="true"/>
                        <span className="notification-body">
                            {isNew && <span className="visually-hidden">{msg(MSG.NOTIFICATION_NEW_MARK)}</span>}
                            {subject && <strong className="notification-subject">{subject}</strong>}
                            <span className="notification-message">{notificationText(item)}</span>
                            {exact ? <time className="notification-time" dateTime={item.createdAt} title={exact + ' · ' + msg(MSG.NOTIF_TIME_ZONE)}>{relativeTime(item.createdAt)}</time>
                                : <span className="notification-time">{msg(MSG.NOTIF_TIME_UNKNOWN)}</span>}
                            {(Object.hasOwn(state.errors, item.id) || blocked) && <span role="alert" className="notification-item-error">{msg(MSG.NOTIF_MARK_FAILED)}</span>}
                        </span>
                    </button>
                </li>;
            })}</ul>
        </div>
        {!state.error && state.total > PAGE_SIZE && <nav className="notification-pagination" aria-label={msg(MSG.NOTIF_PAGINATION)}><button type="button" className="btn btn-sm btn-outline-secondary" disabled={state.loading || state.page <= 1} onClick={() => void act(() => feed.goToPage(state.page - 1))}>{msg(MSG.TRUOC)}</button><span>{msg(MSG.NOTIF_PAGE, { page: state.page, pages: Math.ceil(state.total / PAGE_SIZE) })}</span><button type="button" className="btn btn-sm btn-outline-secondary" disabled={state.loading || state.page * PAGE_SIZE >= state.total} onClick={() => void act(() => feed.goToPage(state.page + 1))}>{msg(MSG.SAU)}</button></nav>}
    </section>;
}
