import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
import { trainerEligibility, canAssignTrainer } from '../src/services/templateCurriculum.js';
import { MSG, msg } from '../src/messages/index.js';
const template = { id: 'fixture', name: 'Fixture', requiredTrainingTypesJson: '["Walk","Trot"]', minimumExpertiseLevel: 2 };
const candidate = { id: 'trainer', name: 'Fixture Trainer', matches: true, assigned: false, eligibility: 'Eligible', specialties: [{ trainingType: 'Walk', level: 2 }, { trainingType: 'Trot', level: 3 }] };
let server, Assignment, Specialties, AuthContext, api, assignTemplate;
before(async () => {
    server = await createServer({ configFile: false, plugins: [ssrDependencies(), {
        name: 's3-resource-fixture', enforce: 'pre',
        load(id) {
            if (id.replaceAll('\\', '/').endsWith('/src/context/useRegistrationResource.js')) return `export function useRegistrationResource(){return {data:globalThis.__s3Candidates,loading:false,error:null,reload(){}}}`;
        },
    }, react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
    ({ default: Assignment } = await server.ssrLoadModule('/src/components/TemplateTrainerAssignment.jsx'));
    ({ TrainerSpecialties: Specialties } = await server.ssrLoadModule('/src/components/TrainerCandidates.jsx'));
    ({ AuthContext } = await server.ssrLoadModule('/src/context/useAuth.js'));
    ({ default: api } = await server.ssrLoadModule('/src/services/api.js'));
    ({ assignTemplate } = await server.ssrLoadModule('/src/services/trainingService.js'));
});
after(async () => { await server?.close(); delete globalThis.__s3Candidates; });
const render = (component, role = 'HeadTrainer') => renderToStaticMarkup(h(AuthContext.Provider, { value: { user: { role } } }, component));
test('S3 eligibility uses each current server contract status', () => {
    for (const eligibility of ['Eligible', 'MissingSpecialty', 'BelowMinimumLevel', 'RequirementsMissing']) {
        assert.equal(trainerEligibility(template, { ...candidate, eligibility }), eligibility);
        assert.equal(canAssignTrainer(template, { ...candidate, eligibility }), eligibility === 'Eligible');
    }
});
test('S3 assignment remains independent of eligibility, including an assigned now-ineligible trainer', () => {
    for (const eligibility of ['Eligible', 'BelowMinimumLevel']) {
        const assigned = { ...candidate, assigned: true, eligibility };
        assert.equal(trainerEligibility(template, assigned), eligibility);
        assert.equal(canAssignTrainer(template, assigned), false);
        assert.equal(assigned.assigned, true);
    }
});
test('S3 missing template configuration cannot become below-level or assignable', () => {
    for (const invalid of [{ ...template, requiredTrainingTypesJson: '[]' }, { ...template, requiredTrainingTypesJson: 'invalid' }, { ...template, minimumExpertiseLevel: 0 }]) {
        assert.equal(trainerEligibility(invalid, candidate), 'RequirementsMissing');
        assert.equal(canAssignTrainer(invalid, candidate), false);
    }
});
test('S3 fallback checks actual specialties and levels and unknown states fail closed', () => {
    assert.equal(trainerEligibility(template, { ...candidate, eligibility: undefined, specialties: [] }), 'MissingSpecialty');
    assert.equal(trainerEligibility(template, { ...candidate, eligibility: undefined, specialties: [{ trainingType: 'Walk', level: 1 }, { trainingType: 'Trot', level: 2 }] }), 'BelowMinimumLevel');
    assert.equal(canAssignTrainer(template, { ...candidate, eligibility: 'NewServerState' }), false);
    assert.equal(canAssignTrainer(template, { ...candidate, matches: false }), false);
    assert.equal(canAssignTrainer(template, undefined), false);
});
test('S3 specialties display exact three API levels and an unconfigured profile', () => {
    const html = render(h(Specialties, { specialties: [{ trainingType: 'Walk', level: 1 }, { trainingType: 'Trot', level: 2 }, { trainingType: 'Canter', level: 3 }] }));
    for (const level of [1, 2, 3]) assert.ok(html.includes(msg(MSG['SCHED_LEVEL_' + level])));
    assert.ok(render(h(Specialties, { specialties: [] })).includes(msg(MSG.SCHED_NOT_CONFIRMED)));
});
test('S3 required specialties distinguish missing and below-level with text', () => {
    const html = render(h(Specialties, { specialties: [{ trainingType: 'Walk', level: 1 }], required: ['Walk', 'Trot'], minimum: 2 }));
    assert.ok(html.includes(msg(MSG.CURRIC_SKILL_MISSING)));
    assert.ok(html.includes(msg(MSG.CURRIC_REQUIRED_LEVEL, { level: msg(MSG.SCHED_LEVEL_2) })));
});
test('S3 assignment has separate eligibility/assignment columns, precise placeholder and locked initial CTA', () => {
    globalThis.__s3Candidates = [candidate, { ...candidate, id: 'assigned', assigned: true, matches: false, eligibility: 'BelowMinimumLevel' }];
    const html = render(h(Assignment, { template }));
    for (const key of [MSG.CURRIC_SELECT_TRAINER, MSG.CURRIC_ELIGIBILITY, MSG.CURRIC_ASSIGNMENT_STATUS, MSG.CURRIC_ASSIGNED, MSG.CURRIC_NOT_ASSIGNED, MSG.CURRIC_BELOW_LEVEL]) assert.ok(html.includes(msg(key)));
    assert.match(html, /<button class="btn btn-primary" disabled="">/);
    assert.equal(msg(MSG.CURRIC_SELECT_TRAINER), 'Chọn huấn luyện viên');
    assert.notEqual(msg(MSG.CURRIC_SELECT), msg(MSG.CURRIC_SELECT_TRAINER));
});
test('S3 ClubManager has no assignment or revoke action, including direct component rendering', () => {
    globalThis.__s3Candidates = [{ ...candidate, assigned: true }];
    const html = render(h(Assignment, { template }), 'ClubManager');
    assert.doesNotMatch(html, /<button class="btn btn-primary"/);
    assert.doesNotMatch(html, /btn-outline-danger/);
});
test('S3 requirements missing displays the configuration warning', () => {
    globalThis.__s3Candidates = [candidate];
    const html = render(h(Assignment, { template: { ...template, requiredTrainingTypesJson: '[]' } }));
    assert.ok(html.includes(msg(MSG.CURRIC_REQUIREMENTS_MISSING)));
    assert.doesNotMatch(html, new RegExp(msg(MSG.CURRIC_BELOW_LEVEL)));
});
test('S3 assign and revoke retain exact existing endpoint and body contract', async () => {
    const requests = [];
    api.defaults.adapter = async config => { requests.push({ method: config.method, url: config.url, data: JSON.parse(config.data) }); return { config, data: {}, status: 200, statusText: 'OK', headers: {} }; };
    await assignTemplate('fixture', 'trainer', true); await assignTemplate('fixture', 'trainer', false);
    assert.deepEqual(requests, [true, false].map(assigned => ({ method: 'post', url: '/api/training/templates/fixture/assign', data: { trainerId: 'trainer', assigned } })));
});
