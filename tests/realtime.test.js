import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getRealtimeRevision, notifyRealtime, subscribeRealtime } from '../src/services/realtimeEvents.js';

test('realtime coalesces bursts, ignores duplicate event IDs and supports listener cleanup', async () => {
    const before = getRealtimeRevision();
    let calls = 0;
    const unsubscribe = subscribeRealtime(() => calls++);
    notifyRealtime({ eventId: 'event-1' });
    notifyRealtime({ eventId: 'event-1' });
    notifyRealtime({ eventId: 'event-2' });
    await new Promise(resolve => setTimeout(resolve, 350));
    assert.equal(getRealtimeRevision(), before + 1);
    assert.equal(calls, 1);
    notifyRealtime({ eventId: 'event-1' });
    await new Promise(resolve => setTimeout(resolve, 350));
    assert.equal(calls, 1);
    unsubscribe();
    notifyRealtime();
    await new Promise(resolve => setTimeout(resolve, 350));
    assert.equal(calls, 1);
    assert.equal(getRealtimeRevision(), before + 2);
});
