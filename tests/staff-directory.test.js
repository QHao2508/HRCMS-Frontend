import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import api from '../src/services/api.js';
import { listStaff, resendStaff } from '../src/services/managerService.js';
import { canResendStaffInvitation } from '../src/services/staffDirectory.js';

const reply = (config, data, status = 200) => ({ config, data, status, statusText: '', headers: {} });

beforeEach(() => {
    api.defaults.adapter = async () => { throw new Error('Unexpected network request'); };
});

test('manager staff list uses server role filter and pagination', async () => {
    api.defaults.adapter = async config => {
        assert.equal(config.method, 'get');
        assert.equal(config.url, '/api/staff');
        assert.deepEqual(config.params, { page: 2, pageSize: 20, role: 'Trainer' });
        return reply(config, { page: 2, pageSize: 20, total: 21, items: [{ id: 'staff-21', role: 'Trainer', active: true, emailVerified: false }] });
    };
    const page = await listStaff({ page: 2, pageSize: 20, role: 'Trainer' });
    assert.equal(page.total, 21);
    assert.equal(page.items[0].id, 'staff-21');
});

test('resend is available only for active accounts awaiting verification', async () => {
    const pending = { id: 'pending', role: 'Trainer', active: true, emailVerified: false };
    assert.equal(canResendStaffInvitation(pending), true);
    assert.equal(canResendStaffInvitation({ ...pending, active: false }), false);
    assert.equal(canResendStaffInvitation({ ...pending, emailVerified: true }), false);
    assert.equal(canResendStaffInvitation({ ...pending, role: 'HorseOwner' }), false);
    let calls = 0;
    api.defaults.adapter = async config => {
        calls++;
        assert.equal(config.method, 'post');
        assert.equal(config.url, '/api/staff/pending/resend-invitation');
        return reply(config, null, 204);
    };
    await resendStaff(pending.id);
    assert.equal(calls, 1);
});
