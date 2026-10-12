import test from 'node:test';
import assert from 'node:assert/strict';
import { careTaskText } from '../src/services/careVisibility.js';

test('Manager and Owner never display clinical care text, including unexpected API values', () => {
    for (const type of ['Treatment', 'IceBath']) {
        const row = { type, instructions: 'private instructions', notes: 'private notes' };
        for (const role of ['ClubManager', 'HorseOwner']) {
            assert.equal(careTaskText(row, role, 'instructions'), null);
            assert.equal(careTaskText(row, role, 'notes'), null);
        }
        for (const role of ['Groom', 'Veterinarian']) {
            assert.equal(careTaskText(row, role, 'instructions'), row.instructions);
            assert.equal(careTaskText(row, role, 'notes'), row.notes);
        }
    }
});

test('ordinary care text follows the response DTO for every permitted role', () => {
    const row = { type: 'Feeding', instructions: 'Feed at noon', notes: null };
    for (const role of ['ClubManager', 'HorseOwner', 'Groom', 'Veterinarian']) {
        assert.equal(careTaskText(row, role, 'instructions'), row.instructions);
        assert.equal(careTaskText(row, role, 'notes'), null);
    }
});
