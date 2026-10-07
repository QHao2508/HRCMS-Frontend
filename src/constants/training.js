import { ROLES } from "./roles.js";

export const TRAINING_TEMPLATE_ROLES = Object.freeze([
    ROLES.ClubManager,
    ROLES.HeadTrainer,
    ROLES.Trainer,
]);

export const TRAINING_INTENSITIES = Object.freeze(["Light", "Moderate", "Heavy"]);

export const TEMPLATE_LIMITS = Object.freeze({
    name: 200,
    text: 4000,
    minDistance: 1,
    maxDistance: 100000,
    minFrequency: 1,
    maxFrequency: 21,
});
