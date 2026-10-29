import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
import { MSG, msg } from '../src/messages/index.js';
import { initials, toneFor } from '../src/utils/avatar.js';

let server, ui = {};
before(async () => {
    server = await createServer({ configFile: false, plugins: [ssrDependencies(), react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
    for (const file of ['DataTable', 'Card', 'StatusBadge', 'Form', 'States', 'KeyValueList', 'Tabs', 'PageHeader']) Object.assign(ui, { [file]: await server.ssrLoadModule(`/src/components/ui/${file}.jsx`) });
});
after(() => server?.close());
const render = node => renderToStaticMarkup(h(MemoryRouter, null, node));

test('Avatar initials use first and last word; tone is stable per name', () => {
    assert.equal(initials('Bạch Vân'), 'BV');
    assert.equal(initials('Ô Long'), 'ÔL');
    assert.equal(initials('Nguyễn Văn An'), 'NA');
    assert.equal(initials(''), '?');
    assert.equal(toneFor('Bạch Vân'), toneFor('Bạch Vân'));
});

test('Pagination shows the range, numbered pages with the current one marked, and hides when empty', () => {
    const { Pagination } = ui.DataTable;
    const html = render(h(Pagination, { page: 5, pageSize: 10, total: 95, onChange() {} }));
    assert.ok(html.includes(msg(MSG.UI_SHOWING, { from: 41, to: 50, total: 95 })));
    assert.match(html, /aria-current="page"[^>]*>5</);
    for (const page of [1, 4, 6, 10]) assert.ok(html.includes(`>${page}</button>`), String(page));
    assert.ok(!html.includes('>3</button>'));
    assert.equal(render(h(Pagination, { page: 1, pageSize: 20, total: 0, onChange() {} })), '');
    assert.ok(!render(h(Pagination, { page: 1, pageSize: 20, total: 6, onChange() {} })).includes(msg(MSG.SAU)));
});

test('FilterChips mark the active chip with aria-pressed and show counts', () => {
    const { FilterChips } = ui.DataTable;
    const html = render(h(FilterChips, { value: 'Fit', onChange() {}, options: [{ value: '', label: 'Tất cả', count: 48 }, { value: 'Fit', label: 'Khỏe mạnh', count: 38, dot: 'success' }] }));
    assert.match(html, /aria-pressed="true"[^>]*>.*Khỏe mạnh<b>38<\/b>/);
    assert.match(html, /aria-pressed="false"[^>]*>Tất cả<b>48<\/b>/);
});

test('DataTable renders scoped headers, end-aligned numbers and the empty state instead of an empty table', () => {
    const { DataTable } = ui.DataTable;
    const { EmptyState } = ui.States;
    const columns = [{ key: 'name', label: 'Tên' }, { key: 'stock', label: 'Tồn', align: 'end' }];
    const html = render(h(DataTable, { columns, rows: [{ id: 1, name: 'Cỏ khô', stock: 120 }] }));
    assert.match(html, /<th scope="col">Tên<\/th>/);
    assert.match(html, /<td class="text-end">120<\/td>/);
    const empty = render(h(DataTable, { columns, rows: [], empty: h(EmptyState, { title: 'Chưa có vật tư' }) }));
    assert.ok(!empty.includes('<table'));
    assert.ok(empty.includes('Chưa có vật tư'));
});

test('StatCard links the whole card and shows progress; ActionTile carries its tone', () => {
    const { StatCard, ActionTile } = ui.Card;
    const stat = render(h(StatCard, { label: 'Buổi tập hôm nay', value: 12, progress: { value: 12, max: 14 }, to: '/training/sessions' }));
    assert.match(stat, /<a class="hc-stat is-link" href="\/training\/sessions"/);
    assert.ok(stat.includes('14'));
    assert.match(render(h(ActionTile, { count: 2, label: 'Buổi tập quá hạn', to: '/training/sessions', tone: 'danger' })), /hc-action-tile tone-danger/);
});

test('StatusBadge, Stepper and states expose text, not colour alone', () => {
    assert.match(render(h(ui.StatusBadge.default, { tone: 'warning', dot: true }, 'Đang theo dõi')), /hc-badge tone-warning.*Đang theo dõi/);
    const steps = render(h(ui.Form.Stepper, { steps: ['Nhận diện', 'Giấy tờ', 'Sức khỏe'], current: 1, invalid: new Set([2]) }));
    assert.match(steps, /aria-current="step"/);
    assert.ok(steps.includes(msg(MSG.UI_STEP_DONE)));
    assert.match(steps, /is-todo has-error/);
    assert.match(render(h(ui.States.ErrorState, { onRetry() {} })), /role="alert".*Tải lại/);
    assert.match(render(h(ui.States.Skeleton, {})), /role="status"/);
});

test('PageHeader, KeyValueList and Tabs keep headings, empty values and the active tab', () => {
    const header = render(h(ui.PageHeader.default, { title: 'Danh sách ngựa', description: '48 ngựa', back: { to: '/horses', label: 'Ngựa' } }));
    assert.match(header, /<h1>Danh sách ngựa<\/h1>/);
    assert.match(header, /href="\/horses"/);
    assert.match(render(h(ui.KeyValueList.KeyValueList, { items: [['Màu lông', '']] })), /<dd>—<\/dd>/);
    assert.match(render(h(ui.Tabs.default, { tabs: [{ id: 'a', label: 'Tổng quan' }, { id: 'b', label: 'Y tế' }], active: 'b' })), /hc-tab is-active" aria-current="page">Y tế/);
});
