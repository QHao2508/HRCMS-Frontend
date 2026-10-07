import { ALL_ROLES, ROLES, isKnownRole, isRoleAllowed } from "../constants/roles.js";
import { HORSE_BROWSING_ROLES } from "../constants/horses.js";
import { TRAINING_TEMPLATE_ROLES } from "../constants/training.js";

// Add links only when their routes exist; future feature modules are intentionally absent.
const navigationItems = Object.freeze([
    Object.freeze({ to: "/dashboard", label: "Dashboard", allowedRoles: ALL_ROLES }),
    Object.freeze({ to: "/registrations", label: "Horse registrations", allowedRoles: ROLES.HorseOwner }),
    Object.freeze({ to: "/management/registrations", label: "Registration review", allowedRoles: ROLES.ClubManager }),
    Object.freeze({ to: "/horses", label: "Horses", allowedRoles: HORSE_BROWSING_ROLES }),
    Object.freeze({ to: "/training/templates", label: "Training Templates", allowedRoles: TRAINING_TEMPLATE_ROLES }),
]);

export function getNavigationForRole(role) {
    if (!isKnownRole(role)) return [];
    return navigationItems.filter((item) => isRoleAllowed(role, item.allowedRoles));
}
