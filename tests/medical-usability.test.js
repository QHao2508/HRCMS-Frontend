import assert from 'node:assert/strict';
import { test, before, after } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
import { treatmentFrequency } from '../src/services/treatmentFrequency.js';
import { medicalOptions } from '../src/services/medicalOptions.js';

let server, Choice;
before(async () => {
    server = await createServer({ configFile: false, plugins: [ssrDependencies(), react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
    ({ default: Choice } = await server.ssrLoadModule('/src/components/medical/MedicalChoiceField.jsx'));
});
after(async () => { await server?.close(); });

test('examination choices visibly check selected options without hidden inputs or low-contrast buttons', () => {
    const chosen = medicalOptions('symptoms')[0];
    const html = renderToStaticMarkup(h(Choice, { field: 'symptoms', label: 'Triệu chứng', value: chosen, onChange() {} }));
    assert.ok(html.includes('medical-choice-grid'));
    assert.ok(html.includes('medical-choice-option is-selected'));
    assert.match(html, /type="checkbox"[^>]*checked/);
    assert.doesNotMatch(html, /visually-hidden|btn-primary/);
});

test('numeric frequencies gain the times-per-day unit once and custom schedules stay unchanged', () => {
    for (const [value, expected] of [['1', '1 lần/ngày'], [' 2 ', '2 lần/ngày'], ['3/ngày', '3 lần/ngày'], ['1 lần/ngày', '1 lần/ngày'], ['2 lần/tuần', '2 lần/tuần'], ['', '']]) {
        assert.equal(treatmentFrequency(value), expected);
        assert.equal(treatmentFrequency(treatmentFrequency(value)), expected);
    }
});
