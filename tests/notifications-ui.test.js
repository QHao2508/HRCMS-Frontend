import assert from 'node:assert/strict';
import { before, after, beforeEach, test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
import { MSG, msg } from '../src/messages/index.js';
let server, Bell, Panel;
const row = { id: 'fixture', read: false, type: 'RegistrationReview', createdAt: '2026-10-21T08:30:00Z', referenceId: 'never-infer-horse-id' };
const ready = { view: 'unread', page: 1, items: [row], total: 1, unreadTotal: 1, loading: false, error: false, pendingIds: [], blockedIds: [], errors: {}, notice: false };
before(async () => {
    server = await createServer({ configFile: false, plugins: [ssrDependencies(), {
        name: 's5-ui-state-fixture', enforce: 'post',
        transform(code, id) { if (id.replaceAll('\\', '/').includes('/src/')) return code.replaceAll('"react/jsx-dev-runtime"', '"virtual:s5-jsx"'); },
        resolveId(source) { if (source === 'virtual:s5-jsx') return '\0' + source; },
        load(id) {
            if (id.replaceAll('\\', '/').endsWith('/src/context/useNotifications.js')) return `export function useNotifications(){return {state:globalThis.__notifUI.state,feed:{refresh(){globalThis.__notifUI.calls.push('refresh')},read(id){globalThis.__notifUI.calls.push(['read',id])},changeView(view){globalThis.__notifUI.calls.push(['view',view])},goToPage(page){globalThis.__notifUI.calls.push(['page',page])}}}}`;
            if (id === '\0virtual:s5-jsx') return `import {jsxDEV as original} from 'react/jsx-dev-runtime';export {Fragment} from 'react/jsx-dev-runtime';export function jsxDEV(type,props,...rest){if(type==='button')globalThis.__notifUI.buttons.push(props);return original(type,props,...rest)}`;
        },
    }, react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
    ({ default: Bell, NotificationPanel: Panel } = await server.ssrLoadModule('/src/components/NotificationBell.jsx'));
});
beforeEach(() => { globalThis.__notifUI = { state: { ...ready }, calls: [], buttons: [] }; });
after(async () => { await server?.close(); delete globalThis.__notifUI; });
function render(state = {}) { globalThis.__notifUI.state = { ...ready, ...state }; return renderToStaticMarkup(h(Panel, { state: globalThis.__notifUI.state, feed: { read(id) { globalThis.__notifUI.calls.push(['read', id]); }, refresh() { globalThis.__notifUI.calls.push('refresh'); }, changeView(view) { globalThis.__notifUI.calls.push(['view', view]); }, goToPage(page) { globalThis.__notifUI.calls.push(['page', page]); } }, onClose() {} })); }
const button = label => globalThis.__notifUI.buttons.find(b => b.children === label);
test('S5 bell has real loading, never empty or a fabricated zero while GET is pending', () => {
    const html = render({ items: [], unreadTotal: null, total: 0, loading: true });
    assert.ok(html.includes(msg(MSG.NOTIF_LOADING))); assert.doesNotMatch(html, /Không có thông báo chưa đọc|Chưa có thông báo nào/);
    assert.match(html, /aria-busy="true"/); assert.ok(html.includes('…'));
});
test('S5 bell keeps accessible native summary and shows unread response total rather than item count', () => {
    const html = render({ unreadTotal: 51 });
    const bell = renderToStaticMarkup(h(MemoryRouter, null, h(Bell)));
    assert.match(bell, /<details/); assert.ok(bell.includes('aria-label="' + msg(MSG.THONG_BAO_CHUA_DOC) + '"'));
    assert.ok(html.includes('51 chưa đọc')); assert.ok(bell.includes('>51</span>'));
    assert.doesNotMatch(bell, /notification-panel/);
    button(msg(MSG.REALTIME_MARK_READ)).onClick(); assert.deepEqual(globalThis.__notifUI.calls, [['read', 'fixture']]);
});
test('S5 All distinguishes read/unread and does not offer read action for an already read item', () => {
    const html = render({ view: 'all', items: [{ ...row, id: 'read', read: true }, row], total: 2, unreadTotal: 1 });
    assert.match(html, /notification-item notification-read/); assert.match(html, /notification-item notification-unread/);
    assert.equal(globalThis.__notifUI.buttons.filter(b => b.children === msg(MSG.REALTIME_MARK_READ)).length, 1);
    assert.match(html, /datetime="2026-10-21T08:30:00Z"/i); assert.ok(html.includes('15:30'));
    assert.doesNotMatch(html, /href=|never-infer-horse-id/);
});
test('S5 long Vietnamese text is complete and server HTML remains escaped text', () => {
    const text = 'Nội dung tiếng Việt dài để kiểm tra xuống dòng. '.repeat(20) + '<script>unsafe</script>';
    const html = render({ items: [{ ...row, displayMessage: text }] });
    assert.ok(html.includes(text.replaceAll('<', '&lt;').replaceAll('>', '&gt;')));
    assert.doesNotMatch(html, /<script>/);
});
test('S5 empty unread and empty All have different precise messages', () => {
    assert.ok(render({ items: [], total: 0, unreadTotal: 0 }).includes(msg(MSG.REALTIME_NO_UNREAD_NOTIFICATIONS)));
    assert.ok(render({ view: 'all', items: [], total: 0, unreadTotal: 0 }).includes(msg(MSG.NOTIF_EMPTY_ALL)));
});
test('S5 GET error exposes a retry control without empty messaging', () => {
    const html = render({ items: [], loading: false, error: true, unreadTotal: null });
    assert.ok(html.includes(msg(MSG.REALTIME_NOTIFICATION_LOAD_FAILED))); assert.match(html, /role="alert"/);
    assert.doesNotMatch(html, /Không có thông báo chưa đọc|Chưa có thông báo nào/);
    button(msg(MSG.TAI_LAI)).onClick(); assert.deepEqual(globalThis.__notifUI.calls, ['refresh']);
});
test('S5 pending and uncertain mark-read actions are disabled with clear feedback', () => {
    render({ pendingIds: [row.id] }); assert.equal(button(msg(MSG.DANG_XU_LY)).disabled, true);
    globalThis.__notifUI.buttons = [];
    const html = render({ blockedIds: [row.id], errors: { [row.id]: true } });
    assert.equal(button(msg(MSG.REALTIME_MARK_READ)).disabled, true); assert.ok(html.includes(msg(MSG.NOTIF_MARK_FAILED)));
});
test('S5 filters and pagination invoke feed methods while preserving actual view state', () => {
    render({ page: 2, total: 25 });
    assert.equal(button(msg(MSG.NOTIF_UNREAD))['aria-pressed'], true);
    assert.equal(button(msg(MSG.TAT_CA))['aria-pressed'], false);
    button(msg(MSG.TAT_CA)).onClick(); button(msg(MSG.TRUOC)).onClick(); button(msg(MSG.SAU)).onClick();
    assert.deepEqual(globalThis.__notifUI.calls, [['view', 'all'], ['page', 1], ['page', 3]]);
});
test('S5 missing content/time uses fallbacks without inventing context or dates', () => {
    const html = render({ items: [{ id: 'empty', read: false, referenceId: 'untyped-reference', createdAt: 'invalid' }] });
    assert.ok(html.includes(msg(MSG.NOTIFICATION_NEW))); assert.ok(html.includes(msg(MSG.NOTIF_TIME_UNKNOWN)));
    assert.doesNotMatch(html, /untyped-reference|datetime=|href=/);
});
