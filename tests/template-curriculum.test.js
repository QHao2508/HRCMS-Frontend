import assert from 'node:assert/strict';
import { test } from 'node:test';
import { curriculumOf, requiredTypes, choosePlanOption, chooseExercise, initialPlanForm, initialSessionForm, templateEditorForm, templatePayload, OTHER_OPTION } from '../src/services/templateCurriculum.js';
import { sessionPayload } from '../src/services/trainingPayload.js';
const option = { key:'canter-1',label:'Canter đều',trainingType:'Canter',distanceMetres:800,intensity:'Light',surface:'Cát',durationMinutes:20,target:'Giữ nhịp đều' };
const template = { id:'shared',isSystemDefault:true,name:'Duy trì nhịp chạy',goal:'Sức bền',phase:'Build',distanceMetres:800,intensity:'Light',surface:'Cát',frequencyPerWeek:3,notes:'',
    minimumExpertiseLevel:2,requiredTrainingTypesJson:'["Canter"]',curriculumJson:JSON.stringify({planOptions:[{key:'standard',label:'Sức bền',goal:'Sức bền',phase:'Build'}],sessionOptions:[option]}) };
test('plan choice uses the selected template and Other explicitly opens custom input',()=>{
    const preset=choosePlanOption({horseId:'horse'},template,'standard');
    assert.equal(preset.goal,'Sức bền');assert.equal(preset.phase,'Build');assert.equal(preset.templatePlanOptionKey,'standard');assert.equal(preset.useCustomPlan,false);
    const custom=choosePlanOption(preset,template,OTHER_OPTION);
    assert.equal(custom.templatePlanOptionKey,null);assert.equal(custom.useCustomPlan,true);
});
test('exercise choice sets all prescribed fields and preserves date and rider',()=>{
    const form=chooseExercise({scheduledAt:'2026-10-20T09:00',riderId:'rider'},template,'canter-1');
    for(const field of ['trainingType','distanceMetres','intensity','surface','durationMinutes','target'])assert.equal(form[field],option[field]);
    assert.equal(form.scheduledAt,'2026-10-20T09:00');assert.equal(form.riderId,'rider');
    assert.equal(form.templateExerciseKey,'canter-1');assert.equal(form.useCustomExercise,false);
    const payload=sessionPayload(form);assert.equal(payload.templateExerciseKey,'canter-1');assert.equal(payload.useCustomExercise,false);
});
test('Other remains within the template specialties and sends explicit custom metadata',()=>{
    const form=chooseExercise({trainingType:'Trot',scheduledAt:'2026-10-20T09:00',distanceMetres:1000},template,OTHER_OPTION);
    assert.equal(form.trainingType,'Canter');assert.equal(form.useCustomExercise,true);assert.equal(form.templateExerciseKey,null);
    assert.equal(sessionPayload(form).useCustomExercise,true);
});
test('editing a preset retains it, while unmatched legacy values are explicitly custom',()=>{
    assert.equal(initialPlanForm({goal:'Sức bền',phase:'Build'},template).templatePlanOptionKey,'standard');
    assert.equal(initialPlanForm({goal:'Riêng',phase:'Other'},template).useCustomPlan,true);
    assert.equal(initialSessionForm({...option},template).templateExerciseKey,'canter-1');
    assert.equal(initialSessionForm({...option,distanceMetres:999},template).useCustomExercise,true);
});
test('copying a default cannot submit its protected identity and edited options survive rerenders',()=>{
    const form=templateEditorForm(template);form.sessionOptions[0].distanceMetres=1200;
    assert.equal(templateEditorForm(form).sessionOptions[0].distanceMetres,1200);
    const payload=templatePayload(form);
    assert.equal(payload.curriculum.sessionOptions[0].distanceMetres,1200);
    assert.equal(payload.minimumExpertiseLevel,2);assert.deepEqual(payload.requiredTrainingTypes,['Canter']);
    assert.equal('id' in payload,false);assert.equal('isSystemDefault' in payload,false);
});
test('legacy or malformed metadata is not mistaken for a validated curriculum',()=>{
    assert.equal(curriculumOf({curriculumJson:'bad'}),null);assert.deepEqual(requiredTypes({requiredTrainingTypesJson:'["Unrecognized"]'}),[]);
});