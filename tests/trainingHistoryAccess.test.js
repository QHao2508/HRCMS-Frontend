import assert from 'node:assert/strict';
import { test } from 'node:test';
import { trainingHorse } from '../src/services/trainingHistoryAccess.js';
import { isAssigned } from '../src/services/workflowHelpers.js';

const detail = { horseName: 'Thunder', horseArchived: false };
const denied = status => Object.assign(new Error('Denied'), { status });

test('current horse assignments remain available to the assigned trainer', async () => {
    const horse = { horse: { id: 'horse', name: 'Thunder', archived: false }, assignments: [{ active: true, staffId: 'trainer', role: 'Trainer' }] };
    assert.equal(await trainingHorse(async () => horse, 'horse', detail), horse);
    assert.equal(isAssigned(horse, { id: 'trainer', role: 'Trainer' }, 'Trainer'), true);
});
test('authorized training history survives profile 403 without acquiring write scope', async () => {
    const horse = await trainingHorse(async () => { throw denied(403); }, 'horse', detail);
    assert.equal(horse.horse.name, 'Thunder');
    assert.deepEqual(horse.assignments, []);
    assert.equal(horse.historyOnly, true);
    assert.equal(Boolean(isAssigned(horse, { id: 'trainer', role: 'Trainer' }, 'Trainer')), false);
});
test('archived history is read-only even if legacy assignment data is still active', async () => {
    const error = Object.assign(denied(409), { response: { data: { title: 'horse_archived' } } });
    const horse = await trainingHorse(async () => { throw error; }, 'horse', { ...detail, horseArchived: true });
    assert.equal(horse.horse.archived, true);
    horse.assignments = [{ active: true, staffId: 'trainer', role: 'Trainer' }];
    assert.equal(Boolean(isAssigned(horse, { id: 'trainer', role: 'Trainer' }, 'Trainer')), false);
});
test('authentication, not-found, conflicts and server/network failures remain visible', async () => {
    for (const status of [401, 404, 409, 500, null]) {
        const error = denied(status);
        await assert.rejects(trainingHorse(async () => { throw error; }, 'horse', detail), candidate => candidate === error);
    }
});
test('a profile denial cannot invent a horse identity when training metadata is absent', async () => {
    const error = denied(403);
    await assert.rejects(trainingHorse(async () => { throw error; }, 'horse', {}), candidate => candidate === error);
});