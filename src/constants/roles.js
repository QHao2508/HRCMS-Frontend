import { MSG, msg } from "../messages/index.js";
// Exact Role enum names from HorseClub.DAL/Domain/Entities.cs.
// Labels are presentation only; permission checks use these values directly.
export const ROLES = Object.freeze({
    HorseOwner: "HorseOwner",
    ClubManager: "ClubManager",
    HeadTrainer: "HeadTrainer",
    Trainer: "Trainer",
    WorkRider: "WorkRider",
    Veterinarian: "Veterinarian",
    Groom: "Groom",
});

export const ALL_ROLES = Object.freeze(Object.values(ROLES));

const labels = Object.freeze({
    [ROLES.HorseOwner]: msg(MSG.HORSE_OWNER),
    [ROLES.ClubManager]: msg(MSG.CLUB_MANAGER),
    [ROLES.HeadTrainer]: msg(MSG.HEAD_TRAINER),
    [ROLES.Trainer]: msg(MSG.TRAINER),
    [ROLES.WorkRider]: msg(MSG.WORK_RIDER),
    [ROLES.Veterinarian]: msg(MSG.VETERINARIAN),
    [ROLES.Groom]: msg(MSG.GROOM_STABLE_HAND),
});

/**
 * Chỉ nhận bảy tên enum role backend; không chấp nhận nhãn hiển thị hay biến thể chữ hoa/thường.
 * @param role Role enum chính xác của backend để kiểm quyền/lọc dữ liệu.
 */
export function isKnownRole(role) {
    return ALL_ROLES.includes(role);
}

/**
 * Trả nhãn tiếng Việt của role đã biết hoặc thông báo role không nhận diện.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param role Role enum chính xác của backend để kiểm quyền/lọc dữ liệu.
 */
export function getRoleLabel(role) {
    return isKnownRole(role) ? labels[role] : msg(MSG.UNRECOGNIZED_ROLE);
}

/**
 * Kiểm role chính xác trong allowlist; thiếu restriction nghĩa là chỉ cần đăng nhập, role lạ không được cấp quyền.
 * @param role Role enum chính xác của backend để kiểm quyền/lọc dữ liệu.
 * @param allowedRoles Allowlist enum role; role lạ không được cấp quyền.
 */
export function isRoleAllowed(role, allowedRoles) {
    // An omitted restriction means authenticated-only, not a default privileged role.
    if (allowedRoles === undefined) return true;
    if (!isKnownRole(role)) return false;
    const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return allowed.some((value) => isKnownRole(value) && value === role);
}
