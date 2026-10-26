import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNotificationFeed } from '../src/services/notificationFeed.js';
import { notificationText, notificationTime } from '../src/messages/notifications.js';

const item = (id, read = false) => ({ id, read, type: 'RegistrationReview', messageCode: 'AHorseRegistrationRequiresReview', createdAt: '2026-10-21T08:30:00Z' });
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
const response = (items, total = items.length) => ({ data: { items, total } });
function fixture(records = [item('one'), item('two')]) {
    const rows = structuredClone(records), requests = [];
    const client = {
        async get(url, { params }) {
            requests.push({ method: 'get', url, params });
            const list = rows.filter(row => !params.unread || !row.read);
            return response(list.slice((params.page - 1) * params.pageSize, params.page * params.pageSize).map(row => ({ ...row })), list.length);
        },
        async post(url) { requests.push({ method: 'post', url }); rows.find(row => row.id === decodeURIComponent(url.split('/')[3])).read = true; return { status: 204 }; },
    };
    return { client, requests, rows };
}
test('S5 feed starts in real loading with unknown count, then takes unread total from the server', async () => {
    const wait = deferred(); const requests = [];
    const feed = createNotificationFeed({ get(url, options) { requests.push({ url, ...options }); return wait.promise; } });
    assert.equal(feed.getSnapshot().loading, true); assert.equal(feed.getSnapshot().unreadTotal, null);
    const started = feed.start(); assert.equal(feed.getSnapshot().loading, true);
    wait.resolve(response([item('one')], 37)); await started;
    assert.equal(feed.getSnapshot().unreadTotal, 37); assert.equal(feed.getSnapshot().items.length, 1);
    assert.deepEqual(requests, [{ url: '/api/notifications', params: { page: 1, pageSize: 10, unread: true } }]);
});
test('S5 empty unread response is ready with count zero, not loading or error', async () => {
    const { client } = fixture([]); const feed = createNotificationFeed(client); await feed.start();
    assert.equal(feed.getSnapshot().loading, false); assert.equal(feed.getSnapshot().error, false);
    assert.equal(feed.getSnapshot().unreadTotal, 0); assert.deepEqual(feed.getSnapshot().items, []);
});
test('S5 All omits unread and includes read/unread; count still comes from a separate unread query', async () => {
    const { client, requests } = fixture([item('read', true), item('unread')]); const feed = createNotificationFeed(client);
    await feed.start(); await feed.changeView('all');
    assert.deepEqual(feed.getSnapshot().items.map(r => r.read), [true, false]); assert.equal(feed.getSnapshot().total, 2); assert.equal(feed.getSnapshot().unreadTotal, 1);
    assert.deepEqual(requests.slice(-2).map(r => r.params), [{ page: 1, pageSize: 10 }, { unread: true, page: 1, pageSize: 1 }]);
});
test('S5 mark-read waits for POST acknowledgement and blocks duplicate requests synchronously', async () => {
    const f = fixture([item('id / one')]), wait = deferred(); let posts = 0;
    const post = f.client.post; f.client.post = async url => { posts++; await wait.promise; return post(url); };
    const feed = createNotificationFeed(f.client); await feed.start();
    const first = feed.read('id / one'); assert.equal(await feed.read('id / one'), false);
    assert.equal(posts, 1); assert.deepEqual(feed.getSnapshot().pendingIds, ['id / one']);
    assert.equal(feed.getSnapshot().unreadTotal, 1); assert.equal(feed.getSnapshot().items[0].read, false);
    wait.resolve(); await first;
    assert.equal(feed.getSnapshot().unreadTotal, 0); assert.deepEqual(feed.getSnapshot().items, []);
    assert.ok(f.requests.some(r => r.url === '/api/notifications/id%20%2F%20one/read'));
});
test('S5 All retains the server-confirmed read record and syncs unread count after success', async () => {
    const { client } = fixture(); let signals = 0; const feed = createNotificationFeed(client, () => signals++);
    await feed.start(); await feed.changeView('all'); await feed.read('one');
    assert.equal(feed.getSnapshot().items.find(r => r.id === 'one').read, true);
    assert.equal(feed.getSnapshot().unreadTotal, 1); assert.equal(signals, 1); assert.equal(feed.getSnapshot().notice, true);
    assert.equal(await feed.read('one'), false);
});
test('S5 rejected mark-read keeps count/list unchanged and exposes an error without success', async () => {
    const { client } = fixture(); client.post = async () => { throw { status: 400 }; };
    const feed = createNotificationFeed(client); await feed.start(); assert.equal(await feed.read('one'), false);
    assert.equal(feed.getSnapshot().items[0].read, false); assert.equal(feed.getSnapshot().unreadTotal, 2);
    assert.equal(feed.getSnapshot().errors.one, true); assert.equal(feed.getSnapshot().notice, false); assert.deepEqual(feed.getSnapshot().pendingIds, []);
});
test('S5 a later server-confirmed read state clears an earlier mutation error', async () => {
    const f = fixture(); f.client.post = async () => { throw { status: 400 }; };
    const feed = createNotificationFeed(f.client); await feed.start(); await feed.read('one');
    f.rows[0].read = true; await feed.changeView('all');
    assert.equal(feed.getSnapshot().items[0].read, true); assert.equal(Object.hasOwn(feed.getSnapshot().errors, 'one'), false);
});
test('S5 uncertain mark-read blocks replay until a fresh server response reconciles that record', async () => {
    const { client } = fixture(); let posts = 0; client.post = async () => { posts++; throw new Error('network fixture'); };
    const feed = createNotificationFeed(client); await feed.start(); await feed.read('one'); await feed.read('one');
    assert.equal(posts, 1); assert.deepEqual(feed.getSnapshot().blockedIds, ['one']);
    await feed.refresh(); assert.deepEqual(feed.getSnapshot().blockedIds, []);
    await feed.read('one'); assert.equal(posts, 2);
});
test('S5 GET error has no invented zero count and retry can recover', async () => {
    const f = fixture(); let fail = true;
    const feed = createNotificationFeed({ get: (...args) => fail ? Promise.reject(new Error('fixture')) : f.client.get(...args) });
    await feed.start(); assert.equal(feed.getSnapshot().error, true); assert.equal(feed.getSnapshot().loading, false); assert.equal(feed.getSnapshot().unreadTotal, null);
    fail = false; await feed.refresh(); assert.equal(feed.getSnapshot().error, false); assert.equal(feed.getSnapshot().unreadTotal, 2);
});
test('S5 older GET cannot overwrite the latest realtime/refetch response', async () => {
    const old = deferred(), latest = deferred(); let calls = 0;
    const feed = createNotificationFeed({ get: () => (++calls === 1 ? old.promise : latest.promise) });
    const first = feed.start(), second = feed.refresh(); latest.resolve(response([item('new')], 8)); await second;
    old.resolve(response([item('old')], 99)); await first;
    assert.equal(feed.getSnapshot().items[0].id, 'new'); assert.equal(feed.getSnapshot().unreadTotal, 8);
});
test('S5 latest GET error cannot be hidden by a late old success', async () => {
    const old = deferred(); let calls = 0;
    const feed = createNotificationFeed({ get: () => ++calls === 1 ? old.promise : Promise.reject(new Error('new failure')) });
    const first = feed.start(); await feed.refresh(); old.resolve(response([item('old')])); await first;
    assert.equal(feed.getSnapshot().error, true); assert.deepEqual(feed.getSnapshot().items, []);
});
test('S5 switching to All prevents an older unread response from restoring the wrong view', async () => {
    const old = deferred(); const f = fixture([item('read', true), item('unread')]); let calls = 0;
    const feed = createNotificationFeed({ get: (...args) => ++calls === 1 ? old.promise : f.client.get(...args) });
    const first = feed.start(); await feed.changeView('all'); old.resolve(response([item('stale')])); await first;
    assert.equal(feed.getSnapshot().view, 'all'); assert.deepEqual(feed.getSnapshot().items.map(r => r.id), ['read', 'unread']);
});
test('S5 unmount/user-scope disposal discards late GET and POST results and callbacks', async () => {
    const f = fixture(), wait = deferred(); let signals = 0; f.client.post = () => wait.promise;
    const old = createNotificationFeed(f.client, () => signals++); await old.start(); const read = old.read('one'); old.stop();
    const current = createNotificationFeed(fixture([item('user-b-only')]).client); await current.start();
    wait.resolve({ status: 204 }); await read;
    assert.deepEqual(old.getSnapshot().items, []); assert.equal(signals, 0);
    assert.deepEqual(current.getSnapshot().items.map(r => r.id), ['user-b-only']);
    const getWait = deferred(); const oldGet = createNotificationFeed({ get: () => getWait.promise }); const started = oldGet.start(); oldGet.stop(); getWait.resolve(response([item('user-a')])); await started;
    assert.deepEqual(oldGet.getSnapshot().items, []);
});
test('S5 pagination clamps after the last unread on a page is marked read', async () => {
    const f = fixture(Array.from({ length: 11 }, (_, i) => item('n-' + i))); const feed = createNotificationFeed(f.client);
    await feed.start(); await feed.goToPage(2); assert.equal(feed.getSnapshot().items[0].id, 'n-10'); await feed.read('n-10');
    assert.equal(feed.getSnapshot().page, 1); assert.equal(feed.getSnapshot().total, 10); assert.equal(feed.getSnapshot().items.length, 10);
    await feed.changeView('all'); assert.equal(feed.getSnapshot().page, 1);
});
test('S5 identical messages remain separate events, with no invented link/reference mapping', async () => {
    const f = fixture(); const feed = createNotificationFeed(f.client); await feed.start();
    assert.deepEqual(feed.getSnapshot().items.map(r => r.id), ['one', 'two']);
    assert.equal(await feed.read('outside-scope'), false); assert.equal(f.requests.filter(r => r.method === 'post').length, 0);
    assert.ok(f.requests.every(r => !Object.hasOwn(r.params, 'recipientId') && !Object.hasOwn(r.params, 'horseId')));
});
test('S5 notification text comes only from messageCode, never from stored or display text', () => {
    assert.match(notificationText({ ...item('one'), displayMessage: 'Server text', messageCode: 'AHorseRegistrationRequiresReview' }), /hồ sơ ngựa mới chờ duyệt/);
    assert.match(notificationText({ type: 'MedicalRestrictionCreated', messageCode: 'AMedicalRestrictionChangedDuringYourSessionStopIncompatible' }), /liên hệ bác sĩ thú y/);
    assert.equal(notificationText({ type: 'HorseAssignment', message: 'Horse is archived.', displayMessage: 'Horse is archived.' }), 'Bạn có thông báo mới.');
});
test('S5 missing/invalid presentation data has safe catalog fallbacks', () => {
    for (const data of [null, {}, { type: 'constructor', message: {} }, { type: '__proto__', displayMessage: ' ', messageCode: 'unknown' }, { messageCode: '__proto__' }]) assert.equal(notificationText(data), 'Bạn có thông báo mới.');
    assert.match(notificationText({ type: 'RegistrationReview', displayMessage: '', messageCode: 'YourHorseRegistrationWasApproved' }), /đã được duyệt/);
});
test('S5 time uses Vietnam timezone and missing/invalid values never become fabricated dates', () => {
    const time = notificationTime('2026-10-21T08:30:00Z'); assert.ok(time.includes('15:30')); assert.ok(time.includes('21/10/2026'));
    for (const value of [null, undefined, '', ' ', 'not-a-date', 0]) assert.equal(notificationTime(value), null);
});
