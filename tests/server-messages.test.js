import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERVER_MESSAGES, serverMessage } from '../src/messages/serverMessages.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const contractPath = path.join(here, '../src/messages/server-message-keys.json');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8')).keys;

test('every backend message key has exactly one Vietnamese translation', () => {
    assert.deepEqual(Object.keys(SERVER_MESSAGES).sort(), Object.keys(contract).sort());
    for (const [key, text] of Object.entries(SERVER_MESSAGES)) {
        assert.ok(text.trim(), key);
        const used = [...text.matchAll(/\{(\d+)\}/g)].map(m => Number(m[1]));
        assert.ok(used.every(index => index < contract[key]), `${key} dùng tham số không có trong hợp đồng`);
        assert.doesNotMatch(text, /\{[a-zA-Z_]\w*\}/, `${key} phải dùng tham số theo vị trí {0}`);
    }
});

test('frontend contract copy matches the backend contract when both repositories are present', (t) => {
    const backend = process.env.HRCMS_BACKEND_DIR || path.join(here, '../../../HorseClub');
    const backendContract = path.join(backend, 'docs/contracts/server-message-keys.json');
    if (!fs.existsSync(backendContract)) return t.skip('Không tìm thấy repo Backend để so sánh');
    assert.deepEqual(JSON.parse(fs.readFileSync(backendContract, 'utf8')), JSON.parse(fs.readFileSync(contractPath, 'utf8')),
        'Chép docs/contracts/server-message-keys.json từ Backend sang src/messages/ rồi bổ sung bản dịch');
});

test('arguments are positional, role names are localized and missing values stay empty', () => {
    assert.match(serverMessage('UploadOneFileUpToBytes', ['1024']), /1024/);
    assert.doesNotMatch(serverMessage('StaffMustBeAnActive', []), /\{0\}/);
    assert.equal(serverMessage(undefined, [], 'x'), 'x');
    assert.equal(serverMessage('__proto__', [], 'x'), 'x');
});
