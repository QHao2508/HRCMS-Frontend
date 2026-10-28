import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
import { PERMISSIONS, can } from '../src/constants/permissions.js';
import { ALL_ROLES, ROLES } from '../src/constants/roles.js';
import { MSG, msg } from '../src/messages/index.js';

// Render real routes, CarePage, SupportForm/Table and Field. Only resource I/O
// and mutation lifecycle are replaced; no HTTP request can leave this harness.
// JSX discovery records actual controls and callbacks, as in routing.test.js.
function harness() {
    return {
        name: 'care-permissions-harness', enforce: 'post',
        transform(code, id) {
            const path = id.replaceAll('\\', '/');
            if (!path.includes('/src/')) return;
            let result = code.replaceAll('"react/jsx-dev-runtime"', '"virtual:care-jsx"')
                .replaceAll('"react-router-dom"', '"virtual:care-router"')
                .replaceAll("'react-router-dom'", '"virtual:care-router"');
            if (path.endsWith('/pages/support/CarePage.jsx')) {
                result = result.replaceAll('from "react"', 'from "virtual:care-state"')
                    .replaceAll("from 'react'", 'from "virtual:care-state"');
            }
            return result;
        },
        resolveId(source) { if (source.startsWith('virtual:care-')) return '\0' + source; },
        load(id) {
            const path = id.replaceAll('\\', '/');
            if (path.endsWith('/src/services/supportService.js')) return `
                export const id = encodeURIComponent;
                export function read(path, params) {
                    globalThis.__careTest.reads.push({path, params});
                    if (!(path in globalThis.__careTest.data)) throw new Error('Unexpected resource: ' + path);
                    return globalThis.__careTest.data[path];
                }
                export const allPages = read;
                export async function change(path, body, method) {
                    globalThis.__careTest.writes.push({path, body, method});
                    return {id:'saved'};
                }
            `;
            if (path.endsWith('/src/context/useRegistrationResource.js')) return `
                export function useRegistrationResource(load) {
                    const data=load();
                    return {data:data instanceof Promise ? [] : data,loading:false,error:null,reload(){}};
                }
            `;
            if (path.endsWith('/src/context/useMutation.js')) return `
                export function useMutation() {
                    return {pending:false,uncertain:false,async run(action,success){
                        const result=await action(); success?.(result); return result;
                    }};
                }
            `;
            if (id === '\0virtual:care-router') return `
                export * from 'react-router-dom';
                export function Navigate(props) {globalThis.__careTest.redirects.push(props);return null;}
            `;
            if (id === '\0virtual:care-state') return `
                export * from 'react';
                import {useState as original} from 'react';
                export function useState(initial) {
                    if (initial !== null) return original(initial);
                    // Re-render SSR after invoking the real record button callback.
                    const [value,setValue]=original(globalThis.__careTest.selected);
                    return [value,next=>{globalThis.__careTest.selected=next;setValue(next);}];
                }
            `;
            if (id === '\0virtual:care-jsx') return `
                import {jsxDEV as original} from 'react/jsx-dev-runtime';
                export {Fragment} from 'react/jsx-dev-runtime';
                export function jsxDEV(type,props,...rest) {
                    if(type==='form')globalThis.__careTest.forms.push(props);
                    if(type==='button')globalThis.__careTest.buttons.push(props);
                    if(type==='select')globalThis.__careTest.selects.push(props);
                    if(type?.name==='SupportForm')globalThis.__careTest.supportForms.push(props);
                    return original(type,props,...rest);
                }
            `;
        },
    };
}

let server, AppRoutes, AuthContext;
const horse = { id: 'horse-1', name: 'Care fixture horse' };
const treatment = { id: 'treatment-1', completed: false, objective: 'Fixture treatment', instructions: 'Vet instructions', medication: 'Fixture medication', frequency: 'Fixture frequency' };
const task = { id: 'task-1', horseId: horse.id, groomId: 'Groom-id', type: 'Feeding', scheduledAt: '2026-10-24T02:00:00Z', status: 'Pending', instructions: 'Fixture care instructions', approvedPortionKg: 2 };

before(async () => {
    server = await createServer({ configFile: false, plugins: [ssrDependencies(), harness(), react()],
        server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
    ({ default: AppRoutes } = await server.ssrLoadModule('/src/routes/AppRoutes.jsx'));
    ({ AuthContext } = await server.ssrLoadModule('/src/context/useAuth.js'));
});
beforeEach(() => {
    globalThis.__careTest = { reads: [], writes: [], redirects: [], selected: null,
        forms: [], buttons: [], selects: [], supportForms: [], data: {
            '/api/horses': [horse],
            '/api/care/tasks': { items: [task, { ...task, id: 'other-task', groomId: 'other-groom' }, { ...task, id: 'completed-task', status: 'Completed' }], page: 1, pageSize: 20, total: 21 },
            '/api/horses/horse-1': { horse, assignments: [{ staffId: 'Groom-id', role: 'Groom', active: true }] },
            '/api/staff/directory': [{ id: 'Groom-id', firstName: 'Fixture', lastName: 'Groom' }, { id: 'other-groom', firstName: 'Other', lastName: 'Groom' }],
            '/api/horses/horse-1/medical/treatments': [treatment, { ...treatment, id: 'completed', completed: true }],
        } };
});
after(async () => { await server?.close(); delete globalThis.__careTest; });

function render(role, path = '/care/tasks?horseId=horse-1') {
    Object.assign(globalThis.__careTest, { forms: [], buttons: [], selects: [], supportForms: [], redirects: [] });
    return renderToStaticMarkup(h(MemoryRouter, { initialEntries: [path] },
        h(AuthContext.Provider, { value: { user: { id: role + '-id', role }, loading: false, isAuthenticated: true } }, h(AppRoutes))));
}
function assertReader(html) {
    assert.deepEqual(globalThis.__careTest.redirects, []);
    assert.ok(html.includes(msg(MSG.SUPPORT_CARE)));
    assert.ok(html.includes(horse.name));
    assert.ok(html.includes(task.instructions));
    for (const name of ['horseId', 'status', 'from', 'to']) assert.ok(html.includes(`name="${name}"`), name);
    assert.ok(globalThis.__careTest.reads.some(x => x.path === '/api/care/tasks' && x.params.horseId === horse.id && x.params.page === 1 && x.params.pageSize === 20));
}
function assertNoAssignment(html) {
    assert.ok(!html.includes(msg(MSG.SUPPORT_ASSIGN_CARE)));
    assert.equal(globalThis.__careTest.supportForms.length, 0);
    assert.equal(globalThis.__careTest.forms.length, 0);
    assert.equal(globalThis.__careTest.buttons.some(x => x.type === 'submit'), false);
    assert.equal(globalThis.__careTest.reads.some(x => x.path === '/api/staff/directory' || x.path.endsWith('/medical/treatments')), false);
    assert.deepEqual(globalThis.__careTest.writes, []);
}

test('Manager routine care matches current backend contract without loading clinical treatments', async () => {
    const html = render(ROLES.ClubManager);
    assertReader(html);
    const form = globalThis.__careTest.supportForms[0];
    assert.ok(form);
    assert.deepEqual(form.fields(form.initial).find(x => x.name === 'type').options.map(x => x.value), ['Feeding','Cleaning','Bathing','Grooming','WaterCheck']);
    assert.equal(globalThis.__careTest.reads.some(x => x.path.endsWith('/medical/treatments')), false);
    assert.equal(form.fields(form.initial).find(x => x.name === 'approvedPortionKg').required, true);
    await form.submit({...form.initial,groomId:'Groom-id',scheduledAt:'2026-10-24T09:00',approvedPortionKg:'2.5',instructions:'Khẩu phần đã duyệt'});
    assert.equal(globalThis.__careTest.writes[0].body.approvedPortionKg,2.5);
    assert.equal(globalThis.__careTest.writes[0].body.treatmentPlanId,null);
    assert.equal(globalThis.__careTest.writes[0].body.scheduledAt,'2026-10-24T09:00:00+07:00');
});

test('FE07 Vet retains real treatment form, allowed types, active plan validation and unchanged payload', async () => {
    const html = render(ROLES.Veterinarian);
    assertReader(html);
    assert.ok(html.includes(msg(MSG.SUPPORT_ASSIGN_CARE)));
    assert.equal(globalThis.__careTest.forms.length, 1);
    const form = globalThis.__careTest.supportForms[0];
    const input = { ...form.initial, groomId: 'Groom-id', scheduledAt: '2026-10-24T09:00', treatmentPlanId: treatment.id, instructions: 'Vet instructions' };
    const fields = form.fields(input);
    assert.deepEqual(fields.find(x => x.name === 'type').options.map(x => x.value), ['Treatment', 'IceBath']);
    assert.deepEqual(fields.find(x => x.name === 'groomId').options.map(x => x.value), ['', 'Groom-id']);
    assert.deepEqual(fields.find(x => x.name === 'treatmentPlanId').options.map(x => x.value), ['', treatment.id]);
    assert.equal(form.submitDisabled({ ...input, treatmentPlanId: '' }), true);
    assert.equal(form.submitDisabled(input), false);
    assert.equal(fields.find(x => x.name === 'instructions').required, true);
    assert.equal(fields.find(x => x.name === 'instructions').maxLength, 4000);
    assert.equal(form.derive(input, 'treatmentPlanId').instructions, 'Vet instructions · Fixture medication · Fixture frequency');
    await form.submit(input);
    assert.deepEqual(globalThis.__careTest.writes, [{ path: '/api/care/tasks', body: {
        ...input, horseId: horse.id, scheduledAt: '2026-10-24T09:00:00+07:00', approvedPortionKg: null,
    }, method: undefined }]);
    await form.submit({ ...input, type: 'IceBath' });
    assert.equal(globalThis.__careTest.writes[1].body.treatmentPlanId, null);
});

test('FE07 Vet cannot submit Treatment without an active plan', () => {
    globalThis.__careTest.data['/api/horses/horse-1/medical/treatments'] = [];
    const html = render(ROLES.Veterinarian);
    assert.ok(html.includes(msg(MSG.CARE_NO_ACTIVE_TREATMENT)));
    const form = globalThis.__careTest.supportForms[0];
    assert.equal(form.submitDisabled(form.initial), true);
    assert.equal(form.fields(form.initial).find(x => x.name === 'treatmentPlanId').disabled, true);
    assert.ok(globalThis.__careTest.buttons.some(x => x.type === 'submit' && x.disabled));
    globalThis.__careTest.forms[0].onSubmit({ preventDefault() {} });
    assert.deepEqual(globalThis.__careTest.writes, []);
});

test('FE07 Groom retains record action only for own open task and unchanged recording payload', async () => {
    const html = render(ROLES.Groom);
    assertReader(html);
    assertNoAssignment(html);
    const buttons = globalThis.__careTest.buttons.filter(x => x.children === msg(MSG.SUPPORT_RECORD));
    assert.equal(buttons.length, 1); // Other Groom and completed rows cannot be recorded.
    buttons[0].onClick();
    render(ROLES.Groom);
    const form = globalThis.__careTest.supportForms[0];
    assert.ok(form);
    assert.equal(globalThis.__careTest.forms.length, 1);
    assert.equal(form.fields(form.initial).find(x => x.name === 'actualPortionKg').required, true);
    await form.submit({ status: 'Completed', actualPortionKg: '1.5', notes: 'Fixture completed' });
    assert.deepEqual(globalThis.__careTest.writes, [{ path: '/api/care/tasks/task-1/record',
        body: { status: 'Completed', actualPortionKg: 1.5, notes: 'Fixture completed' }, method: undefined }]);
});

test('FE07 Owner keeps care reading without assignment or recording controls', () => {
    const html = render(ROLES.HorseOwner);
    assertReader(html);
    assertNoAssignment(html);
    assert.equal(globalThis.__careTest.buttons.some(x => x.children === msg(MSG.SUPPORT_RECORD)), false);
});

test('care reading includes every role while assignment and recording permissions stay restricted', () => {
    const R = ROLES;
    assert.deepEqual(PERMISSIONS, {
        incidentRead: [R.ClubManager, R.HeadTrainer, R.Trainer, R.WorkRider, R.Veterinarian, R.Groom, R.HorseOwner],
        incidentReport: [R.Groom, R.WorkRider, R.Trainer, R.Veterinarian], incidentReroute: [R.ClubManager],
        careRead: [R.ClubManager, R.HeadTrainer, R.Trainer, R.WorkRider, R.Veterinarian, R.Groom, R.HorseOwner],
        careAssign: [R.ClubManager, R.Veterinarian], careRecord: [R.Groom], medicalWorkspace: [R.Veterinarian],
        medicalOverview: [R.Veterinarian, R.ClubManager, R.HeadTrainer, R.HorseOwner],
        measurementWrite: [R.ClubManager, R.Veterinarian, R.Groom],
        trainingMenu: [R.HorseOwner, R.ClubManager, R.HeadTrainer, R.Trainer, R.WorkRider],
        trainingRead: [R.HorseOwner, R.ClubManager, R.HeadTrainer, R.Trainer, R.WorkRider, R.Veterinarian],
    });
    for (const role of ALL_ROLES) assert.equal(can({ role }, 'careAssign'), [R.ClubManager,R.Veterinarian].includes(role));
    assert.equal(can({ role: R.ClubManager }, 'careRead'), true);
});

for (const role of ALL_ROLES) test(`${role} can see treatment care instructions and notes`, () => {
    const visibleTask = { ...task, type: 'Treatment', instructions: 'Chườm đá · 1 lần/ngày', notes: 'Ngựa ổn định sau chăm sóc' };
    globalThis.__careTest.data['/api/care/tasks'] = { items: [visibleTask], page: 1, pageSize: 20, total: 1 };
    const html = render(role);
    assert.deepEqual(globalThis.__careTest.redirects, []);
    assert.ok(html.includes(visibleTask.instructions));
    assert.ok(html.includes(visibleTask.notes));
    assert.ok(html.includes(msg(MSG.SUPPORT_INSTRUCTIONS)));
    assert.ok(html.includes(msg(MSG.GHI_CHU)));
});

test('FE07 HeadTrainer and Trainer remain care readers without assignment controls', () => {
    for (const role of [ROLES.HeadTrainer, ROLES.Trainer]) {
        const html = render(role);
        assertReader(html);
        assertNoAssignment(html);
    }
});

test('FE07 Manager direct training creation and medical write URLs are denied by real route guards', () => {
    for (const path of ['/training/plans/new', '/training/plans/plan-1/sessions/new', '/medical/examination', '/medical/treatment', '/medical/restrictions']) {
        render(ROLES.ClubManager, path);
        assert.equal(globalThis.__careTest.redirects.at(-1)?.to, '/permission-denied', path);
        assert.equal(globalThis.__careTest.forms.length, 0, path);
        assert.deepEqual(globalThis.__careTest.writes, []);
    }
});
