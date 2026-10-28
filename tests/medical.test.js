import assert from 'node:assert/strict';
import { before, after, beforeEach, test } from 'node:test';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import { ALL_ROLES } from '../src/constants/roles.js';
let server, api, store, medical, AppRoutes, AuthContext;
let Field;
const reply = (config, data, status=200) => ({ config, data, status, statusText:'', headers:{} });
before(async()=>{
    server=await createServer({configFile:false,plugins:[ssrDependencies(),react()],server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',logLevel:'error'});
    ({default:api}=await server.ssrLoadModule('/src/services/api.js'));
    store=await server.ssrLoadModule('/src/services/sessionStore.js');
    medical=await server.ssrLoadModule('/src/services/medicalService.js');
    ({default:AppRoutes}=await server.ssrLoadModule('/src/routes/AppRoutes.jsx'));
    ({AuthContext}=await server.ssrLoadModule('/src/context/useAuth.js'));
    ({Field}=await server.ssrLoadModule('/src/components/WorkflowUI.jsx'));
});
after(async()=>server.close());
beforeEach(()=>{
    store.clearSession();store.setTokens({accessToken:'medical-test',refreshToken:'refresh-test',expiresIn:3600},store.getSession().generation);
    api.defaults.adapter=async()=>{throw new Error('Unexpected request');};
});
for(const role of [...ALL_ROLES,'Unknown'])test(`medical mutations are routed only to Veterinarian: ${role}`,()=>{
    for(const path of ['/medical','/medical/examination','/medical/injury','/medical/treatment','/medical/restrictions','/medical/follow-up']){
        const user={id:'vet-id',role,active:true,emailVerified:true};
        const html=renderToStaticMarkup(h(MemoryRouter,{initialEntries:[path]},h(AuthContext.Provider,{value:{user,isAuthenticated:true,loading:false}},h(AppRoutes))));
        assert.equal(html.includes('medical-app'),role==='Veterinarian');
    }
});
test('separate forms with the same field name keep distinct label targets', () => {
    const html = renderToStaticMarkup(h('div', null, h(Field, { name: 'status', label: 'Filter', value: '', onChange() {} }), h(Field, { name: 'status', label: 'Result', value: '', onChange() {} })));
    const ids = [...html.matchAll(/<input[^>]*\sid="([^"]+)"/g)].map(x => x[1]);
    assert.equal(ids.length, 2);
    assert.notEqual(ids[0], ids[1]);
    for (const id of ids) assert.ok(html.includes(`for="${id}"`));
});
const supportingRoutes = [
    ['/care/tasks', ['HorseOwner','ClubManager','HeadTrainer','Trainer','WorkRider','Groom','Veterinarian'], 'Công việc chăm sóc'],
    ['/care/incidents', ['HorseOwner','ClubManager','HeadTrainer','Groom','Trainer','Veterinarian','WorkRider'], 'Sự cố'],
    ['/care/stables', ['ClubManager','Groom'], 'Chuồng trại'],
    ['/inventory', ['ClubManager','Groom'], 'Kho vật tư'],
    ['/inventory/replenishments', ['ClubManager','Groom'], 'Yêu cầu bổ sung vật tư'],
    ['/reports', ALL_ROLES, 'Báo cáo hoạt động'],
    ['/medical/preventive-care', ALL_ROLES, 'Chăm sóc phòng ngừa'],
];
for (const [path, allowed, title] of supportingRoutes) test(`supporting route access matches backend roles: ${path}`, () => {
    for (const role of [...ALL_ROLES, 'Unknown']) {
        const user = { id: 'test-id', role, active: true, emailVerified: true };
        const html = renderToStaticMarkup(h(MemoryRouter, {initialEntries:[path]}, h(AuthContext.Provider, {value:{user,isAuthenticated:true,loading:false}},h(AppRoutes))));
        assert.equal(html.includes(`<h1>${title}</h1>`), allowed.includes(role), `${role}: ${path}`);
    }
});
for(const [name,suffix] of [['getMedicalRecords','records'],['getMedicalInjuries','injuries'],['getMedicalTreatments','treatments'],['getMedicalRestrictions','restrictions'],['getMedicalFollowUps','follow-ups']])test(`${name} preserves scoped paging and encodes horse ID`,async()=>{
    const page={items:[],page:2,pageSize:20,total:21};
    api.defaults.adapter=async config=>{assert.equal(config.url,`/api/horses/horse%2Fid/medical/${suffix}`);assert.deepEqual(config.params,{page:2,pageSize:20});return reply(config,page);};
    assert.deepEqual(await medical[name]('horse/id',{page:2,pageSize:20}),page);
});
for(const [name,suffix] of [['createMedicalRecord','records'],['createMedicalInjury','injuries'],['createMedicalTreatment','treatments'],['createMedicalRestriction','restrictions'],['createMedicalFollowUp','follow-ups']])test(`${name} submits exact payload with replay disabled`,async()=>{
    const data={notes:'clinical notes'};
    api.defaults.adapter=async config=>{assert.equal(config.url,`/api/horses/vet-horse/medical/${suffix}`);assert.equal(config.retryOnUnauthorized,false);assert.deepEqual(JSON.parse(config.data),data);return reply(config,{id:'record-id'});};
    assert.deepEqual(await medical[name]('vet-horse',data),{id:'record-id'});
});
test('correction preserves encoded record and horse scope',async()=>{
    api.defaults.adapter=async config=>{assert.equal(config.method,'put');assert.equal(config.url,'/api/horses/h%2Fx/medical/records/r%2Fx');assert.equal(config.retryOnUnauthorized,false);return reply(config,{id:'r/x'});};
    await medical.correctMedicalRecord('h/x','r/x',{diagnosis:'corrected'});
});
test('ambiguous medical writes never replay or permit another submission',async()=>{
    let calls=0;
    api.defaults.adapter=async config=>{calls++;throw new axios.AxiosError('network','ERR_NETWORK',config);};
    await assert.rejects(medical.createMedicalRecord('uncertain-horse',{}));
    await assert.rejects(medical.createMedicalRecord('uncertain-horse',{}));
    assert.equal(calls,1);
});
test('definitive validation errors allow correction',async()=>{
    let calls=0;
    api.defaults.adapter=async config=>{if(++calls===1)throw new axios.AxiosError('validation','ERR_BAD_RESPONSE',config,null,reply(config,{detail:'Invalid request.'},400));return reply(config,{id:'fixed'});};
    await assert.rejects(medical.createMedicalRecord('validation-horse',{}));
    assert.equal((await medical.createMedicalRecord('validation-horse',{})).id,'fixed');
});

test('medical tabs preserve the selected patient with URL encoding', async () => {
    const {default:MedicalLayout} = await server.ssrLoadModule('/src/components/medical/MedicalLayout.jsx');
    const html = renderToStaticMarkup(h(MemoryRouter,{initialEntries:['/medical/examination?horseId=horse%2Fid']},h(MedicalLayout,null,h('p',null,'Content'))));
    assert.ok(html.includes('/medical/treatment?horseId=horse%2Fid'));
    assert.ok(html.includes('/medical/follow-up?horseId=horse%2Fid'));
    assert.ok(html.includes('Các nghiệp vụ thú y'));
});
