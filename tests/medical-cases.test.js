import assert from 'node:assert/strict';
import { test } from 'node:test';
import { medicalCases } from '../src/services/medicalCases.js';
import { medicalRecordChoices } from '../src/services/medicalRecordChoices.js';

test('explicit merged cases include independent originals, corrections and legacy follow-ups', () => {
 const records = [
  {id:'a',caseRootId:'a',examinationAt:'2026-10-01T00:00:00Z'},
  {id:'b',caseRootId:'a',examinationAt:'2026-10-02T00:00:00Z'},
  {id:'c',supersedesRecordId:'b',caseRootId:'a',examinationAt:'2026-10-02T00:00:00Z'},
  {id:'d',examinationAt:'2026-10-03T00:00:00Z'},
  {id:'separate',examinationAt:'2026-10-04T00:00:00Z'},
 ];
 const followUps=[{previousRecordId:'c',currentRecordId:'d',clearance:false}];
 const groups=medicalCases(records,followUps);
 assert.equal(groups.length,2);
 assert.deepEqual([...groups.find(x=>x.id==='d').ids].sort(),['a','b','c','d']);
 assert.deepEqual(medicalRecordChoices(records,followUps).map(x=>x.value),['separate','d']);
 assert.equal(medicalRecordChoices(records,[...followUps,{previousRecordId:'d',currentRecordId:'d',clearance:true}],{openOnly:true}).length,1);
});

test('same diagnosis in independent episodes is never silently merged', () => {
 assert.equal(medicalCases([{id:'a',diagnosis:'Colic'},{id:'b',diagnosis:'Colic'}]).length,2);
});

test('equal assessment dates select the latest recorded version after merging', () => {
 const common={caseRootId:'root',examinationAt:'2026-10-01T00:00:00Z'};
 const cases=medicalCases([{...common,id:'new',createdAt:'2026-10-02T00:00:00Z'},{...common,id:'old',createdAt:'2026-10-01T00:00:00Z'}]);
 assert.equal(cases.length,1); assert.equal(cases[0].id,'new');
});