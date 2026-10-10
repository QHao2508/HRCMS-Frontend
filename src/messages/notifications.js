import { MSG, msg } from './index.js';

// Match stored server messages first: one notification type can have several meanings.
const storedMessages = new Map([
    ["Horse is archived.", MSG.NOTIFICATION_HORSE_ARCHIVED],
    ["A horse registration requires review.", MSG.NOTIFICATION_AHORSE_REGISTRATION_REQUIRES_REVIEW],
    ["Your horse registration requires revision.", MSG.NOTIFICATION_YOUR_HORSE_REGISTRATION_REQUIRES_REVISION],
    ["Your horse registration was approved.", MSG.NOTIFICATION_YOUR_HORSE_REGISTRATION_WAS_APPROVED],
    ["You have been assigned to a horse.", MSG.NOTIFICATION_YOU_HAVE_BEEN_ASSIGNED_TO_AHORSE],
    ["Official horse staff assignment changed.", MSG.NOTIFICATION_OFFICIAL_HORSE_STAFF_ASSIGNMENT_CHANGED],
    ["A training session was assigned to you.", MSG.NOTIFICATION_ATRAINING_SESSION_WAS_ASSIGNED_TO_YOU],
    ["A training assignment was removed.", MSG.NOTIFICATION_ATRAINING_ASSIGNMENT_WAS_REMOVED],
    ["A rider submitted a session result.", MSG.NOTIFICATION_ARIDER_SUBMITTED_ASESSION_RESULT],
    ["A training observation requires review.", MSG.NOTIFICATION_ATRAINING_OBSERVATION_REQUIRES_REVIEW],
    ["A new incident requires review.", MSG.NOTIFICATION_ANEW_INCIDENT_REQUIRES_REVIEW],
    ["A session was skipped.", MSG.NOTIFICATION_ASESSION_WAS_SKIPPED],
    ["Horse health status changed. Review current training limits.", MSG.NOTIFICATION_HORSE_HEALTH_STATUS_CHANGED_REVIEW_CURRENT_TRAINING_LIMITS],
    ["Training restrictions changed. Review planned sessions.", MSG.NOTIFICATION_TRAINING_RESTRICTIONS_CHANGED_REVIEW_PLANNED_SESSIONS],
    ["A medical restriction changed during your session. Stop incompatible activity and contact the Veterinarian.", MSG.NOTIFICATION_AMEDICAL_RESTRICTION_CHANGED_DURING_YOUR_SESSION_STOP_INCOMPATIBLE],
    ["Medical clearance issued. Review the training plan before resuming.", MSG.NOTIFICATION_MEDICAL_CLEARANCE_ISSUED_REVIEW_THE_TRAINING_PLAN_BEFORE_RESUMING],
    ["Medical follow-up completed. Review current restrictions.", MSG.NOTIFICATION_MEDICAL_FOLLOW_UP_COMPLETED_REVIEW_CURRENT_RESTRICTIONS],
    ["Preventive care is due.", MSG.NOTIFICATION_PREVENTIVE_CARE_IS_DUE],
    ["A training session is overdue.", MSG.NOTIFICATION_ATRAINING_SESSION_IS_OVERDUE],
    ["Medical follow-up is due.", MSG.NOTIFICATION_MEDICAL_FOLLOW_UP_IS_DUE],
    ["A care task was assigned to you.", MSG.NOTIFICATION_ACARE_TASK_WAS_ASSIGNED_TO_YOU],
    ["A care task requires review.", MSG.NOTIFICATION_ACARE_TASK_REQUIRES_REVIEW],
    ["An inventory item reached its minimum stock.", MSG.NOTIFICATION_AN_INVENTORY_ITEM_REACHED_ITS_MINIMUM_STOCK],
    ["A replenishment request needs review.", MSG.NOTIFICATION_AREPLENISHMENT_REQUEST_NEEDS_REVIEW],
    ["Your replenishment request was reviewed.", MSG.NOTIFICATION_YOUR_REPLENISHMENT_REQUEST_WAS_REVIEWED],
]);
const typeMessages = Object.freeze({
    RegistrationReview: MSG.NOTIFICATION_AHORSE_REGISTRATION_REQUIRES_REVIEW,
    RegistrationRevision: MSG.NOTIFICATION_YOUR_HORSE_REGISTRATION_REQUIRES_REVISION,
    RegistrationApproved: MSG.NOTIFICATION_YOUR_HORSE_REGISTRATION_WAS_APPROVED,
    HorseAssignment: MSG.NOTIFICATION_OFFICIAL_HORSE_STAFF_ASSIGNMENT_CHANGED,
    SessionAssigned: MSG.NOTIFICATION_ATRAINING_SESSION_WAS_ASSIGNED_TO_YOU,
    SessionUnassigned: MSG.NOTIFICATION_ATRAINING_ASSIGNMENT_WAS_REMOVED,
    SessionResult: MSG.NOTIFICATION_ARIDER_SUBMITTED_ASESSION_RESULT,
    IncidentReported: MSG.NOTIFICATION_ANEW_INCIDENT_REQUIRES_REVIEW,
    SessionSkipped: MSG.NOTIFICATION_ASESSION_WAS_SKIPPED,
    MedicalHealthChanged: MSG.NOTIFICATION_HORSE_HEALTH_STATUS_CHANGED_REVIEW_CURRENT_TRAINING_LIMITS,
    MedicalRestrictionCreated: MSG.NOTIFICATION_TRAINING_RESTRICTIONS_CHANGED_REVIEW_PLANNED_SESSIONS,
    MedicalFollowUp: MSG.NOTIFICATION_MEDICAL_FOLLOW_UP_COMPLETED_REVIEW_CURRENT_RESTRICTIONS,
    MedicalPreventiveDue: MSG.NOTIFICATION_PREVENTIVE_CARE_IS_DUE,
    SessionOverdue: MSG.NOTIFICATION_ATRAINING_SESSION_IS_OVERDUE,
    MedicalFollowUpDue: MSG.NOTIFICATION_MEDICAL_FOLLOW_UP_IS_DUE,
    CareAssigned: MSG.NOTIFICATION_ACARE_TASK_WAS_ASSIGNED_TO_YOU,
    CareIssue: MSG.NOTIFICATION_ACARE_TASK_REQUIRES_REVIEW,
    InventoryLowStock: MSG.NOTIFICATION_AN_INVENTORY_ITEM_REACHED_ITS_MINIMUM_STOCK,
    InventoryReplenishment: MSG.NOTIFICATION_AREPLENISHMENT_REQUEST_NEEDS_REVIEW,
    InventoryReplenishmentReviewed: MSG.NOTIFICATION_YOUR_REPLENISHMENT_REQUEST_WAS_REVIEWED,
});
const numericTypes = ["RegistrationReview","RegistrationRevision","RegistrationApproved","HorseAssignment","SessionAssigned","SessionUnassigned","SessionResult","IncidentReported","SessionSkipped","MedicalHealthChanged","MedicalRestrictionCreated","MedicalFollowUp","MedicalPreventiveDue","SessionOverdue","MedicalFollowUpDue","CareAssigned","CareIssue","InventoryLowStock","InventoryReplenishment","InventoryReplenishmentReviewed"];

export function notificationText(notification) {
    const key = storedMessages.get(notification?.message?.trim());
    if (key) return msg(key);
    const type = typeof notification?.type === 'number' ? numericTypes[notification.type] : notification?.type;
    return msg(typeMessages[type] ?? MSG.NOTIFICATION_NEW);
}
