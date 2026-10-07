import { ALL_ROLES } from "./roles.js";

// ClubAccess.Horses/Horse permits these roles with server-enforced record scope.
export const HORSE_BROWSING_ROLES = ALL_ROLES;
export const HEALTH_STATUSES = Object.freeze(["Fit", "Monitoring", "Injured", "Isolated"]);
const healthColors = Object.freeze({ Fit: "success", Monitoring: "warning", Injured: "danger", Isolated: "secondary" });
export function healthDisplay(value) {
    return HEALTH_STATUSES.includes(value) ? { label: value, color: healthColors[value] }
        : { label: "Unknown health status", color: "secondary" };
}
