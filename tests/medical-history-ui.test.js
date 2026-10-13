import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { ssrDependencies } from './ssrDependencies.js';
let server, Component, api, service, store;
const fixturePlugin = {
 name:'medical-history-fixture', enforce:'pre',
 load(id) {
  const path=id.replaceAll('\\','/');
  if(path.endsWith('/src/context/useRegistrationResource.js')) return 'export function useRegistrationResource(){return {data:globalThis.__medicalHistoryFixture,loading:false,error:null,reload(){}};}';
  if(path.endsWith('/src/context/useMutation.js')) return 'export function useMutation(){return {pending:false,uncertain:false,run:async(action,success)=>{await action();success?.();}};}';
 }
};
before(async()=>{
 server=await createServer({configFile:false,plugins:[ssrDependencies(),fixturePlugin,react()],server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',logLevel:'error'});
 ({default:Component}=await server.ssrLoadModule('/src/components/medical/MedicalCaseDetails.jsx'));
 ({default:api}=await server.ssrLoadModule('/src/services/api.js'));
 service=await server.ssrLoadModule('/src/services/medicalService.js');
 store=await server.ssrLoadModule('/src/services/sessionStore.js');
});
after(async()=>{delete globalThis.__medicalHistoryFixture; await server.close();});

test('real history component renders every clinical visit and a separate duplicate-merge form',()=>{
 const record={id:'a',reason:'Đau chân',diagnosis:'Viêm gân',examinationAt:'2026-10-01T00:00:00Z'};
 globalThis.__medicalHistoryFixture={id:'a',recordIds:['a'],visits:[
  {id:'initial',kind:'Examination',examination:{...record,symptoms:'Sưng lần đầu',findings:'Kết quả đầu',healthStatus:'Monitoring',notes:'Ghi chú đầu'}},
  {id:'review',kind:'FollowUp',examination:{...record,symptoms:'Giảm sưng',findings:'Kết quả tái khám',healthStatus:'Monitoring',notes:'Ghi chú tái khám'},outcome:'Tiếp tục theo dõi',clearance:false},
  {id:'last',kind:'FollowUp',examination:{...record,symptoms:'Hết sưng',findings:'Đã hồi phục',healthStatus:'Fit',notes:'Kết thúc'},outcome:'Kết luận khỏi',clearance:true},
 ]};
 const cases=[{id:'a',ids:new Set(['a']),record,resolved:false},{id:'b',ids:new Set(['b']),record:{...record,id:'b'},resolved:false}];
 const markup=renderToStaticMarkup(createElement(Component,{horseId:'horse',recordId:'a',cases,onMerged(){}}));
 for(const text of ['Sưng lần đầu','Giảm sưng','Hết sưng','Ghi chú đầu','Ghi chú tái khám','Kết luận khỏi','Gộp hồ sơ của cùng một ca bệnh']) assert.ok(markup.includes(text),text);
 assert.equal((markup.match(/class="medical-case-visit"/g)||[]).length,3);
 assert.match(markup,/type="checkbox"/);
 assert.ok(markup.indexOf('Sưng lần đầu') < markup.indexOf('Giảm sưng'));
});

test('history and explicit merge use encoded case identifiers and do not replay writes',async()=>{
 store.clearSession(); store.setTokens({accessToken:'fixture',refreshToken:'fixture',expiresIn:3600},store.getSession().generation);
 const request={recordIds:['duplicate'],reason:'Same episode'};
 let calls=0;
 api.defaults.adapter=async config=>{
  calls++;
  assert.ok(config.url.startsWith('/api/horses/horse%2Fid/medical/records/case%2Fid/'));
  if(config.method==='post'){assert.ok(config.url.endsWith('/merge'));assert.equal(config.retryOnUnauthorized,false);assert.deepEqual(JSON.parse(config.data),request);}
  else {assert.equal(config.method,'get');assert.ok(config.url.endsWith('/history'));}
  return {config,data:{id:'merged'},status:200,statusText:'OK',headers:{}};
 };
 await service.getMedicalCaseHistory('horse/id','case/id');
 await service.mergeMedicalCases('horse/id','case/id',request);
 assert.equal(calls,2);
});