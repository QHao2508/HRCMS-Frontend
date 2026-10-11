import assert from 'node:assert/strict';
import {test} from 'node:test';
import {validateRegistration} from '../src/services/authValidation.js';
import {sessionPayload} from '../src/services/trainingPayload.js';
const form={firstName:'Test',lastName:'Owner',email:'owner@example.test',userName:'owner_one',phone:'0900000000',address:'Test address',password:'TestPassword123!',confirmPassword:'TestPassword123!',nationalId:''};
test('username rule accepts normalized ASCII identities and rejects ambiguous or invalid names',()=>{
 for(const userName of ['owner_one','OWNER-ONE','owner.one',' owner_one '])assert.equal(validateRegistration({...form,userName}).userName,undefined);
 for(const userName of ['ab','name with spaces','email@example.test','tênngựa','x'.repeat(81)])assert.ok(validateRegistration({...form,userName}).userName);
});
test('session duration is explicitly included while server end time cannot be supplied by the form',()=>{
 const value=sessionPayload({scheduledAt:'2026-10-12T10:00',trainingType:'Trot',distanceMetres:'1000',durationMinutes:'45',intensity:'Light',surface:'Sand',target:'Steady',riderId:'',scheduledEndAt:'injected'});
 assert.equal(value.durationMinutes,45);assert.equal(value.scheduledAt,'2026-10-12T10:00:00+07:00');assert.equal(value.riderId,null);assert.equal(Object.hasOwn(value,'scheduledEndAt'),false);
});
