import assert from 'node:assert/strict';
import { before, after, beforeEach, test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
import { MSG, msg } from '../src/messages/index.js';
import { FORM_SECTIONS } from '../src/services/registrationValidation.js';
import { WIZARD_STEPS, SECTION_STEPS } from '../src/constants/registrationWizard.js';

// Test-only records. No request reaches a real Backend.
const record = { id: 'review-fixture', ownerId: 'private-owner-id', ownerName: 'Nguyễn Chủ Hồ Sơ', name: 'Ngựa kiểm thử',
    status: 'PendingReview', createdAt: '2026-10-21T15:30:00Z', registrationNumber: 'S4-TEST',
    dateOfBirth: '2020-02-01', gender: 'Female', breed: 'Thoroughbred', sire: 'Ngựa bố kiểm thử', dam: 'Ngựa mẹ kiểm thử',
    heightCm: 162, weightKg: 480, measurementDate: '2026-10-20', declaredHealth: 'Khai báo sức khỏe kiểm thử',
    healthNotes: 'Ghi chú sức khỏe kiểm thử', boardingStart: '2026-11-01', boardingEnd: '2027-01-31' };
const attachments = [{ id: 'certificate', type: 'Certificate', fileName: 'chung-nhan-kiem-thu.pdf', length: 2048 }];
let server, ReviewList, ReviewDetail, Summary, WizardSteps, AuthContext, api;
before(async () => {
    server = await createServer({ configFile: false, plugins: [ssrDependencies(), {
        name: 's4-review-fixture', enforce: 'post',
        transform(code, id) { if (id.replaceAll('\\', '/').includes('/src/')) return code.replaceAll('"react/jsx-dev-runtime"', '"virtual:s4-jsx"'); },
        resolveId(source) { if (source === 'virtual:s4-jsx') return '\0' + source; },
        load(id) {
            if (id.replaceAll('\\', '/').endsWith('/src/context/useRegistrationResource.js')) return `export function useRegistrationResource(load){globalThis.__s4.loads.push(load);return {data:globalThis.__s4.resources.shift(),loading:false,error:null,reload(){}}}`;
            if (id === '\0virtual:s4-jsx') return `import {jsxDEV as original} from 'react/jsx-dev-runtime';export {Fragment} from 'react/jsx-dev-runtime';export function jsxDEV(type,props,...rest){if(['button','select','input','textarea','form'].includes(type))globalThis.__s4.controls.push({type,props});return original(type,props,...rest)}`;
        },
    }, react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
    ({ ReviewList, ReviewDetail } = await server.ssrLoadModule('/src/pages/reviews/ReviewPages.jsx'));
    ({ RegistrationSummary: Summary, WizardSteps } = await server.ssrLoadModule('/src/components/registrations/RegistrationWizard.jsx'));
    ({ AuthContext } = await server.ssrLoadModule('/src/context/useAuth.js'));
    ({ default: api } = await server.ssrLoadModule('/src/services/api.js'));
});
beforeEach(() => {
    globalThis.__s4 = { resources: [], controls: [], loads: [] };
    api.defaults.adapter = async () => { throw new Error('Unexpected request in S4 test'); };
});
after(async () => { await server?.close(); delete globalThis.__s4; });
function render(element, role = 'ClubManager', location = '/reviews') {
    return renderToStaticMarkup(h(MemoryRouter, { initialEntries: [location] }, h(AuthContext.Provider, { value: {
        user: { id: 'logged-in-user', firstName: 'Tên tài khoản khác', role }, loading: false, isAuthenticated: true,
    } }, element)));
}
function list(items = [record]) {
    globalThis.__s4.resources = [{ items, page: 1, pageSize: 20, total: items.length }];
    return render(h(ReviewList));
}
function detail(value = record) {
    globalThis.__s4.resources = [{ record: value, attachments }];
    return render(h(Routes, null, h(Route, { path: '/reviews/:id', element: h(ReviewDetail) })), 'ClubManager', '/reviews/' + value.id);
}
function button(label) { return globalThis.__s4.controls.find(x => x.type === 'button' && x.props.children === label)?.props; }

test('S4 list renders ownerName between horse and registration columns without removing existing data', () => {
    const html = list();
    assert.ok(html.includes(record.ownerName));
    assert.ok(html.indexOf(msg(MSG.HORSE_OWNER)) > html.indexOf(msg(MSG.TEN_NGUA)));
    assert.ok(html.indexOf(msg(MSG.HORSE_OWNER)) < html.indexOf(msg(MSG.MA_DANG_KY)));
    for (const value of [record.name, record.registrationNumber, '2026-10-21', msg(MSG.CHO_DUYET), 'href="/reviews/review-fixture"']) assert.ok(html.includes(value), value);
    assert.doesNotMatch(html, /private-owner-id|Tên tài khoản khác/);
});
test('S4 list uses explicit missing-owner fallback for null, empty, whitespace and absent names', () => {
    for (const ownerName of [null, '', '   ', undefined]) assert.ok(list([{ ...record, ownerName }]).includes('Chưa có thông tin chủ ngựa'));
});
test('S4 list preserves a long owner name in full', () => {
    const ownerName = 'Nguyễn Thị Chủ Ngựa Có Họ Tên Rất Dài Để Kiểm Tra Xuống Dòng Trên Laptop';
    assert.ok(list([{ ...record, ownerName }]).includes(ownerName));
});
test('S4 list retains status filter, pagination and original GET parameters', async () => {
    list();
    const filter = globalThis.__s4.controls.find(x => x.type === 'select').props;
    assert.equal(filter.id, 'review-filter'); assert.equal(filter.value, 'PendingReview');
    assert.ok(button(msg(MSG.TRUOC))); assert.ok(button(msg(MSG.SAU)));
    let request;
    api.defaults.adapter = async config => { request = config; return { config, data: {}, status: 200, headers: {} }; };
    await globalThis.__s4.loads[0]();
    assert.equal(request.method, 'get'); assert.equal(request.url, '/api/registrations');
    assert.deepEqual(request.params, { page: 1, pageSize: 20, status: 'PendingReview' });
});
test('S4 detail displays this record owner exactly once, independent of signed-in user and OwnerId', () => {
    const html = detail();
    assert.equal(html.split(record.ownerName).length - 1, 1);
    assert.doesNotMatch(html, /private-owner-id|Tên tài khoản khác/);
    assert.ok(html.includes('href="/reviews"'));
});
test('S4 detail uses explicit missing-owner fallback without inventing a name', () => {
    for (const ownerName of [null, '', ' ', undefined]) {
        const html = detail({ ...record, ownerName });
        assert.ok(html.includes('Chưa có thông tin chủ ngựa'));
        assert.doesNotMatch(html, /private-owner-id|Tên tài khoản khác/);
    }
});
test('S4 detail retains all summary fields, attachment metadata and administrative fields', () => {
    const html = detail();
    for (const value of [record.sire, record.dam, record.breed, record.declaredHealth, record.healthNotes, record.boardingStart, record.boardingEnd, attachments[0].fileName]) assert.ok(html.includes(value), value);
    for (const name of ['name', 'registrationNumber', 'boardingStart', 'boardingEnd']) assert.ok(globalThis.__s4.controls.some(x => x.type === 'input' && x.props.name === name));
    assert.ok(button(msg(MSG.TAI_XUONG)));
});
test('S4 pending review retains approve action and guards revision without a reason', async () => {
    detail();
    assert.equal(button(msg(MSG.PHE_DUYET_HO_SO)).disabled, false);
    assert.equal(button(msg(MSG.YEU_CAU_CHINH_SUA)).disabled, true);
    let request;
    api.defaults.adapter = async config => { request = config; return { config, data: { registration: { ...record, status: 'Approved' }, horseId: 'horse-fixture' }, status: 200, headers: {} }; };
    await button(msg(MSG.YEU_CAU_CHINH_SUA)).onClick(); assert.equal(request, undefined);
    await button(msg(MSG.PHE_DUYET_HO_SO)).onClick();
    assert.equal(request.url, '/api/registrations/review-fixture/review');
    assert.deepEqual(JSON.parse(request.data), { approve: true });
});
test('S4 non-pending statuses retain read-only review behavior', () => {
    for (const status of ['Approved', 'RevisionRequired', 'Draft', 'Cancelled']) {
        globalThis.__s4.controls = []; detail({ ...record, status });
        assert.equal(button(msg(MSG.PHE_DUYET_HO_SO)), undefined);
        assert.equal(button(msg(MSG.YEU_CAU_CHINH_SUA)), undefined);
        assert.equal(button(msg(MSG.LUU_THONG_TIN_QUAN_LY)), undefined);
    }
});
test('S4 summary uses distinct identity/pedigree headings and keeps sire and dam exactly once', () => {
    const html = render(h(Summary, { record }));
    assert.equal((html.match(/<h2>Nhận diện<\/h2>/g) || []).length, 1);
    assert.equal((html.match(/<h2>Phả hệ<\/h2>/g) || []).length, 1);
    for (const value of [record.sire, record.dam]) assert.equal(html.split(value).length - 1, 1);
    assert.equal((html.match(/<dt>/g) || []).length, FORM_SECTIONS.flatMap(s => s.fields).length);
    assert.doesNotMatch(html, /private-owner-id|Nguyễn Chủ Hồ Sơ/);
});
test('S4 shared summary for Owner keeps all fields, fallback and translated gender without leaking owner data', () => {
    const html = render(h(Summary, { record: { ...record, healthNotes: null } }), 'HorseOwner');
    for (const label of [msg(MSG.PHA_HE), msg(MSG.THONG_TIN_THE_CHAT), msg(MSG.KHAI_BAO_SUC_KHOE_BAN_DAU), msg(MSG.THOI_GIAN_LUU_TRU), msg(MSG.CHUA_NHAP)]) assert.ok(html.includes(label));
    assert.doesNotMatch(html, /private-owner-id|Nguyễn Chủ Hồ Sơ/);
    assert.equal((html.match(/<dd>/g) || []).length, 14);
});
test('S4 wizard order, step mapping and navigation callbacks remain unchanged', () => {
    assert.deepEqual(WIZARD_STEPS, ['Nhận diện', 'Giấy tờ & thể chất', 'Sức khỏe', 'Nhân sự & thời gian', 'Kiểm tra & gửi']);
    assert.deepEqual(Object.values(SECTION_STEPS), [0, 0, 1, 2, 3]);
    const changes = [];
    const html = render(h(WizardSteps, { step: 4, onChange: step => changes.push(step), disabled: false }));
    assert.match(html, /aria-current="step"/);
    for (const control of globalThis.__s4.controls.filter(x => x.type === 'button')) control.props.onClick();
    assert.deepEqual(changes, [0, 1, 2, 3, 4]);
});
