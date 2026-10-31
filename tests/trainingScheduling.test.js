import assert from 'node:assert/strict';
import { before, after, beforeEach, test } from 'node:test';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
import { isInFreeRange, minuteText, toMinute } from '../src/services/trainingSchedulingHelpers.js';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
let server, api, store, service, AvailabilityResource, TrainerCandidates;
before(async () => {
    server = await createServer({ configFile: false, plugins: [ssrDependencies(), react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
    ({ default: api } = await server.ssrLoadModule('/src/services/api.js'));
    store = await server.ssrLoadModule('/src/services/sessionStore.js');
    service = await server.ssrLoadModule('/src/services/trainingSchedulingService.js');
    ({ AvailabilityResource } = await server.ssrLoadModule('/src/components/TrainingAvailability.jsx'));
    ({ default: TrainerCandidates } = await server.ssrLoadModule('/src/components/TrainerCandidates.jsx'));
});
after(async () => server.close());
beforeEach(() => { store.clearSession(); store.setTokens({ accessToken: 'test', refreshToken: 'test', expiresIn: 3600 }, store.getSession().generation); });
const reply = (config, data) => ({ config, data, status: 200, statusText: '', headers: {} });
test('availability lookup preserves duration, resource scope, training constraints and edit exclusion', async () => {
    const params = { horseId: 'horse-id', date: '2026-10-20', durationMinutes: 60, trainingType: 'Trot', intensity: 'Light', distanceMetres: 1000, riderId: 'rider-id', exceptSessionId: 'session-id' };
    api.defaults.adapter = async config => { assert.equal(config.method, 'get'); assert.equal(config.url, '/api/training/availability'); assert.deepEqual(config.params, params); return reply(config, { commonFree: [] }); };
    assert.deepEqual(await service.getTrainingAvailability(params), { commonFree: [] });
});
test('manager profile changes encode identifiers and disable write replay', async () => {
    const data = { specialties: [{ trainingType: 'Trot', level: 3 }], workingHours: [{ dayOfWeek: 'Monday', startMinute: 360, endMinute: 1080 }], timeOff: [] };
    api.defaults.adapter = async config => { assert.equal(config.method, 'put'); assert.equal(config.url, '/api/staff/staff%2Fid/training-profile'); assert.equal(config.retryOnUnauthorized, false); assert.deepEqual(JSON.parse(config.data), data); return reply(config, data); };
    assert.deepEqual(await service.saveTrainingProfile('staff/id', data), data);
});
test('a full session must fit a common half-open interval in Vietnam time', () => {
    const ranges = [{ start: '2026-10-20T01:00:00Z', end: '2026-10-20T03:00:00Z' }];
    assert.equal(isInFreeRange('2026-10-20T08:00', 60, ranges), true);
    assert.equal(isInFreeRange('2026-10-20T09:00', 60, ranges), true);
    assert.equal(isInFreeRange('2026-10-20T09:01', 60, ranges), false);
    assert.equal(isInFreeRange('2026-10-20T07:59', 60, ranges), false);
    assert.equal(isInFreeRange('2026-10-20T08:00', '', ranges), false);
    assert.equal(isInFreeRange('2026-10-20T08:00', 0.5, ranges), false);
    assert.equal(isInFreeRange('2026-10-20T08:00', 60, []), false);
});
test('missing hours and missing duration have explicit states rather than invented free ranges', () => {
    const html = renderToStaticMarkup(h(AvailabilityResource, { resource: { name: 'Staff', state: 'HoursMissing', free: [], busy: [] }, label: 'Schedule', timeZone: 'Asia/Ho_Chi_Minh' }));
    assert.match(html, /Chưa khai báo ca làm việc/); assert.doesNotMatch(html, /availability-ranges/);
    const unknown = renderToStaticMarkup(h(AvailabilityResource, { resource: { name: 'Horse', state: 'Unknown', free: [], busy: [{ start: '2026-10-20T01:00:00Z', end: '2026-10-20T03:00:00Z', reason: 'duration_unknown' }] }, label: 'Schedule', timeZone: 'Asia/Ho_Chi_Minh' }));
    assert.match(unknown, /Buổi tập chưa có thời lượng/);
});
test('candidate display distinguishes verified specialization, workload and unconfirmed profiles', () => {
    const html = renderToStaticMarkup(h(TrainerCandidates, { selectedId: 'qualified', candidates: [{ id: 'qualified', name: 'Qualified Staff', matches: true, specialties: [{ trainingType: 'Trot', level: 3 }], assignedHorses: 2 }, { id: 'unknown', name: 'Unknown Staff', matches: false, specialties: [], assignedHorses: 0 }, { id: 'template', name: 'Template Staff', matches: false, specialties: [{ trainingType: 'Walk', level: 3 }], assignedHorses: 0, issues: [{ messageKey: 'TrainerNotQualifiedForTemplate', args: ['Canter đều'] }] }], onSelect: () => {} }));
    assert.match(html, /giáo án “Canter đều”/); assert.doesNotMatch(html, /Chọn người này/); // người phù hợp duy nhất đã được chọn
    assert.match(html, /Chuyên sâu/); assert.match(html, /Chưa xác nhận/); assert.match(html, /Đang phụ trách 2 ngựa/); assert.match(html, /candidate-card is-match is-selected/); assert.match(html, /Đang chọn người này/);
});
test('working hour fields preserve minute precision', () => { assert.equal(toMinute('06:30'), 390); assert.equal(minuteText(390), '06:30'); assert.equal(minuteText(1080), '18:00'); });
test('system skip notes are shown in Vietnamese while user text is kept', async () => {
    const { noteText } = await server.ssrLoadModule('/src/utils/noteText.js');
    assert.equal(noteText('Skipped: doi giao an'), 'Lý do bỏ qua: doi giao an');
    assert.equal(noteText('Ngựa mệt\nSkipped: HorseArchived'), 'Ngựa mệt\nLý do bỏ qua: Ngựa đã ngừng hoạt động');
    assert.equal(noteText('Không có gì'), 'Không có gì'); assert.equal(noteText(null), null);
});
