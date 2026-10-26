import assert from 'node:assert/strict';
import { test } from 'node:test';
import { notificationText, notificationSubject, notificationTarget } from '../src/messages/notifications.js';

test('notifications are translated by messageCode, never by stored server text', () => {
    assert.match(notificationText({ messageCode: 'AHorseRegistrationRequiresReview', message: 'anything' }), /hồ sơ ngựa mới chờ duyệt/);
    assert.match(notificationText({ messageCode: 'AMedicalRestrictionChangedDuringYourSessionStopIncompatible' }), /liên hệ bác sĩ thú y/);
    // Câu tiếng Anh cũ không còn được dùng để nhận diện.
    assert.equal(notificationText({ message: 'A horse registration requires review.' }), 'Bạn có thông báo mới.');
    assert.equal(notificationText({ messageCode: 'FutureCode' }), 'Bạn có thông báo mới.');
    assert.equal(notificationText(null), 'Bạn có thông báo mới.');
});

test('notification subject shows the related horse, registration or item', () => {
    assert.equal(notificationSubject({ horseName: 'Thần Phong', subject: 'Hồ sơ' }), 'Thần Phong');
    assert.equal(notificationSubject({ subject: 'Cỏ khô Timothy' }), 'Cỏ khô Timothy');
    assert.equal(notificationSubject({}), null);
});

test('notification target opens the related screen', () => {
    const horse = 'h-1';
    assert.equal(notificationTarget({ type: 'HorseAssignment', referenceId: horse, horseId: horse }), '/horses/h-1');
    assert.equal(notificationTarget({ type: 'MedicalHealthChanged', referenceId: horse, horseId: horse }), '/horses/h-1');
    assert.equal(notificationTarget({ type: 'SessionAssigned', referenceId: 's-1', horseId: horse }), '/training/sessions/s-1');
    assert.equal(notificationTarget({ type: 'RegistrationReview', referenceId: 'r-1' }), '/reviews/r-1');
    assert.equal(notificationTarget({ type: 'CareAssigned', referenceId: 'c-1', horseId: horse }), '/care/tasks');
    assert.equal(notificationTarget({ type: 'InventoryLowStock', referenceId: 'i-1' }), '/inventory');
    assert.equal(notificationTarget({ type: 'FutureType', referenceId: 'x' }), null);
    assert.equal(notificationTarget(null), null);
});
