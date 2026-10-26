import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
import { MSG, msg } from '../src/messages/index.js';
import { displayText, movementState, occupancyState, operationTime, quantityText, signedQuantity, stallHorse, stayState, stockState } from '../src/services/inventoryStableDisplay.js';

let server, Inventory, ItemHistory, Stable, Stalls, StallHistory, Table, AuthContext, api;
const item = { id: 'item/a', name: 'Thức ăn nguyên tên API', category: 'Thức ăn', unit: 'kg', stock: 12.125, minimumStock: 20, archived: false };
const stall = { id: 'stall/a', stableId: 'stable-a', name: 'Ô A01', cleaningStatus: 'NeedsCleaning', occupied: true, horseId: 'horse-a', canClean: false };
const page = (items = []) => ({ items, page: 1, pageSize: 20, total: items.length });
before(async () => {
    server = await createServer({ configFile: false, plugins: [ssrDependencies(), {
        name: 's6-resource-fixture', enforce: 'post',
        transform(code, id) {
            const path = id.replaceAll('\\', '/');
            if (!path.includes('/src/')) return;
            if (path.endsWith('/pages/support/StablePage.jsx')) code = code.replace('useState(null)', 'useState(globalThis.__s6.selection)').replace(/useState\((?:''|"")\)/, "useState(globalThis.__s6.stableId || '')");
            if (path.endsWith('/components/SupportUI.jsx')) code = code.replace('useState(initial)', 'useState({...initial,...globalThis.__s6.form})');
            return code.replaceAll('"react/jsx-dev-runtime"', '"virtual:s6-jsx"');
        },
        resolveId(source) { if (source === 'virtual:s6-jsx') return '\0' + source; },
        load(id) {
            const path = id.replaceAll('\\', '/');
            if (path.endsWith('/src/context/useRegistrationResource.js')) return `export function useRegistrationResource(load){globalThis.__s6.loads.push(load);return {loading:false,error:null,reload(){globalThis.__s6.reloads++},...globalThis.__s6.resources.shift()}}`;
            if (path.endsWith('/src/context/useMutation.js')) return `export function useMutation(){return {run(fn){globalThis.__s6.mutations.push(fn())}}}`;
            if (id === '\0virtual:s6-jsx') return `import {jsxDEV as original} from 'react/jsx-dev-runtime';export {Fragment} from 'react/jsx-dev-runtime';export function jsxDEV(type,props,...rest){if(['button','select','input','form'].includes(type))globalThis.__s6.controls.push({type,props});return original(type,props,...rest)}`;
        },
    }, react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
    ({ default: Inventory, ItemHistory } = await server.ssrLoadModule('/src/pages/support/InventoryPage.jsx'));
    ({ default: Stable, Stalls, StallHistory } = await server.ssrLoadModule('/src/pages/support/StablePage.jsx'));
    ({ OperationsTable: Table } = await server.ssrLoadModule('/src/components/InventoryStableUI.jsx'));
    ({ AuthContext } = await server.ssrLoadModule('/src/context/useAuth.js'));
    ({ default: api } = await server.ssrLoadModule('/src/services/api.js'));
});
beforeEach(() => {
    globalThis.__s6 = { resources: [], loads: [], controls: [], mutations: [], reloads: 0, selection: null, requests: [] };
    api.defaults.adapter = async config => { globalThis.__s6.requests.push(config); return { config, data: page([]), status: 200, headers: {} }; };
});
after(async () => { await server?.close(); delete globalThis.__s6; });
function render(element, role = 'Groom') { return renderToStaticMarkup(h(MemoryRouter, null, h(AuthContext.Provider, { value: { user: { role, id: 'user-' + role }, isAuthenticated: true } }, element))); }
function inventory(items = [item], role) { globalThis.__s6.resources = [{ data: page(items) }]; return render(h(Inventory), role); }
function stalls(selection = null, role = 'Groom', horses = { data: [{ id: 'horse-a', name: 'Tên ngựa trong scope' }] }) {
    globalThis.__s6.selection = selection;
    globalThis.__s6.resources = [{ data: page([stall]) }, ...(selection ? [{ data: page([]) }] : [])];
    return render(h(Stalls, { stableId: 'stable-a', stableName: 'Khu A', manager: role === 'ClubManager', groom: role === 'Groom', horses }), role);
}
const controls = type => globalThis.__s6.controls.filter(x => x.type === type).map(x => x.props);

test('S6 stock warning follows <= including equality and zero, above threshold stays sufficient', () => {
    for (const stock of [0, 4, 5]) assert.equal(stockState({ stock, minimumStock: 5 }).label, msg(MSG.OPS_LOW_STOCK));
    assert.equal(stockState({ stock: 6, minimumStock: 5 }).label, msg(MSG.OPS_STOCK_ABOVE));
});
test('S6 missing/invalid quantities never become zero, warning, or sufficient stock', () => {
    for (const value of [null, undefined, '', '5', NaN, Infinity, {}, false]) {
        assert.equal(quantityText(value), msg(MSG.CHUA_XAC_DINH));
        assert.equal(stockState({ stock: value, minimumStock: 5 }).tone, 'neutral');
        assert.equal(stockState({ stock: 5, minimumStock: value }).tone, 'neutral');
        assert.equal(movementState({ quantity: value }).tone, 'neutral');
    }
    assert.equal(stockState({ stock: -1, minimumStock: 5 }).tone, 'neutral');
});
test('S6 movement preserves signed decimal amounts and replenishment context', () => {
    assert.equal(signedQuantity(12.125), '+12,125'); assert.equal(signedQuantity(-3.5), '-3,5');
    assert.equal(movementState({ quantity: 1, replenishmentRequestId: 'req' }).label, msg(MSG.INV_IN_REPLENISH));
    assert.equal(movementState({ quantity: -1 }).label, msg(MSG.INV_OUT));
    assert.equal(movementState({ quantity: 0 }).tone, 'neutral');
});
test('S6 free text keeps original category/unit/name and safely falls back for invalid values', () => {
    for (const text of ['Thuốc', 'Thức ăn', 'Medicine', 'Nhóm tự khai báo', 'kg', 'hộp nguyên']) assert.equal(displayText(text), text);
    for (const value of [null, undefined, '', ' ', {}, 4]) assert.equal(displayText(value, MSG.OPS_UNIT_UNKNOWN), msg(MSG.OPS_UNIT_UNKNOWN));
});
test('S6 time uses Vietnam timezone and never Invalid Date or invented current time', () => {
    assert.match(operationTime('2026-10-24T02:30:00Z'), /09:30/);
    for (const value of [null, undefined, '', 'invalid', 0, {}]) assert.equal(operationTime(value), msg(MSG.OPS_TIME_UNKNOWN));
});
test('S6 horse join uses exact allowed ID, independently of occupancy and names', () => {
    const horses = [{ id: 'horse-a', name: 'Đúng tên' }, { id: 'other', name: 'Sai tên' }];
    assert.equal(stallHorse(stall, horses), 'Đúng tên');
    assert.equal(stallHorse({ ...stall, horseId: 'private' }, horses), msg(MSG.OPS_HORSE_UNKNOWN));
    assert.equal(stallHorse({ ...stall, occupied: false }, horses), '—');
    assert.equal(stallHorse({ ...stall, horseId: null }, [{ id: null, name: 'Không hợp lệ' }]), msg(MSG.OPS_HORSE_UNKNOWN));
    assert.equal(occupancyState(null).label, msg(MSG.CHUA_XAC_DINH));
});
test('S6 only endedAt null denotes a current stay; missing/invalid are unknown', () => {
    assert.equal(stayState(null).label, msg(MSG.STALL_IN));
    assert.equal(stayState('2026-10-20T03:00:00Z').label, msg(MSG.STALL_LEFT));
    for (const v of [undefined, '', 'invalid', 0]) assert.equal(stayState(v).label, msg(MSG.CHUA_XAC_DINH));
});
test('S6 Inventory actual table renders food/medicine, raw units and exact values', () => {
    const html = inventory([item, { ...item, id: 'med', name: 'Thuốc gốc API', category: 'Thuốc', unit: 'chai', stock: 0, minimumStock: 5 }]);
    for (const text of [item.name, 'Thức ăn', 'Thuốc gốc API', 'Thuốc', 'chai', 'kg', '12,125', '>0<', '>20<', msg(MSG.OPS_LOW_STOCK)]) assert.ok(html.includes(text), text);
    assert.match(html, /ops-number/); assert.doesNotMatch(html, /liều dùng|hạn sử dụng|số lô/i);
});
test('S6 Inventory safe fallback and long text are preserved and escaped', () => {
    const name = 'Tên dài '.repeat(35) + '<script>unsafe</script>';
    const html = inventory([{ ...item, name, unit: null, category: 'Nhóm tùy chỉnh', stock: null, minimumStock: null }]);
    assert.ok(html.includes(name.replaceAll('<', '&lt;').replaceAll('>', '&gt;')));
    assert.ok(html.includes('Nhóm tùy chỉnh')); assert.ok(html.includes(msg(MSG.OPS_UNIT_UNKNOWN)));
    assert.doesNotMatch(html, /<script>/);
});
test('S6 Inventory retains issue navigation and Manager create/archive controls, Groom read/outgoing only', () => {
    const groom = inventory(); assert.ok(groom.includes('href="/inventory/issue"')); assert.doesNotMatch(groom, /Lưu trữ vật tư|Thêm vật tư/);
    const manager = inventory([item], 'ClubManager');
    assert.ok(manager.includes(msg(MSG.SUPPORT_NEW_ITEM))); assert.ok(manager.includes(msg(MSG.INV_ARCHIVE_ACTION)));
    assert.equal(controls('form').length, 1);
});
test('S6 viewing Inventory only executes original paged GET and keeps filter/pagination', async () => {
    const html = inventory(); assert.ok(html.includes(msg(MSG.SUPPORT_STOCK_FILTER))); assert.match(html, /name="lowStock"/);
    assert.ok(html.includes(msg(MSG.TRUOC))); assert.ok(html.includes(msg(MSG.SAU)));
    await globalThis.__s6.loads[0](); const [req] = globalThis.__s6.requests;
    assert.equal(req.method, 'get'); assert.equal(req.url, '/api/inventory'); assert.deepEqual(req.params, { lowStock: false, page: 1, pageSize: 20 });
    assert.equal(globalThis.__s6.mutations.length, 0);
});
test('S6 Inventory loading/empty/error are distinct and retry calls resource reload', () => {
    for (const mode of ['loading', 'empty', 'error']) {
        globalThis.__s6.resources = [mode === 'empty' ? { data: page([]) } : mode === 'loading' ? { loading: true } : { error: { status: 503, message: 'Lỗi kiểm thử' } }];
        const html = render(h(Inventory));
        if (mode === 'empty') assert.ok(html.includes(msg(MSG.OPS_EMPTY_INVENTORY)));
        else { assert.ok(!html.includes(msg(MSG.OPS_EMPTY_INVENTORY))); assert.ok(!html.includes('<table')); }
    }
    controls('button').find(x => x.children === msg(MSG.TAI_LAI)).onClick(); assert.equal(globalThis.__s6.reloads, 1);
});
test('S6 Movement table renders signed changes, unit, request ID, reason and encoded GET', async () => {
    globalThis.__s6.resources = [{ data: page([{ id: 'm1', quantity: 15.125, reason: 'Nhập kho', replenishmentRequestId: 'request-01', createdAt: '2026-10-24T02:30:00Z' }, { id: 'm2', quantity: -3, reason: 'Xuất kho' }]) }];
    const html = render(h(ItemHistory, { item }));
    for (const text of ['+15,125', '-3', 'kg', 'request-01', 'Nhập kho', 'Xuất kho', msg(MSG.OPS_MOVEMENT_HELP)]) assert.ok(html.includes(text));
    await globalThis.__s6.loads[0](); assert.equal(globalThis.__s6.requests[0].url, '/api/inventory/item%2Fa/movements'); assert.equal(globalThis.__s6.requests[0].method, 'get');
});
test('S6 Movement missing data does not claim outgoing zero or Invalid Date', () => {
    globalThis.__s6.resources = [{ data: page([{ id: 'missing', quantity: null, createdAt: 'invalid' }]) }];
    const html = render(h(ItemHistory, { item: { ...item, unit: null } }));
    assert.ok(html.includes(msg(MSG.OPS_UNIT_UNKNOWN))); assert.doesNotMatch(html, /Invalid Date|>0<|>Xuất</);
});
test('S6 Movement empty and error show contextual feedback with retry', () => {
    globalThis.__s6.resources = [{ data: page([]) }]; assert.ok(render(h(ItemHistory, { item })).includes(msg(MSG.OPS_EMPTY_MOVEMENTS)));
    globalThis.__s6.resources = [{ error: { status: 503, message: 'Lỗi lịch sử' } }]; const html = render(h(ItemHistory, { item })); assert.ok(html.includes(msg(MSG.TAI_LAI))); assert.ok(!html.includes(msg(MSG.OPS_EMPTY_MOVEMENTS)));
});
test('S6 Stable loads unchanged stables/horses endpoints and offers named scoped selector', async () => {
    globalThis.__s6.resources = [{ data: [{ id: 'stable-a', name: 'Khu A' }] }, { data: [] }];
    const html = render(h(Stable)); assert.ok(html.includes('Khu A')); assert.ok(html.includes(msg(MSG.OPS_STABLE_SELECT))); assert.doesNotMatch(html, /Tạo ô chuồng/);
    for (const load of globalThis.__s6.loads) await load();
    assert.deepEqual(globalThis.__s6.requests.map(x => x.url), ['/api/care/stables', '/api/horses']);
    assert.ok(globalThis.__s6.requests.every(x => x.method === 'get'));
});
test('S6 Stable empty/loading/error states do not pretend there are stalls', () => {
    for (const state of [{ data: [] }, { loading: true }, { error: { status: 503, message: 'Lỗi khu chuồng' } }]) {
        globalThis.__s6.resources = [state, { data: [] }]; const html = render(h(Stable)); assert.doesNotMatch(html, /<table/);
        assert.equal(html.includes(msg(MSG.OPS_STABLE_EMPTY)), !!state.data);
    }
});
test('S6 reloading stable choices does not unmount an already selected stall and its form', () => {
    globalThis.__s6.stableId = 'stable-a'; globalThis.__s6.selection = { ...stall, canClean: true };
    globalThis.__s6.resources = [{ loading: true }, { data: [] }, { data: page([stall]) }, { data: page([]) }];
    const html = render(h(Stable));
    assert.ok(html.includes(msg(MSG.STALL_UPDATE_CLEANING))); assert.ok(html.includes('Ô A01')); assert.ok(html.includes(msg(MSG.OPS_CLOSE_DETAIL)));
});
test('S6 Stall list shows stable, occupied, cleaning, matched horse and no unauthorized extra name', async () => {
    const html = stalls(); for (const value of ['Ô A01', 'Khu A', 'Tên ngựa trong scope', msg(MSG.SUPPORT_OCCUPIED), msg(MSG.SUPPORT_DIRTY)]) assert.ok(html.includes(value));
    await globalThis.__s6.loads[0](); assert.deepEqual(globalThis.__s6.requests[0].params, { stableId: 'stable-a', page: 1, pageSize: 20 }); assert.equal(globalThis.__s6.requests[0].url, '/api/care/stalls');
});
test('S6 missing horse names or horse lookup error leaves occupied stall usable', () => {
    for (const horses of [{ data: [] }, { loading: true }, { error: { status: 403 } }]) {
        const html = stalls(null, 'Groom', horses); assert.ok(html.includes(msg(MSG.SUPPORT_OCCUPIED))); assert.ok(html.includes(msg(MSG.OPS_HORSE_UNKNOWN))); assert.ok(html.includes(msg(MSG.CHI_TIET)));
    }
});
test('S6 Groom cleaning control needs canClean true, never merely occupied/vacant', () => {
    assert.ok(!stalls(stall).includes(msg(MSG.STALL_UPDATE_CLEANING)));
    assert.ok(stalls({ ...stall, occupied: false, canClean: true }).includes(msg(MSG.STALL_UPDATE_CLEANING)));
    assert.ok(!stalls({ ...stall, canClean: 'true' }).includes(msg(MSG.STALL_UPDATE_CLEANING)));
});
test('S6 Manager retains administrative occupancy/vacate/cleaning and no care assignment form', () => {
    let html = stalls(stall, 'ClubManager'); assert.ok(html.includes(msg(MSG.SUPPORT_VACATE))); assert.ok(html.includes(msg(MSG.STALL_UPDATE_CLEANING))); assert.ok(!html.includes(msg(MSG.SUPPORT_OCCUPY)));
    html = stalls({ ...stall, occupied: false }, 'ClubManager'); assert.ok(html.includes(msg(MSG.SUPPORT_OCCUPY))); assert.ok(!html.includes(msg(MSG.SUPPORT_VACATE)));
    assert.doesNotMatch(html, /name="assignedGroomId"|name="taskType"/);
});
test('S6 unchanged cleaning form does not send a mutation merely on view or unchanged submit', () => {
    stalls({ ...stall, canClean: true }); assert.equal(globalThis.__s6.requests.length, 0); assert.equal(globalThis.__s6.mutations.length, 0);
    const select = controls('select').find(x => x.name === 'status'); assert.equal(select.value, 'NeedsCleaning');
    // The actual submit is unchanged; initial value is rejected as unchanged by SupportForm.
    controls('form')[0].onSubmit({ preventDefault() {} }); assert.equal(globalThis.__s6.mutations.length, 0);
});
test('S6 authorized Groom cleaning retains original PUT payload after selecting a new status', async () => {
    globalThis.__s6.form = { status: 'Clean' }; stalls({ ...stall, canClean: true });
    controls('form')[0].onSubmit({ preventDefault() {} }); await Promise.all(globalThis.__s6.mutations);
    const [req] = globalThis.__s6.requests; assert.equal(req.method, 'put'); assert.equal(req.url, '/api/care/stalls/stall%2Fa/cleaning'); assert.deepEqual(JSON.parse(req.data), { status: 'Clean' });
});
test('S6 Manager item creation preserves existing POST payload and numeric minimum', async () => {
    globalThis.__s6.form = { name: 'Tên vật tư', category: 'Thuốc', unit: 'chai', minimumStock: '1.125' }; inventory([item], 'ClubManager');
    controls('form')[0].onSubmit({ preventDefault() {} }); await Promise.all(globalThis.__s6.mutations);
    const [req] = globalThis.__s6.requests; assert.equal(req.method, 'post'); assert.equal(req.url, '/api/inventory'); assert.deepEqual(JSON.parse(req.data), { name: 'Tên vật tư', category: 'Thuốc', unit: 'chai', minimumStock: 1.125 });
});
test('S6 Stall history uses supplied horseName and treats null endedAt as current', async () => {
    globalThis.__s6.resources = [{ data: page([{ id: 'a', horseId: 'not-a-name', horseName: 'Tên lịch sử được phép', startedAt: '2026-10-23T01:00:00Z', endedAt: null }, { id: 'b', horseName: null, startedAt: 'invalid', endedAt: '2026-10-20T03:00:00Z' }]) }];
    const html = render(h(StallHistory, { stallId: 'stall/a' }));
    for (const text of ['Tên lịch sử được phép', msg(MSG.STALL_IN), msg(MSG.STALL_LEFT), msg(MSG.OPS_CURRENT_STAY), msg(MSG.OPS_HORSE_UNKNOWN)]) assert.ok(html.includes(text));
    assert.doesNotMatch(html, /not-a-name|Invalid Date/);
    await globalThis.__s6.loads[0](); assert.equal(globalThis.__s6.requests[0].url, '/api/care/stalls/stall%2Fa/history');
});
test('S6 Stall history contextual empty and loading/error preserve honest state', () => {
    for (const state of [{ data: page([]) }, { loading: true }, { error: { status: 503, message: 'Lỗi lịch sử ô' } }]) {
        globalThis.__s6.resources = [state]; const html = render(h(StallHistory, { stallId: stall.id })); assert.equal(html.includes(msg(MSG.OPS_EMPTY_HISTORY)), !!state.data);
    }
});
test('S6 local table suppresses stale rows during loading/error and exposes keyboard scroll region', () => {
    const columns = [{ key: 'name', label: 'Tên' }];
    for (const resource of [{ data: page([item]), loading: true }, { data: page([item]), error: { status: 503 } }]) assert.ok(!render(h(Table, { title: 'Danh sách', resource, columns })).includes(item.name));
    const html = render(h(Table, { title: 'Danh sách', resource: { data: page([item]) }, columns })); assert.match(html, /role="region"/); assert.match(html, /tabindex="0"/); assert.match(html, /scope="col"/);
});
