import assert from "node:assert/strict";
import { after,before,beforeEach,test } from "node:test";
import axios from "axios";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { ALL_ROLES } from "../src/constants/roles.js";
import { sessionPayload } from "../src/services/trainingPayload.js";
import { isAssigned,localDateTime } from "../src/services/workflowHelpers.js";
let server,api,store,club,training,AuthContext,AppRoutes;
const reply=(config,data,status=200)=>({config,data,status,statusText:"",headers:{}});
before(async()=>{
    server=await createServer({configFile:false,plugins:[react()],server:{middlewareMode:true,hmr:false,ws:false},appType:"custom",logLevel:"error"});
    ({default:api}=await server.ssrLoadModule('/src/services/api.js'));
    store=await server.ssrLoadModule('/src/services/sessionStore.js');
    club=await server.ssrLoadModule('/src/services/clubService.js');
    training=await server.ssrLoadModule('/src/services/trainingService.js');
    ({AuthContext}=await server.ssrLoadModule('/src/context/useAuth.js'));
    ({default:AppRoutes}=await server.ssrLoadModule('/src/routes/AppRoutes.jsx'));
});
beforeEach(()=>{store.clearSession();store.setTokens({accessToken:'demo-access',refreshToken:'demo-refresh',expiresIn:3600},store.getSession().generation);api.defaults.adapter=async()=>{throw new Error('Unexpected request');};});
after(async()=>server.close());
test('Manager review preserves the registration/horseId response and sends Bearer',async()=>{
    api.defaults.adapter=async config=>{assert.equal(config.url,'/api/registrations/record/review');assert.equal(config.headers.get('Authorization'),'Bearer demo-access');assert.deepEqual(JSON.parse(config.data),{approve:false,reason:'Correct breed'});return reply(config,{registration:{id:'record',status:'RevisionRequired'},horseId:null});};
    const data=await club.reviewRegistration('record',{approve:false,reason:'Correct breed'});assert.equal(data.registration.status,'RevisionRequired');assert.equal(data.horseId,null);
});
test('Administrative edit sends only explicit management fields',async()=>{
    api.defaults.adapter=async config=>{assert.equal(config.method,'put');assert.deepEqual(JSON.parse(config.data),{name:'Comet',registrationNumber:'REG-1',boardingStart:'2026-10-07',boardingEnd:null});return reply(config,{id:'record'});};
    await club.editAdministrativeRegistration('record',{name:'Comet',registrationNumber:'REG-1',boardingStart:'2026-10-07',boardingEnd:null});
});
test('Staff directory follows every page and filters wrong roles',async()=>{
    const pages=[];api.defaults.adapter=async config=>{pages.push(config.params.page);assert.equal(config.params.role,'WorkRider');return reply(config,{page:config.params.page,pageSize:1,total:2,items:config.params.page===1 ? [{id:'rider',role:'WorkRider'}] : [{id:'wrong',role:'Trainer'}]});};
    assert.deepEqual(await club.staffDirectory('WorkRider'),[{id:'rider',role:'WorkRider'}]);assert.deepEqual(pages,[1,2]);
});
test('Official assignment uses horseId and exact backend role',async()=>{
    api.defaults.adapter=async config=>{assert.equal(config.url,'/api/horses/horse/assignments');assert.deepEqual(JSON.parse(config.data),{staffId:'trainer',role:'Trainer',startDate:'2026-10-07',notes:'Assignment'});return reply(config,{id:'assignment'});};
    await club.assignStaff('horse',{staffId:'trainer',role:'Trainer',startDate:'2026-10-07',notes:'Assignment'});
});
test('Session payload keeps UTC+7 and whitelists fields, allowing no Rider',()=>{
    const payload=sessionPayload({id:'forged',horseId:'forged',status:'Completed',scheduledAt:'2026-10-07T15:00',trainingType:'Trot',distanceMetres:'1000',intensity:'Light',surface:'Sand',target:'Steady',notes:'',riderId:''});
    assert.deepEqual(payload,{scheduledAt:'2026-10-07T15:00:00+07:00',trainingType:'Trot',distanceMetres:1000,intensity:'Light',surface:'Sand',target:'Steady',notes:'',riderId:null});assert.equal(localDateTime('2026-10-07T08:00:00Z'),'2026-10-07T15:00');
});
test('Plan detail uses session pagination and history handles separate page contract',async()=>{
    const calls=[];api.defaults.adapter=async config=>{calls.push([config.url,config.params]);return reply(config,config.url.endsWith('/history') ? {items:[],page:2,pageSize:20,total:25} : {plan:{id:'plan'},sessions:[],sessionPage:2,sessionPageSize:20,sessionTotal:25,restrictions:[]});};
    const plan=await training.getPlan('plan',{sessionPage:2,sessionPageSize:20});assert.equal(plan.sessionTotal,25);
    const history=await training.planHistory('plan',{page:2,pageSize:20});assert.equal(history.total,25);
    assert.deepEqual(calls,[['/api/training/plans/plan',{sessionPage:2,sessionPageSize:20}],['/api/training/plans/plan/history',{page:2,pageSize:20}]]);
});
test('Start accepts 204 and duplicate evaluation conflict is never retried',async()=>{
    api.defaults.adapter=async config=>reply(config,'',204);assert.equal(await training.startSession('session'),null);
    let attempts=0;api.defaults.adapter=async config=>{attempts++;throw new axios.AxiosError('Conflict','ERR_BAD_RESPONSE',config,null,reply(config,{detail:'Evaluation already exists'},409));};
    await assert.rejects(training.evaluateSession('session',{comment:'Good',adjustFutureSessions:false}),e=>e.status===409);assert.equal(attempts,1);assert.equal(store.getSession().accessToken,'demo-access');
});
test('Evaluation retains false as boolean and never implies automatic future edits',async()=>{
    api.defaults.adapter=async config=>{assert.equal(config.url,'/api/training/sessions/session/evaluation');assert.deepEqual(JSON.parse(config.data),{comment:'Keep plan',adjustFutureSessions:false});return reply(config,{comment:'Keep plan',adjustFutureSessions:false});};
    await training.evaluateSession('session',{comment:'Keep plan',adjustFutureSessions:false});
});
test('Trainer mutation availability follows current active assignment, not Plan creator',()=>{
    const user={id:'trainer',role:'Trainer'};assert.equal(isAssigned({assignments:[{active:true,staffId:'trainer',role:'Trainer'}]},user,'Trainer'),true);
    assert.equal(isAssigned({assignments:[{active:false,staffId:'trainer',role:'Trainer'}]},user,'Trainer'),false);
    assert.equal(isAssigned({assignments:[{active:true,staffId:'other',role:'Trainer'}]},user,'Trainer'),false);
    assert.equal(isAssigned({assignments:[{active:true,staffId:'trainer',role:'Trainer'}]},{...user,role:'HorseOwner'},'Trainer'),false);
});
for(const [route,allowed] of [['/reviews',['ClubManager']],['/reviews/record',['ClubManager']],['/training/templates',['ClubManager','HeadTrainer','Trainer']],['/training/plans/new',['Trainer']],['/training/plans/plan/sessions/new',['Trainer']],['/training/sessions',['HorseOwner','ClubManager','HeadTrainer','Trainer','WorkRider','Veterinarian']]]){
    for(const role of ALL_ROLES){test(`${route}: ${role} obeys the UI role guard`,()=>{const html=renderToStaticMarkup(h(MemoryRouter,{initialEntries:[route]},h(AuthContext.Provider,{value:{user:{id:'user',role,active:true,emailVerified:true},loading:false,isAuthenticated:true,logout:async()=>{}}},h(AppRoutes))));assert.equal(html.includes('Đang tải dữ liệu'),allowed.includes(role));});}
}

test('History reads legacy plan/session and outcome snapshots without exposing IDs', async()=>{const {historyView}=await import('../src/services/historyView.js');const legacy=historyView(JSON.stringify({goal:'Stamina',status:'Active',id:'private-id'}));assert.equal(legacy.title,'Thay đổi kế hoạch');assert.equal(JSON.stringify(legacy).includes('private-id'),false);const outcome=historyView(JSON.stringify({session:{status:'Completed',distanceMetres:1000},result:{timeSeconds:90,speedMetresPerSecond:11.111},evaluation:{comment:'Keep plan',adjustFutureSessions:false}}));assert.equal(outcome.title,'Đánh giá của Trainer');assert.ok(outcome.rows.some(([label,value])=>label==='Điều chỉnh tương lai' && value==='Không đề nghị'));assert.equal(historyView('invalid'),null);assert.equal(historyView('[]'),null);});
