import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
let server, form;
before(async () => {
    server = await createServer({ configFile: false, plugins: [ssrDependencies(), react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
    form = await server.ssrLoadModule('/src/pages/horses/assignmentRules.js');
});
after(async () => server.close());

test('manager assigns head trainer, groom and vet; head trainer only chooses trainers', () => {
    assert.deepEqual(form.assignableRoles({ role: 'ClubManager' }), ['HeadTrainer', 'Groom', 'Veterinarian']);
    assert.deepEqual(form.assignableRoles({ role: 'HeadTrainer' }), ['Trainer']);
});

test('staff options hide unqualified trainers and the current head trainer', () => {
    const head = { staffId: 'old-head', role: 'HeadTrainer', active: true };
    assert.equal(form.currentHeadTrainer({ assignments: [{ staffId: 'x', role: 'HeadTrainer', active: false }, head] }), head);
    assert.deepEqual(form.staffOptions([{ id: 'old-head', name: 'Old' }, { id: 'new-head', firstName: 'New', lastName: 'Head' }], 'HeadTrainer', head),
        [{ value: 'new-head', label: 'New Head' }]);
    assert.deepEqual(form.staffOptions([{ id: 'a', name: 'A', matches: true }, { id: 'b', name: 'B', matches: false }], 'Trainer', head),
        [{ value: 'a', label: 'A' }]);
});

test('request carries only the fields of the chosen role', () => {
    const base = { staffId: 's', startDate: '2026-10-28', endDate: '', notes: '', changeReason: '  Nghỉ dài hạn ', takeOverInProgress: true, takeOverReason: 'r', requiredTrainingType: 'Trot' };
    assert.deepEqual(form.assignmentRequest({ ...base, role: 'HeadTrainer' }, { replacingHead: true }), {
        staffId: 's', role: 'HeadTrainer', startDate: '2026-10-28', endDate: null, notes: '', requiredTrainingType: undefined,
        takeOverInProgress: false, takeOverReason: undefined, changeReason: 'Nghỉ dài hạn' });
    const trainer = form.assignmentRequest({ ...base, role: 'Trainer' }, { replacingHead: false });
    assert.equal(trainer.requiredTrainingType, 'Trot'); assert.equal(trainer.changeReason, undefined); assert.equal(trainer.takeOverInProgress, false);
    assert.equal(form.assignmentRequest({ ...base, role: 'Groom' }, { replacingHead: false }).takeOverReason, 'r');
});
