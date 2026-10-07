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
    [ROLES.HorseOwner]: "Horse Owner",
    [ROLES.ClubManager]: "Club Manager",
    [ROLES.HeadTrainer]: "Head Trainer",
    [ROLES.Trainer]: "Trainer",
    [ROLES.WorkRider]: "Work Rider",
    [ROLES.Veterinarian]: "Veterinarian",
    [ROLES.Groom]: "Groom / Stable Hand",
});

export function isKnownRole(role) {
    return ALL_ROLES.includes(role);
}

export function getRoleLabel(role) {
    return isKnownRole(role) ? labels[role] : "Unrecognized role";
}

export function isRoleAllowed(role, allowedRoles) {
    // An omitted restriction means authenticated-only, not a default privileged role.
    if (allowedRoles === undefined) return true;
    if (!isKnownRole(role)) return false;
    const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return allowed.some((value) => isKnownRole(value) && value === role);
}
