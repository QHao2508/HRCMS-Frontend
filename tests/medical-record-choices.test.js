import { currentMedicalRecords, previousMedicalRecordVersions } from '../src/services/medicalRecordVersions.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { medicalRecordChoices } from '../src/services/medicalRecordChoices.js';

test('distinct records with identical date and diagnosis keep distinct selectable labels', () => {
    const common = { examinationAt: '2026-10-11T09:00:00Z', diagnosis: 'Giống nhau' };
    const choices = medicalRecordChoices([{ ...common, id: 'first' }, { ...common, id: 'second' }]);
    assert.equal(choices.length, 2);
    assert.notEqual(choices[0].label, choices[1].label);
    assert.equal(choices[0].value, 'first');
    assert.equal(choices[1].value, 'second');
    assert.match(choices[0].examinedAt, /16:00:00/);
    assert.ok(!choices[0].label.includes('first'));
});

test('repeated API entries with the same ID do not duplicate options', () => {
    const record = { id: 'same', examinationAt: '2026-10-11T09:00:00Z', reason: 'Kiểm tra' };
    assert.equal(medicalRecordChoices([record, record]).length, 1);
    assert.deepEqual(medicalRecordChoices([]), []);
});
test('status corrections are one examination with only the latest record selectable', () => {
    const original = { id: 'original', horseId: 'horse', examinationAt: '2026-10-11T09:00:00Z', healthStatus: 'Monitoring' };
    const corrected = { ...original, id: 'corrected', supersedesRecordId: 'original', healthStatus: 'Fit' };
    const records = [corrected, original];
    assert.deepEqual(currentMedicalRecords(records), [corrected]);
    assert.deepEqual(medicalRecordChoices(records).map(choice => choice.value), ['corrected']);
    assert.deepEqual(previousMedicalRecordVersions(corrected, records), [original]);
});

test('multiple corrections retain ordered history without merging independent examinations', () => {
    const original = { id: 'original' };
    const second = { id: 'second', supersedesRecordId: 'original' };
    const third = { id: 'third', supersedesRecordId: 'second' };
    const separate = { id: 'separate' };
    const records = [third, second, separate, original];
    assert.deepEqual(currentMedicalRecords(records), [third, separate]);
    assert.deepEqual(previousMedicalRecordVersions(third, records), [second, original]);
});
