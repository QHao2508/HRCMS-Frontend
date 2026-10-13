import test from 'node:test';
import assert from 'node:assert/strict';
import { followUpPayload, clearanceOptions, allMedicalPages } from '../src/services/medicalValidation.js';

const data = { records: [{ id: 'record', examinationAt: '2026-10-09T00:00:00Z' }], restrictions: [{ id: 'selected', validFrom: '2026-10-09T00:00:00Z', cleared: false }, { id: 'retained', validFrom: '2026-10-09T00:00:00Z', cleared: false }], injuries: [{ id: 'injury', injuryDate: '2026-10-11', status: 'Active' }], treatments: [{ id: 'treatment', startDate: '2026-10-11', completed: false }] };
const form = { previousRecordId: 'record', examinationAt: '2026-10-10T18:00:00Z', reason: ' reason ', symptoms: 'symptoms', findings: 'findings', diagnosis: 'diagnosis', healthStatus: 'Monitoring', outcome: ' outcome ', clearance: true, restrictionIds: ['selected'], injuryIds: [], treatmentIds: [] };
const now = new Date('2026-10-11T00:00:00Z');
test('partial clearance sends only explicit selections and allows monitoring', () => {
  const payload = followUpPayload(form, data, now);
  assert.deepEqual(payload.restrictionIds, ['selected']);
  assert.deepEqual(payload.injuryIds, []);
  assert.deepEqual(payload.treatmentIds, []);
  assert.equal(payload.examination.healthStatus, 'Monitoring');
  assert.equal(payload.examination.reason, 'reason');
});
test('clearance validates selection, scope, duplicates and examination dates', () => {
  assert.deepEqual(followUpPayload({ ...form, restrictionIds: [] }, data, now).restrictionIds, []);
  for (const change of [{ restrictionIds: ['other-horse'] }, { restrictionIds: ['selected', 'selected'] }, { examinationAt: '2026-10-08T00:00:00Z' }, { examinationAt: '2026-10-12T00:00:00Z' }]) assert.throws(() => followUpPayload({ ...form, ...change }, data, now));
  assert.deepEqual(followUpPayload({ ...form, clearance: false }, data, now).restrictionIds, []);
});
test('date-only eligibility uses the club timezone', () => {
  assert.equal(clearanceOptions(data, form.examinationAt).injuryIds.length, 1);
  assert.equal(clearanceOptions(data, '2026-10-10T16:00:00Z').injuryIds.length, 0);
});
test('medical lists load every page and reject incomplete responses', async () => {
  const requests = [];
  const result = await allMedicalPages(async ({ page, pageSize }) => { requests.push({ page, pageSize }); return { page, total: 101, items: page === 1 ? Array.from({ length: 100 }, (_, i) => i) : [100] }; });
  assert.equal(result.length, 101);
  assert.equal(requests.length, 2);
  await assert.rejects(allMedicalPages(async () => ({ page: 1, total: 1, items: [] })));
});
