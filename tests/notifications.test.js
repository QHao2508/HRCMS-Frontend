import assert from 'node:assert/strict';
import { test } from 'node:test';
import { notificationText } from '../src/messages/notifications.js';

test('stored English registration notifications render in Vietnamese', () => {
    assert.equal(notificationText({ type: 'RegistrationReview', message: 'A horse registration requires review.' }), 'Có hồ sơ đăng ký ngựa cần xét duyệt.');
});
test('specific medical notification retains its meaning instead of the type summary', () => {
    assert.equal(notificationText({ type: 'MedicalRestrictionCreated', message: 'A medical restriction changed during your session. Stop incompatible activity and contact the Veterinarian.' }), 'Hạn chế y tế đã thay đổi trong buổi tập. Hãy dừng hoạt động không phù hợp và liên hệ bác sĩ thú y.');
});
test('all current notification types and unknown future events have Vietnamese fallbacks', () => {
    for (const type of ["RegistrationReview","RegistrationRevision","RegistrationApproved","HorseAssignment","SessionAssigned","SessionUnassigned","SessionResult","IncidentReported","SessionSkipped","MedicalHealthChanged","MedicalRestrictionCreated","MedicalFollowUp","MedicalPreventiveDue","SessionOverdue","MedicalFollowUpDue","CareAssigned","CareIssue","InventoryLowStock","InventoryReplenishment","InventoryReplenishmentReviewed"]) assert.notEqual(notificationText({ type }), 'Bạn có thông báo mới.');
    assert.equal(notificationText({ type: 0 }), 'Có hồ sơ đăng ký ngựa cần xét duyệt.');
    assert.equal(notificationText({ type: 'FutureType', message: 'Future server message' }), 'Bạn có thông báo mới.');
    assert.equal(notificationText(null), 'Bạn có thông báo mới.');
});
