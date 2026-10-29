// Run against the local Vite server. Every API response and mutation is an in-memory fixture.
// UI_UX_PLAYWRIGHT can point to an existing playwright package's index.mjs.
import assert from 'node:assert/strict';
import { MSG, msg } from '../src/messages/index.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = process.env.UI_UX_PLAYWRIGHT ? await import(pathToFileURL(process.env.UI_UX_PLAYWRIGHT).href) : await import('playwright');
const base = process.env.UI_UX_BASE_URL || 'http://127.0.0.1:5175';
assert.match(base, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const output = path.resolve('test-results/ui-ux');
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true,channel:process.env.UI_UX_BROWSER || 'chrome'});
const photo = await readFile('public/images/home-scope-horse.jpg');
const roles=['HorseOwner','ClubManager','HeadTrainer','Trainer','WorkRider','Veterinarian','Groom'];
const horse={id:'horse-1',name:'Bạch Phong',breed:'Thoroughbred',gender:'Gelding',systemRegistrationCode:'HRC-001',externalRegistrationNumber:'VN-001',dateOfBirth:'2020-03-15',healthStatus:'Fit',archived:false,stallName:'A-01',leadTrainerName:'Minh Trần',nextSessionAt:'2026-10-30T02:00:00Z',hasPhoto:true};
const template={id:'template-1',name:'Xây dựng thể lực nền tảng',goal:'Cải thiện sức bền',phase:'Base',distanceMetres:1000,intensity:'Light',surface:'Sand',frequencyPerWeek:3,isSystemDefault:true,minimumExpertiseLevel:1,requiredTrainingTypesJson:'["Trot"]'};
const plan={id:'plan-1',horseId:horse.id,templateId:template.id,trainerId:'Trainer-id',goal:'Tăng sức bền',phase:'Base',startDate:'2026-10-28',endDate:'2026-11-28',status:'Active',version:1,notes:''};
const session={id:'session-1',horseId:horse.id,planId:plan.id,horseName:horse.name,trainerName:'Minh Trần',riderName:'An Nguyễn',riderId:'WorkRider-id',status:'Assigned',scheduledAt:'2026-10-29T02:00:00Z',scheduledEndAt:'2026-10-29T02:30:00Z',durationMinutes:30,trainingType:'Trot',distanceMetres:1000,intensity:'Light',surface:'Sand',target:'Giữ nhịp ổn định',version:1};
const record={id:'record-1',horseId:horse.id,examinationAt:'2026-10-27T02:00:00Z',createdAt:'2026-10-27T02:00:00Z',reason:'Kiểm tra vận động',symptoms:'Theo dõi dáng đi',findings:'Cần theo dõi',diagnosis:'Theo dõi thể lực',healthStatus:'Monitoring',notes:''};
const treatment={id:'treatment-1',medicalRecordId:record.id,startDate:'2026-10-27',followUpDate:'2026-10-30',objective:'Theo dõi phục hồi',instructions:'Theo hướng dẫn bác sĩ',medication:'',frequency:'1 lần/ngày',completed:false};
const inventory={id:'item-1',name:'Cỏ khô',category:'Thức ăn',unit:'kg',stock:120,minimumStock:30,archived:false};
const reg={...horse,id:'registration-1',ownerId:'HorseOwner-id',ownerName:'Nguyễn An',name:horse.name,status:'Draft',createdAt:'2026-10-27T03:00:00Z',boardingStart:'2026-10-28',boardingEnd:'',sire:'Ngựa bố',dam:'Ngựa mẹ',heightCm:160,weightKg:450,measurementDate:'2026-10-27',declaredHealth:'Theo dõi sức khỏe định kỳ',healthNotes:''};
const site={version:1,heroTitle:'Câu lạc bộ HRCMS',heroDescription:'Quản lý hồ sơ, chăm sóc và huấn luyện ngựa.',featuresTitle:'Đồng hành mỗi ngày',featuresDescription:'Kết nối mọi công việc trong câu lạc bộ.',features:[{title:'Hồ sơ ngựa',description:'Thông tin luôn rõ ràng.'},{title:'Huấn luyện',description:'Theo dõi tiến độ từng buổi.'},{title:'Chăm sóc',description:'Kết nối đội ngũ chuyên môn.'}]};
const routes=[['/',''],['/login',''],['/register',''],['/forgot-password',''],['/verify-email',''],['/reset-password',''],['/accept-invitation',''],['/dashboard','ClubManager'],['/registrations','HorseOwner'],['/registrations/new','HorseOwner'],['/registrations/registration-1','HorseOwner'],['/reviews','ClubManager'],['/reviews/registration-1','ClubManager'],['/horses','HorseOwner'],['/horses/horse-1','ClubManager'],['/training/templates','HeadTrainer'],['/training/plans','Trainer'],['/training/plans/new','Trainer'],['/training/plans/plan-1','Trainer'],['/training/sessions','WorkRider'],['/training/plans/plan-1/sessions/new','Trainer'],['/training/sessions/session-1','WorkRider'],['/medical','Veterinarian'],['/medical/examination','Veterinarian'],['/medical/injury','Veterinarian'],['/medical/treatment','Veterinarian'],['/medical/restrictions','Veterinarian'],['/medical/follow-up','Veterinarian'],['/medical/preventive-care','Veterinarian'],['/care/tasks','Groom'],['/care/incidents','Groom'],['/care/stables','ClubManager'],['/inventory','ClubManager'],['/inventory/issue','Groom'],['/inventory/replenishments','ClubManager'],['/reports','ClubManager'],['/manager/staff','ClubManager'],['/manager/audit','ClubManager'],['/manager/website','ClubManager'],['/permission-denied','HorseOwner'],['/unknown-route','']];
const results=[];const failures=[];
async function setup(role, viewport={width:1440,height:900}) {
    const context=await browser.newContext({viewport,timezoneId:'America/Los_Angeles',reducedMotion:'reduce'});
    await context.addInitScript(role=>{if(role)localStorage.setItem('hrcms.session',JSON.stringify({accessToken:'fixture-only',refreshToken:'fixture-only',expiresAt:Date.now()+3600000}));},role);
    const writes=[];
    await context.route('**/*', async route=>{
        const url=new URL(route.request().url());
        if(url.origin!==base){await route.abort();return;}
        if(!url.pathname.startsWith('/api/')){await route.continue();return;}
        const p=url.pathname;const params=url.searchParams;
        const paged=items=>({items,page:Number(params.get('page')||1),pageSize:Number(params.get('pageSize')||20),total:items.length});
        const reply=data=>route.fulfill({json:data});
        const staff=roles.filter(x=>x!=='HorseOwner').map(x=>({id:`${x}-id`,role:x,firstName:'Minh',lastName:x,userName:x,email:`${x}@example.test`,active:true,emailVerified:true}));
        if(route.request().method()!=='GET'){
            writes.push({path:p,method:route.request().method(),body:route.request().postDataJSON()});
            if(p.endsWith('/start'))session.status='InProgress';
            if(p==='/api/registrations')return reply({...reg,id:'saved-draft'});
            return reply({id:'fixture-saved',...route.request().postDataJSON()});
        }
        if(p.includes('/photo')||p.includes('/branding/')||p.includes('/website/assets/'))return route.fulfill({body:photo,contentType:'image/jpeg'});
        if(p==='/api/auth/me')return reply({id:`${role}-id`,role,firstName:'Nguyễn',lastName:'An',userName:'fixture',active:true,emailVerified:true});
        if(p==='/api/website')return reply(site);
        if(p==='/api/notifications')return reply(paged([]));
        if(p==='/api/dashboard')return reply({horseCount:12,activePlans:5,sessionsToday:4,overdueSessions:1,restrictedHorses:2,unreadNotifications:0,careTasksToday:7,openIncidents:1,pendingReviews:3,lowStockItems:2});
        if(p==='/api/horses/summary')return reply({health:{Fit:8,Monitoring:2,Injured:1,Isolated:1},breeds:['Arabian','Thoroughbred'],stalls:[{id:'stall-1',name:'A-01'}]});
        if(p==='/api/horses')return reply(paged([horse]));
        if(p==='/api/horses/horse-1')return reply({horse,assignments:staff.map(x=>({id:x.id,staffId:x.id,role:x.role,active:true,startDate:'2026-10-01'})),staffNames:Object.fromEntries(staff.map(x=>[x.id,x.firstName])),latestMeasurement:{heightCm:160,weightKg:450}});
        if(p.endsWith('/medical/summary'))return reply({healthStatus:'Fit',restrictions:[{id:'restriction-1',noSprint:true,maxDistanceMetres:1200,reason:'Theo dõi chân trước trái',validUntil:'2026-11-05'}],trainingLocked:false});
        if(p.endsWith('/medical/overview'))return reply({healthStatus:'Fit',restrictions:[],cases:[],treatments:[],includesClinicalNotes:role==='ClubManager'});
        if(p.endsWith('/medical/records'))return reply(paged([record]));
        if(p.endsWith('/medical/treatments'))return reply(paged([treatment,{...treatment,id:'treatment-done',objective:'Phác đồ đã hoàn tất',completed:true}]));
        if(p.includes('/medical/'))return reply(paged([]));
        if(p.endsWith('/measurements'))return reply(paged([{id:'measure-1',date:'2026-10-27',heightCm:160,weightKg:450}]));
        if(p==='/api/staff/directory')return reply(paged(staff.filter(x=>!params.get('role')||x.role===params.get('role'))));
        if(p==='/api/staff')return reply(paged(staff));
        if(p.endsWith('/workload'))return reply({assignments:1,sessions:1,careTasks:0,preview:[]});
        if(p.endsWith('/training-profile'))return reply({specialties:[],workingHours:[],timeOff:[],version:1});
        if(p==='/api/registrations')return reply(paged([{...reg,status:role==='ClubManager'?'PendingReview':'Draft'}]));
        if(p.endsWith('/attachments'))return reply([]);
        if(p.startsWith('/api/registrations/'))return reply({...reg,status:role==='ClubManager'?'PendingReview':'Draft'});
        if(p==='/api/training/templates/defaults')return reply([template]);
        if(p==='/api/training/templates')return reply(paged([template]));
        if(p.endsWith('/trainer-candidates')||p.endsWith('/trainer-candidates/'))return reply([]);
        if(p==='/api/training/availability')return reply({timeZone:'Asia/Ho_Chi_Minh',horse:{state:'Known',name:horse.name,free:[],busy:[]},trainer:{state:'Known',name:'Minh Trần',free:[],busy:[]},rider:null,commonFree:[]});
        if(p==='/api/training/reference-data')return reply({sources:[],records:[]});
        if(p==='/api/training/plans')return reply(paged([{...plan,horseName:horse.name,trainerName:'Minh Trần'}]));
        if(p==='/api/training/plans/plan-1')return reply({plan,template,sessions:[session],restrictions:[],horseName:horse.name,trainerName:'Minh Trần',sessionNames:[session],sessionPage:1,sessionPageSize:20,sessionTotal:1});
        if(p==='/api/training/sessions')return reply(paged([session]));
        if(p==='/api/training/sessions/session-1')return reply({session,result:null,evaluation:null,template,riderName:'An Nguyễn',trainerName:'Minh Trần'});
        if(p==='/api/care/tasks')return reply(paged([{id:'task-1',horseId:horse.id,groomId:'Groom-id',type:'Feeding',scheduledAt:'2026-10-28T02:00:00Z',status:'Pending',approvedPortionKg:2,instructions:'Chia khẩu phần thành hai lượt',notes:''}]));
        if(p==='/api/care/stables')return reply(paged([{id:'stable-1',name:'Khu A'}]));
        if(p==='/api/care/stalls')return reply(paged([{id:'stall-1',name:'A-01',occupied:true,horseId:horse.id,horseName:horse.name,cleaningStatus:'NeedsCleaning',canClean:true}]));
        if(p==='/api/inventory')return reply(paged([inventory]));
        if(p==='/api/inventory/replenishments')return reply(paged([{id:'request-1',itemId:inventory.id,itemName:inventory.name,quantity:50,receivedQuantity:10,status:'PartiallyReceived',notes:'Bổ sung theo kế hoạch'}]));
        if(p==='/api/reports')return reply({from:'2026-10-01T00:00:00+07:00',to:'2026-10-28T23:59:59+07:00',kpi:{sessions:10,completed:8,completionRate:80,actualDistanceMetres:8000,actualTimeSeconds:4000,careTasks:20,completedCare:18},series:[{period:'2026-10-27',sessions:5,completed:4,plannedDistanceMetres:5000,actualDistanceMetres:4000}],training:[session],care:[],noData:false});
        if(p==='/api/audit')return reply(paged([{id:'audit-1',createdAt:'2026-10-28T02:00:00Z',actorName:'Quản lý',action:'HorseAssigned',referenceId:horse.id,detail:'Đã giao nhân sự phụ trách'}]));
        return reply(paged([]));
    });
    const page=await context.newPage();page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
    return {context,page,errors,writes};
}
async function ready(page){await page.locator('h1').first().waitFor();await page.waitForTimeout(180);await page.evaluate(()=>document.fonts.ready);}
if(process.env.UI_UX_INSPECT){
 const {page,context}=await setup(process.env.UI_UX_ROLE || 'HorseOwner',{width:390,height:844});await page.goto(base+process.env.UI_UX_INSPECT);await ready(page);
 console.log(JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(x=>{const r=x.getBoundingClientRect();return r.right>innerWidth+1 && r.width>0}).map(x=>({tag:x.tagName,cls:x.className,rect:x.getBoundingClientRect().toJSON(),overflow:getComputedStyle(x).overflowX,position:getComputedStyle(x).position}))),null,2));
 await context.close();await browser.close();process.exit(0);
}
try {
    for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
        for(const [pathname,role] of routes){
            const {context,page,errors}=await setup(role,viewport);
            try{
                await page.goto(base+pathname);await ready(page);
                assert.deepEqual(errors,[],`page errors at ${pathname}`);
                const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,headings:[...document.querySelectorAll('h1')].map(x=>x.textContent)}));
                assert.ok(metrics.scroll<=metrics.width+1,`document overflows ${pathname}: ${metrics.scroll}/${metrics.width}`);
                const slug=pathname==='/'?'home':pathname.replaceAll('/','_').replace(/^_/,'');
                await page.screenshot({path:path.join(output,`${viewport.width}-${slug}.png`),fullPage:true});
                results.push({route:pathname,role:role||'anonymous',viewport:viewport.width,...metrics,status:'pass'});
            }catch(error){console.error(pathname,viewport.width,error.message,errors);await page.screenshot({path:path.join(output,`FAILED-${viewport.width}-${pathname.replaceAll('/','_')||'home'}.png`),fullPage:true}).catch(()=>{});failures.push({route:pathname,viewport:viewport.width,error:error.message,errors});}
            await context.close();
        }
    }
    // Interaction regression: treatment values remain enums while labels are Vietnamese.
    {
        const {context,page,errors}=await setup('Veterinarian');await page.goto(base+'/medical/treatment?horseId=horse-1');await ready(page);
        const filter=page.locator('select').filter({has:page.locator('option[value="Completed"]')});
        await filter.selectOption('Completed');assert.equal(await page.locator('tbody tr').count(),1);assert.match(await page.locator('tbody').innerText(),/Phác đồ đã hoàn tất/);
        await filter.selectOption('Active');assert.equal(await page.locator('tbody tr').count(),1);assert.match(await page.locator('tbody').innerText(),/Theo dõi phục hồi/);
        await filter.selectOption('All');assert.equal(await page.locator('tbody tr').count(),2);
        assert.deepEqual(errors,[]);await context.close();results.push({interaction:'treatment status filter',status:'pass'});
    }
    // Manager routine assignment never fetches clinical treatments.
    {
        const {context,page,writes}=await setup('ClubManager');const requests=[];page.on('request',req=>requests.push(req.url()));
        await page.goto(base+'/care/tasks?horseId=horse-1');await ready(page);
        assert.equal(await page.locator('select[name="type"] option').count(),5);assert.ok(!requests.some(url=>url.includes('/medical/treatments')));
        await page.locator('select[name="groomId"]').selectOption('Groom-id');await page.locator('input[name="approvedPortionKg"]').fill('2.5');await page.locator('textarea[name="instructions"]').fill('Khẩu phần đã duyệt');
        await page.getByRole('button',{name:'Giao công việc chăm sóc',exact:true}).click();await page.waitForTimeout(100);
        assert.equal(writes.at(-1)?.body.approvedPortionKg,2.5);assert.equal(writes.at(-1)?.body.treatmentPlanId,null);
        await context.close();results.push({interaction:'manager routine care payload',status:'pass'});
    }
    // Wizard returns to an invalid field without requiring a complete draft.
    {
        const {context,page,writes}=await setup('HorseOwner');await page.goto(base+'/registrations/new');await ready(page);
        await page.locator('#registration-name').fill('Ngựa thử nghiệm');await page.getByRole('button',{name:/Lưu bản nháp/,exact:false}).click();await page.waitForTimeout(150);
        assert.equal(writes.at(-1)?.path,'/api/registrations');
        await context.close();results.push({interaction:'partial draft remains valid',status:'pass'});
    }
    // Dirty medical dialogs retain edits on Escape cancellation and restore focus after close.
    {
        const {context,page}=await setup('Veterinarian',{width:390,height:844});await page.goto(base+'/medical/treatment?horseId=horse-1');await ready(page);
        const trigger=page.getByRole('button',{name:'Tạo phác đồ',exact:true});await trigger.click();const dialog=page.getByRole('dialog');await dialog.waitFor();
        await dialog.locator('textarea').first().fill('Mục tiêu đang nhập');
        page.once('dialog',dialog=>dialog.dismiss());await page.keyboard.press('Escape');assert.equal(await dialog.count(),1);
        page.once('dialog',dialog=>dialog.accept());await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
        assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);
        await context.close();results.push({interaction:'medical dialog dirty Escape and focus restoration',status:'pass'});
    }
    // Invalid partial drafts navigate back to a field instead of submitting a write.
    {
        const {context,page,writes}=await setup('HorseOwner');await page.goto(base+'/registrations/new');await ready(page);
        await page.locator('.wizard-step').nth(1).click();await page.locator('#registration-heightCm').fill('999');await page.getByRole('button',{name:/Lưu bản nháp/,exact:false}).click();
        await page.locator('.wizard-error-summary').waitFor();assert.equal(writes.length,0);await page.locator('.wizard-error-summary button').first().click();
        await page.waitForFunction(()=>document.activeElement?.id==='registration-heightCm');
        await context.close();results.push({interaction:'wizard validation focus without write',status:'pass'});
    }
    // CMS preview renders the same hero and feature layout as Home, using unsaved form text.
    {
        const {context,page,writes}=await setup('ClubManager');await page.goto(base+'/manager/website');await ready(page);
        await page.locator('input[name="heroTitle"]').fill('Tiêu đề xem trước');await page.getByRole('button',{name:msg(MSG.ADMIN_PREVIEW),exact:true}).click();
        await page.locator('.website-preview .hp-hero').waitFor();assert.match(await page.locator('.website-preview h1').innerText(),/Tiêu đề xem trước/);assert.equal(writes.length,0);
        await context.close();results.push({interaction:'CMS shared layout preview without saving',status:'pass'});
    }
    // A broken CMS logo must never display an outdated bundled logo.
    {
        const {context,page}=await setup('HorseOwner');
        await page.route('**/api/website',route=>route.fulfill({json:{...site,logoVersion:'unavailable-logo'}}));
        await page.route('**/api/website/assets/Logo*',route=>route.fulfill({status:500,json:{title:'internal_error'}}));
        await page.goto(base+'/dashboard');await ready(page);
        await page.locator('.ws-brand-tile').filter({hasText:msg(MSG.WS_BRAND_INITIAL)}).waitFor();
        assert.equal(await page.locator('.ws-brand-tile img').count(),0);
        await context.close();results.push({interaction:'broken CMS logo does not display an old logo',status:'pass'});
    }
    // Photo failures remain visible and a retry can recover without reloading the horse profile.
    {
        const {context,page}=await setup('HorseOwner');
        const photoPattern='**/api/horses/horse-1/photo';
        await page.route(photoPattern,route=>route.fulfill({status:500,json:{title:'internal_error'}}));
        await page.goto(base+'/horses/horse-1');await ready(page);
        await page.getByText(msg(MSG.UX_HORSE_PHOTO_STORAGE),{exact:true}).waitFor();
        assert.equal(await page.locator('.horse-portrait img').count(),0);
        await page.unroute(photoPattern);await page.locator('.horse-portrait').getByRole('button',{name:msg(MSG.THU_LAI),exact:true}).click();
        await page.waitForFunction(()=>document.querySelector('.horse-portrait img')?.naturalWidth>0);
        await context.close();results.push({interaction:'horse photo error and retry recovery',status:'pass'});
    }
    // Explicitly missing photo metadata is distinct from an unavailable storage service.
    {
        const {context,page}=await setup('HorseOwner');const photos=[];page.on('request',request=>{if(request.url().endsWith('/photo'))photos.push(request.url());});
        await page.route('**/api/horses/horse-1',route=>route.fulfill({json:{horse,assignments:[],staffNames:{},latestMeasurement:null,photo:null}}));
        await page.goto(base+'/horses/horse-1');await ready(page);await page.getByText(msg(MSG.UX_HORSE_NO_PHOTO),{exact:true}).waitFor();
        assert.equal(photos.length,0);await context.close();results.push({interaction:'missing horse photo is explicit and makes no request',status:'pass'});
    }
    // List filters survive detail navigation and browser Back.
    {
        const {context,page}=await setup('HorseOwner');await page.goto(base+'/horses');await ready(page);
        await page.locator('#horse-search').fill('Bạch');await page.getByRole('button',{name:msg(MSG.SEARCH_ACTION),exact:true}).click();await page.waitForURL(/search=/);
        await page.getByRole('link',{name:msg(MSG.XEM_HO_SO),exact:true}).click();await page.waitForURL('**/horses/horse-1');await page.goBack();await ready(page);
        assert.equal(await page.locator('#horse-search').inputValue(),'Bạch');await context.close();results.push({interaction:'list filter restored on Back',status:'pass'});
    }
    for(const role of roles){
        const {context,page}=await setup(role);await page.goto(base+'/dashboard');await ready(page);assert.equal(await page.locator('.dashboard-kpi-value').count(),role==='Groom'?3:4);
        await context.close();results.push({interaction:`dashboard ${role}`,status:'pass'});
    }
    // Password visibility preserves entered value and form field identity.
    {
        const {context,page}=await setup('');await page.goto(base+'/login');await ready(page);await page.locator('#login-password').fill('fixture-secret');await page.getByRole('button',{name:'Hiện mật khẩu',exact:true}).click();
        assert.equal(await page.locator('#login-password').getAttribute('type'),'text');assert.equal(await page.locator('#login-password').inputValue(),'fixture-secret');await context.close();results.push({interaction:'password visibility',status:'pass'});
    }
}catch(error){failures.push({interaction:'workflow',error:error.stack});}
finally{await writeFile(path.join(output,'results.json'),JSON.stringify({results,failures},null,2));await browser.close();}
console.log(JSON.stringify({passed:results.length,failures},null,2));
assert.equal(failures.length,0,'Browser UI regressions; inspect test-results/ui-ux/results.json');
