import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import api from '../src/services/api.js';
import { saveDraftWithPhoto } from '../src/services/registrationPhoto.js';

const file = new File([new Uint8Array([137,80,78,71,13,10,26,10])], 'horse.png', {type:'image/png'});
const reply=(config,data)=>({config,data,status:200,statusText:'',headers:{}});
test('new draft commits its ID before multipart photo upload', async()=>{
    const calls=[];let saved;
    api.defaults.adapter=async config=>{
        calls.push([config.method,config.url]);
        if(config.url==='/api/registrations') return reply(config,{id:'draft-1'});
        assert.equal(saved,'draft-1');assert.ok(config.data instanceof FormData);
        assert.equal(config.data.get('type'),'HorsePhoto');assert.equal(config.data.get('file').name,'horse.png');
        assert.notEqual(config.headers.get('Content-Type'),'application/json');
        return reply(config,{id:'photo-1'});
    };
    assert.equal((await saveDraftWithPhoto({values:{name:'Ngựa'},file,onSaved:record=>{saved=record.id;}})).id,'draft-1');
    assert.deepEqual(calls,[['post','/api/registrations'],['post','/api/registrations/draft-1/attachments']]);
});
test('failed upload retains draft ID and corrected retry updates that same draft', async()=>{
    const calls=[];let saved;let fail=true;
    api.defaults.adapter=async config=>{
        calls.push([config.method,config.url]);
        if(config.url.endsWith('/attachments') && fail) {fail=false;throw new axios.AxiosError('Bad photo','ERR_BAD_REQUEST',config,null,{status:400,data:{detail:'File extension must match its content.'}});}
        return reply(config,{id:config.url.endsWith('/attachments')?'photo-1':'draft-1'});
    };
    const onSaved=record=>{saved=record.id;};
    await assert.rejects(saveDraftWithPhoto({values:{name:'Ngựa'},file,onSaved}));assert.equal(saved,'draft-1');
    await saveDraftWithPhoto({registrationId:saved,values:{name:'Ngựa'},file,onSaved});
    assert.equal(calls.filter(([method,url])=>method==='post'&&url==='/api/registrations').length,1);
    assert.ok(calls.some(([method,url])=>method==='put'&&url==='/api/registrations/draft-1'));
});
test('draft without selected photo preserves the existing registration workflow', async()=>{
    const calls=[];api.defaults.adapter=async config=>{calls.push(config.url);return reply(config,{id:'draft-1'});};
    await saveDraftWithPhoto({values:{},file:null,onSaved:()=>{}});
    assert.deepEqual(calls,['/api/registrations']);
});
