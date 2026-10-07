import { MSG, msg } from "../messages/index.js";
import { ROLES } from "./roles.js";

// Entities.cs / BusinessEnums.cs. Display labels never become API values.
export const REGISTRATION_STATUS = Object.freeze({
    Draft: "Draft", PendingReview: "PendingReview", RevisionRequired: "RevisionRequired",
    Approved: "Approved", Cancelled: "Cancelled",
});
export const STATUS_DISPLAY = Object.freeze({
    Draft: { label: msg(MSG.BAN_NHAP), color: "secondary" },
    PendingReview: { label: msg(MSG.CHO_DUYET), color: "primary" },
    RevisionRequired: { label: msg(MSG.CAN_CHINH_SUA), color: "warning" },
    Approved: { label: msg(MSG.DA_PHE_DUYET), color: "success" },
    Cancelled: { label: msg(MSG.DA_HUY), color: "secondary" },
});
/**
 * Tra nhãn/màu hồ sơ đăng ký theo enum, xử lý trạng thái lạ bằng fallback an toàn.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param status Trạng thái enum API, tách khỏi nhãn tiếng Việt.
 */
export function statusDisplay(status) {
    return Object.hasOwn(STATUS_DISPLAY, status) ? STATUS_DISPLAY[status] : { label: msg(MSG.CHUA_XAC_DINH), color: "secondary" };
}
/**
 * Chỉ cho sửa intake ở trạng thái Draft hoặc RevisionRequired theo hợp đồng backend.
 * @param status Trạng thái enum API, tách khỏi nhãn tiếng Việt.
 */
export function canEditRegistration(status) {
    return status === REGISTRATION_STATUS.Draft || status === REGISTRATION_STATUS.RevisionRequired;
}
export const HORSE_GENDER = Object.freeze({ Male: "Male", Female: "Female", Gelding: "Gelding" });
export const HORSE_GENDERS = Object.freeze(Object.values(HORSE_GENDER));
export const ATTACHMENT_TYPE = Object.freeze({ HorsePhoto: "HorsePhoto", Certificate: "Certificate", MedicalDocument: "MedicalDocument" });
export const ATTACHMENT_TYPES = Object.freeze(Object.values(ATTACHMENT_TYPE));
export const HEALTH_STATUS = Object.freeze({ Fit: "Fit", Monitoring: "Monitoring", Injured: "Injured", Isolated: "Isolated" });
export const ATTACHMENT_LABELS = Object.freeze({ HorsePhoto: msg(MSG.ANH_NGUA), Certificate: msg(MSG.CHUNG_NHAN), MedicalDocument: msg(MSG.TAI_LIEU_Y_TE) });
export const PREFERENCES = Object.freeze([
    { field: "preferredHeadTrainerId", role: ROLES.HeadTrainer, label: msg(MSG.PREFERRED_HEAD_TRAINER) },
    { field: "preferredGroomId", role: ROLES.Groom, label: msg(MSG.PREFERRED_GROOM) },
    { field: "preferredVeterinarianId", role: ROLES.Veterinarian, label: msg(MSG.PREFERRED_VETERINARIAN) },
]);
// Checked-in ClubOptions.cs/appsettings.json baseline; server overrides remain authoritative.
export const INTAKE_LIMITS = Object.freeze({ maxFileBytes: 10485760, maxAttachments: 20,
    minHeight: 1, maxHeight: 300, minWeight: 1, maxWeight: 2000, timeZone: "Asia/Ho_Chi_Minh" });

// Stable internal section identifiers, separate from display labels.
export const REGISTRATION_SECTION = Object.freeze({ Identity: "Horse information", Pedigree: "Pedigree", Physical: "Physical information", Health: "Initial health declaration", Boarding: "Boarding period" });
