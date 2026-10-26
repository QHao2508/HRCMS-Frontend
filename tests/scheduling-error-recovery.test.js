import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeApiError } from '../src/services/apiError.js';
import { isUncertainMutationError } from '../src/services/mutationOutcome.js';
import { sessionPlanLimits } from '../src/services/trainingSchedulingHelpers.js';
test('shift rejection preserves its canonical code and permits correction', async () => {
    const error = await normalizeApiError({ response: { status: 409, data: {
        type: 'urn:horseclub:error:outside_working_hours', title: 'outside_working_hours',
        detail: 'The session falls outside staff working hours.', messageKey: 'StaffOutsideWorkingHours', args: [],
    } } });
    assert.equal(error.businessCode, 'outside_working_hours');
    assert.equal(isUncertainMutationError(error), false);
    assert.match(error.message, /ca làm việc/);
});
test('ambiguous failures and permission failures still require reconciliation', () => {
    for (const error of [{ status: null }, { status: 500 }, { status: 403 }, { status: 404 },
        { status: 409, businessCode: 'transaction_conflict' }, { status: 409 }]) {
        assert.equal(isUncertainMutationError(error), true);
    }
});
test('only canonical scheduling rejections are recoverable', async () => {
    for (const code of ['staff_time_off', 'trainer_schedule_overlap', 'schedule_overlap', 'trainer_specialty_mismatch']) {
        assert.equal(isUncertainMutationError({ status: 409, businessCode: code }), false);
    }
    const error = await normalizeApiError({ response: { status: 409, data: { title: 'outside_working_hours' } } });
    assert.equal(error.businessCode, null);
    assert.equal(isUncertainMutationError(error), true);
});
test('future days follow plan bounds, not today', () => {
    assert.deepEqual(sessionPlanLimits('2026-10-13', '2026-10-30'), {
        min: '2026-10-13T00:00', max: '2026-10-30T23:59',
    });
    assert.deepEqual(sessionPlanLimits('2026-10-13', '2026-10-13'), {
        min: '2026-10-13T00:00', max: '2026-10-13T23:59',
    });
});