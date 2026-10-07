import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import api from '../src/services/api.js';
import { login } from '../src/services/authService.js';
import { getSession } from '../src/services/sessionStore.js';
import { normalizeApiError } from '../src/services/apiError.js';
import { AUTH_ERROR } from '../src/constants/auth.js';

test('pending login preserves canonical verification email but never creates tokens or refreshes', async () => {
    const requests=[];
    api.defaults.adapter=async config=>{
        requests.push(config.url);
        throw new axios.AxiosError('Request failed','ERR_BAD_RESPONSE',config,null,{status:401,data:{error:AUTH_ERROR.VerificationRequired,email:'owner@example.test'}});
    };
    await assert.rejects(login({email:'owner-name',password:'example-password'}), error=>{
        assert.equal(error.authCode,AUTH_ERROR.VerificationRequired);
        assert.equal(error.verificationEmail,'owner@example.test');
        assert.match(error.message,/chưa được kích hoạt/);return true;
    });
    assert.deepEqual(requests,['/api/auth/login']);
    assert.equal(getSession().status,'anonymous');assert.equal(getSession().accessToken,null);assert.equal(getSession().user,null);
});
test('expired registration is distinguishable without treating it as an authenticated session', async () => {
    const error=await normalizeApiError({response:{status:410,data:{error:AUTH_ERROR.RegistrationExpired}}});
    assert.equal(error.authCode,AUTH_ERROR.RegistrationExpired);assert.equal(error.verificationEmail,null);assert.match(error.message,/24 giờ/);
});
test('invalid credentials and arbitrary API codes cannot redirect to verification', async () => {
    for(const code of [AUTH_ERROR.InvalidCredentials,'unrecognized']) {
        const error=await normalizeApiError({response:{status:401,data:{error:code,email:'private@example.test'}}});
        assert.notEqual(error.authCode,AUTH_ERROR.VerificationRequired);assert.equal(error.verificationEmail,null);
    }
});
