import { ROLES } from "./roles.js";

export const TRAINING_TEMPLATE_ROLES = Object.freeze([
    ROLES.ClubManager,
    ROLES.HeadTrainer,
    ROLES.Trainer,
]);

export const TRAINING_INTENSITIES = Object.freeze(["Light", "Moderate", "Heavy"]);

export const TRAINING_PLAN_ROLES = Object.freeze([
    ROLES.ClubManager,
    ROLES.HorseOwner,
    ROLES.HeadTrainer,
    ROLES.Trainer,
    ROLES.WorkRider,
    ROLES.Veterinarian,
]);

export const TRAINING_HISTORY_ROLES = Object.freeze([
    ROLES.ClubManager,
    ROLES.HorseOwner,
    ROLES.HeadTrainer,
    ROLES.Trainer,
    ROLES.Veterinarian,
]);

export const TRAINING_PLAN_STATUSES = Object.freeze(["Active", "Paused", "Completed", "Archived"]);

export const TRAINING_TYPES = Object.freeze(["Walk", "Trot", "Canter", "Gallop", "Sprint", "Recovery"]);

export const TRAINING_SESSION_STATUSES = Object.freeze(["Planned", "Assigned", "InProgress", "Completed", "Skipped", "IssueReported"]);

export const TRAINING_SESSION_EDITABLE_STATUSES = Object.freeze(["Planned", "Assigned"]);

export const SESSION_LIMITS = Object.freeze({ text: 4000, minDistance: 1, maxDistance: 100000 });

export const SESSION_RESULT_LIMITS = Object.freeze({
    text: 4000,
    minDistance: 0,
    maxDistance: 100000,
    minTimeSeconds: 0.001,
    maxTimeSeconds: 86400,
    minHeartRate: 1,
    maxHeartRate: 300,
    skipReason: 2000,
});

export const TRAINER_EVALUATION_LIMITS = Object.freeze({ comment: 4000 });

export const TEMPLATE_LIMITS = Object.freeze({
    name: 200,
    text: 4000,
    minDistance: 1,
    maxDistance: 100000,
    minFrequency: 1,
    maxFrequency: 21,
});
