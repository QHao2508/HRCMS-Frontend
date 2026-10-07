import { ROLES } from "./roles.js";

// Entities.cs / BusinessEnums.cs. Display labels never become API values.
export const REGISTRATION_STATUS = Object.freeze({
    Draft: "Draft", PendingReview: "PendingReview", RevisionRequired: "RevisionRequired",
    Approved: "Approved", Cancelled: "Cancelled",
});
export const STATUS_DISPLAY = Object.freeze({
    Draft: { label: "Draft", color: "secondary" },
    PendingReview: { label: "Pending review", color: "primary" },
    RevisionRequired: { label: "Revision required", color: "warning" },
    Approved: { label: "Approved", color: "success" },
    Cancelled: { label: "Cancelled", color: "secondary" },
});
export function statusDisplay(status) {
    return Object.hasOwn(STATUS_DISPLAY, status) ? STATUS_DISPLAY[status] : { label: "Unknown status", color: "secondary" };
}
export function canEditRegistration(status) {
    return status === REGISTRATION_STATUS.Draft || status === REGISTRATION_STATUS.RevisionRequired;
}
export const HORSE_GENDERS = Object.freeze(["Male", "Female", "Gelding"]);
export const ATTACHMENT_TYPES = Object.freeze(["HorsePhoto", "Certificate", "MedicalDocument"]);
export const ATTACHMENT_LABELS = Object.freeze({ HorsePhoto: "Horse photo", Certificate: "Certificate", MedicalDocument: "Medical document" });
export const PREFERENCES = Object.freeze([
    { field: "preferredHeadTrainerId", role: ROLES.HeadTrainer, label: "Preferred Head Trainer" },
    { field: "preferredGroomId", role: ROLES.Groom, label: "Preferred Groom" },
    { field: "preferredVeterinarianId", role: ROLES.Veterinarian, label: "Preferred Veterinarian" },
]);
// Checked-in ClubOptions.cs/appsettings.json baseline; server overrides remain authoritative.
export const INTAKE_LIMITS = Object.freeze({ maxFileBytes: 10485760, maxAttachments: 20,
    minHeight: 1, maxHeight: 300, minWeight: 1, maxWeight: 2000, timeZone: "Asia/Ho_Chi_Minh" });
