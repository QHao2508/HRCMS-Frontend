import { systemRegistrationCode } from "./horseIdentifiers.js";
export function activeTreatmentPlans(plans = []) {
    return plans.filter(plan => plan.completed === false);
}
export function canUploadIncidentPhoto(incident, user) {
    return !!user?.id && incident?.resolved === false && incident.reporterId === user.id;
}
export function horseRegistrationCode(horse) {
    return systemRegistrationCode(horse);
}