import { ALL_ROLES, ROLES, isKnownRole, isRoleAllowed } from "../constants/roles.js";

// Add links only when their routes exist; future feature modules are intentionally absent.
const navigationItems = Object.freeze([
    Object.freeze({ to: "/dashboard", label: "Dashboard", allowedRoles: ALL_ROLES }),
    Object.freeze({ to: "/registrations", label: "Horse registrations", allowedRoles: ROLES.HorseOwner }),
]);

export function getNavigationForRole(role) {
    if (!isKnownRole(role)) return [];
    return navigationItems.filter((item) => isRoleAllowed(role, item.allowedRoles));
}
