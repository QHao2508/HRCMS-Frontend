import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MSG, msg } from '../src/messages/index.js';
import { VI } from '../src/messages/vi.js';
import { ENUMS, getEnumLabel } from '../src/constants/enumLabels.js';
import { normalizeApiError } from '../src/services/apiError.js';
import { backendErrorMessage } from '../src/messages/backendErrors.js';
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir,entry.name)) : /\.(js|jsx)$/.test(entry.name) ? [path.join(dir,entry.name)] : []); }
test('all referenced message keys exist; catalog and key enum are frozen and complete', () => {
    assert.ok(Object.isFrozen(MSG)); assert.ok(Object.isFrozen(VI));
    assert.deepEqual(Object.keys(MSG).sort(), Object.keys(VI).sort());
    for (const file of files(fileURLToPath(new URL('../src', import.meta.url)))) {
        for (const match of fs.readFileSync(file, 'utf8').matchAll(/MSG\.(\w+)/g)) assert.ok(Object.hasOwn(VI,match[1]), file + ': ' + match[1]);
    }
    for (const [key, text] of Object.entries(VI)) {
        const parameters=Object.fromEntries([...text.matchAll(/\{(\w+)\}/g)].map(match=>[match[1],'kiểm tra']));
        assert.ok(msg(key,parameters));
        assert.doesNotMatch(text, /\b(Trainer|Rider|Manager|HeadTrainer|Groom|Planned|Active|Loading|optional|Please|Unknown)\b/);
    }
});
test('message interpolation handles arbitrary user values without recursively substituting them', () => {
    assert.equal(msg(MSG.SESSION_TITLE,{horse:'<b>{type}</b>',type:'Đi bộ'}), '<b>{type}</b> · Đi bộ');
    assert.throws(()=>msg('missing'));
    assert.throws(()=>msg(MSG.SESSION_TITLE,{horse:'Ngựa'}));
});
test('every shared domain enum has a Vietnamese display label without changing its API value', () => {
    for (const enumeration of Object.values(ENUMS)) {
        assert.ok(Object.isFrozen(enumeration));
        for (const [key,value] of Object.entries(enumeration)) {
            assert.equal(key,value);
            assert.notEqual(getEnumLabel(value),value);
            assert.notEqual(getEnumLabel(value),msg(MSG.CHUA_XAC_DINH));
        }
    }
    for (const value of ['__proto__','constructor','new-value',null]) assert.equal(getEnumLabel(value),msg(MSG.CHUA_XAC_DINH));
});
test('business API errors, dynamic password policy, blob errors and validation messages are translated', async () => {
    assert.match(backendErrorMessage('Password needs 12–128 characters including uppercase, lowercase and a digit.'), /12–128/);
    assert.match(backendErrorMessage('Email or username is already registered.'), /đã được đăng ký/);
    const error=await normalizeApiError({response:{status:409,data:new Blob([JSON.stringify({detail:'Record changed. Reload and retry.',traceId:'trace-1',errors:{name:['Invalid name.']}})])}});
    assert.equal(error.status,409);assert.equal(error.traceId,'trace-1');
    assert.match(error.message,/Dữ liệu đã thay đổi/);
    assert.match(error.validationErrors.name[0],/không hợp lệ/);
    const unknown=await normalizeApiError({response:{status:400,data:{detail:'Unrecognized English server details'}}});
    assert.doesNotMatch(unknown.message,/Unrecognized/);
    assert.equal(unknown.serverMessage,'Unrecognized English server details');
});
