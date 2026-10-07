import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

test('frontend services connect to the live SQL Server API', { timeout: 90000 }, async () => {
  const password = process.env.HRCMS_LIVE_PASSWORD;
  assert.ok(password, 'Set HRCMS_LIVE_EMAIL and HRCMS_LIVE_PASSWORD for a test account.');
  const server = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
  let api, auth;
  try {
    ({ default: api } = await server.ssrLoadModule('/src/services/api.js'));
    auth = await server.ssrLoadModule('/src/services/authService.js');
    const club = await server.ssrLoadModule('/src/services/clubService.js');
    const training = await server.ssrLoadModule('/src/services/trainingService.js');
    const registrations = await server.ssrLoadModule('/src/services/registrationService.js');
    const attachments = await server.ssrLoadModule('/src/services/registrationAttachments.js');
    api.defaults.baseURL = process.env.HRCMS_LIVE_API_URL || 'http://localhost:5173';
    const managerEmail = process.env.HRCMS_LIVE_EMAIL;
    assert.ok(managerEmail, 'Set HRCMS_LIVE_EMAIL.');
    assert.equal((await api.get('/health')).data.status, 'healthy');
    const manager = await auth.login({ email: managerEmail, password });
    assert.ok(manager.id);
    const enums = (await api.get('/api/metadata/enums')).data;
    assert.ok(enums.Role.includes(manager.role));
    assert.equal(typeof (await api.get('/api/dashboard')).data.horseCount, 'number');
    assert.ok(Array.isArray((await club.listHorses()).items));

    // Mutating checks require a deliberately prepared disposable fixture, never ordinary live accounts.
    if (process.env.HRCMS_LIVE_FIXTURE === '1') {
      assert.equal(manager.role, 'ClubManager');
      const signIn = role => auth.login({ email: `${role.toLowerCase()}@frontend.example.test`, password });
      const directory = {};
      for (const role of enums.Role) {
        const user = role === 'ClubManager' ? manager : await signIn(role);
        assert.equal(user.role, role);
        directory[role] = user;
        assert.equal(typeof (await api.get('/api/dashboard')).data.horseCount, 'number');
        assert.ok(Array.isArray((await club.listHorses()).items));
      }
      await signIn('HorseOwner');
      assert.ok((await registrations.listPreferredStaff()).HeadTrainer.length);
      const draft = await registrations.createRegistration({ name: 'Frontend smoke draft' });
      assert.equal(draft.status, 'Draft');
      assert.equal((await registrations.cancelRegistration(draft.id)).status, 'Cancelled');
      const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      const form = { name: 'Frontend integration horse', sire: 'Demo Sire', dam: 'Demo Dam', dateOfBirth: '2020-01-01', gender: 'Gelding', breed: 'Thoroughbred', heightCm: 160, weightKg: 450, measurementDate: today, declaredHealth: 'Fit', boardingStart: today, healthNotes: '', registrationNumber: `FE-${Date.now()}` };
      const registration = await registrations.createRegistration(form);
      assert.equal((await registrations.updateRegistration(registration.id, form)).name, form.name);
      const png = new File([Uint8Array.from([137,80,78,71,13,10,26,10,0])], 'photo.png', { type: 'image/png' });
      const photo = await attachments.uploadAttachment(registration.id, { file: png, type: 'HorsePhoto' });
      await attachments.uploadAttachment(registration.id, { file: png, type: 'Certificate', certificateNumber: 'FE-TEST' });
      assert.equal((await attachments.listAttachments(registration.id)).length, 2);
      // Node's Axios adapter returns bytes for blob responses; browser rendering is checked separately.
      assert.ok((await attachments.fetchAttachment(registration.id, photo.id)) != null);
      assert.equal((await registrations.submitRegistration(registration.id)).status, 'PendingReview');
      await auth.login({ email: managerEmail, password });
      assert.ok((await registrations.listRegistrations({ status: 'PendingReview' })).items.some(item => item.id === registration.id));
      const approval = await club.reviewRegistration(registration.id, { approve: true });
      assert.ok(approval.horseId);
      for (const role of ['HeadTrainer', 'Groom', 'Veterinarian']) await club.assignStaff(approval.horseId, { staffId: directory[role].id, role, startDate: today, notes: 'Frontend fixture' });
      await signIn('HeadTrainer');
      await club.assignStaff(approval.horseId, { staffId: directory.Trainer.id, role: 'Trainer', startDate: today, notes: 'Frontend fixture' });
      const template = await training.createTemplate({ name: 'Frontend template', goal: 'Fitness', phase: 'Base', distanceMetres: 1000, intensity: 'Light', surface: 'Sand', frequencyPerWeek: 3, notes: '' });
      assert.ok((await training.listTemplates({ page: 1, pageSize: 20 })).items.some(item => item.id === template.id));
      await signIn('Trainer');
      const plan = await training.createPlan({ horseId: approval.horseId, templateId: template.id, goal: 'Frontend plan', phase: 'Base', startDate: today, endDate: today, notes: '' });
      const session = await training.createSession(plan.id, { scheduledAt: new Date(Date.now() + 60000).toISOString(), trainingType: 'Trot', distanceMetres: 1000, intensity: 'Light', surface: 'Sand', target: 'Fitness', notes: '', riderId: directory.WorkRider.id });
      assert.equal((await training.getPlan(plan.id, { sessionPage: 1, sessionPageSize: 20 })).sessionTotal, 1);
      assert.equal((await training.getSession(session.id)).session.id, session.id);
      assert.ok((await training.listPlans()).items.some(item => item.id === plan.id));
      assert.ok((await training.listSessions()).items.some(item => item.id === session.id));
      await signIn('WorkRider');
      await training.startSession(session.id);
      await training.submitResult(session.id, { distanceMetres: 1000, timeSeconds: 120, heartRate: 100, intensity: 'Light', feedback: 'Fixture result', abnormalObservation: false });
      await signIn('Trainer');
      await training.evaluateSession(session.id, { comment: 'Fixture evaluation', adjustFutureSessions: false });
      assert.ok((await training.planHistory(plan.id)).total >= 4);
      assert.ok((await club.getHorse(approval.horseId)).assignments.length >= 4);
      await api.post('/api/auth/refresh', { refreshToken: (await server.ssrLoadModule('/src/services/sessionStore.js')).getSession().refreshToken }, { skipAuth: true });
    }
    await auth.logout();
    assert.equal((await server.ssrLoadModule('/src/services/sessionStore.js')).getSession().status, 'anonymous');
  } catch (error) {
    // Axios errors include credentials/tokens in config; report only status and normalized message.
    throw new Error(`Live integration failed (${error.status || error.response?.status || 'client'}): ${error.message}`);
  } finally {
    if (auth) await auth.logout().catch(() => {});
    await server.close();
  }
});
