import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
import { systemRegistrationCode, externalRegistrationNumber } from '../src/services/horseIdentifiers.js';
import { registrationForm, registrationPayload } from '../src/services/registrationValidation.js';
import { MSG, msg } from '../src/messages/index.js';

let server, Identifiers;
before(async () => {
    server = await createServer({ configFile: false, plugins: [ssrDependencies(), react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
    ({ default: Identifiers } = await server.ssrLoadModule('/src/components/HorseRegistrationIdentifiers.jsx'));
});
after(async () => { await server?.close(); });

test('profile displays the system code and document number with distinct labels', () => {
    const html = renderToStaticMarkup(h('dl', null, h(Identifiers, { horse: { systemRegistrationCode: 'HRC-000123', externalRegistrationNumber: '001/PAPER-A' } })));
    assert.ok(html.includes(`<dt>${msg(MSG.HORSE_SYSTEM_CODE)}</dt><dd>HRC-000123</dd>`));
    assert.ok(html.includes(`<dt>${msg(MSG.HORSE_EXTERNAL_CODE)}</dt><dd>001/PAPER-A</dd>`));
});

test('profile never substitutes the system code for a missing document number', () => {
    const html = renderToStaticMarkup(h(Identifiers, { horse: { registrationNumber: 'HRC-000123', externalRegistrationNumber: null } }));
    assert.ok(html.includes(msg(MSG.HORSE_EXTERNAL_MISSING)));
    assert.equal(html.match(/HRC-000123/g).length, 1);
});

test('code helpers honor canonical nulls and do not confuse document numbers or UUIDs with system codes', () => {
    assert.equal(systemRegistrationCode({ systemRegistrationCode: null, registrationNumber: 'legacy' }), '');
    assert.equal(systemRegistrationCode({ externalRegistrationNumber: 'PAPER', id: 'UUID', identifier: 'UUID' }), '');
    assert.equal(externalRegistrationNumber({ externalRegistrationNumber: null, registrationNumber: 'legacy' }), '');
    assert.equal(externalRegistrationNumber({ registrationNumber: 'OLD-PAPER' }), 'OLD-PAPER');
});

test('legacy drafts load into the new form and requests send only the document-number contract', () => {
    const form = registrationForm({ registrationNumber: '001/PAPER', systemRegistrationCode: 'HRC-123' });
    assert.equal(form.externalRegistrationNumber, '001/PAPER');
    const payload = registrationPayload(form);
    assert.equal(payload.externalRegistrationNumber, '001/PAPER');
    assert.equal(Object.hasOwn(payload, 'registrationNumber'), false);
    assert.equal(Object.hasOwn(payload, 'systemRegistrationCode'), false);
    assert.equal(registrationPayload({ externalRegistrationNumber: '', registrationNumber: 'OLD' }).externalRegistrationNumber, null);
});
