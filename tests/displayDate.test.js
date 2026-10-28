import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calendarDate, clubDateTime, clubDateTimeInput, clubInstant } from '../src/services/displayDate.js';
import { registrationFieldStep } from '../src/services/registrationFocus.js';

test('club date/time inputs do not depend on the workstation timezone or midnight boundary', () => {
    assert.equal(clubDateTimeInput('2026-10-27T18:30:00Z'),'2026-10-28T01:30');
    assert.equal(clubDateTimeInput('2026-10-28T17:00:00Z'),'2026-10-29T00:00');
    assert.equal(clubDateTimeInput('invalid'),'');
    assert.equal(new Date(clubInstant('2026-10-28T09:15')).toISOString(),'2026-10-28T02:15:00.000Z');
    assert.equal(clubInstant('2026-10-28T02:15:00Z'),'2026-10-28T02:15:00Z');
    assert.equal(clubInstant('2026-10-28T09:15:00+07:00'),'2026-10-28T09:15:00+07:00');
});

test('date-only values stay calendar dates; invalid display values have an honest fallback', () => {
    assert.equal(calendarDate('2026-10-28'),'28/10/2026');
    assert.equal(calendarDate(null),'—');
    assert.equal(clubDateTime('invalid'),'—');
    assert.match(clubDateTime('2026-10-28T02:15:00Z'),/09:15/);
});

test('registration errors navigate to identity, physical, health, boarding or staff steps', () => {
    for(const name of ['name','breed','gender','sire','dam','externalRegistrationNumber'])assert.equal(registrationFieldStep(name),0);
    assert.equal(registrationFieldStep('heightCm'),1);
    assert.equal(registrationFieldStep('declaredHealth'),2);
    assert.equal(registrationFieldStep('boardingEnd'),3);
    assert.equal(registrationFieldStep('preferredVeterinarianId'),3);
});
