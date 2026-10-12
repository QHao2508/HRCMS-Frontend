import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activeTreatmentPlans, canUploadIncidentPhoto, horseRegistrationCode } from '../src/services/careUi.js';

test('horse without a registration number does not display its internal UUID', () => {
    assert.equal(horseRegistrationCode({ id: 'e860828e-3ce7-4925-9a3d-28780188630b', name: 'BubuChacha' }), '');
    assert.equal(horseRegistrationCode({ id: 'internal', registrationNumber: 'H-104' }), 'H-104');
    assert.equal(horseRegistrationCode({ registrationNumber: '', registrationNo: 'H-105' }), 'H-105');
});

test('care treatment choices exclude completed and malformed plans', () => {
    const active = { id: 'active', completed: false };
    assert.deepEqual(activeTreatmentPlans([active, { id: 'closed', completed: true }, { id: 'missing-status' }]), [active]);
    assert.deepEqual(activeTreatmentPlans([]), []);
});

test('incident photos require the reporter and an unresolved incident', () => {
    const incident = { reporterId: 'reporter', resolved: false };
    assert.equal(canUploadIncidentPhoto(incident, { id: 'reporter' }), true);
    assert.equal(canUploadIncidentPhoto(incident, { id: 'vet' }), false);
    assert.equal(canUploadIncidentPhoto({ ...incident, resolved: true }, { id: 'reporter' }), false);
    assert.equal(canUploadIncidentPhoto(incident, null), false);
    assert.equal(canUploadIncidentPhoto({}, {}), false);
});