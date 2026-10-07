import { SESSION_LIMITS, SESSION_RESULT_LIMITS, TRAINER_EVALUATION_LIMITS, TRAINING_INTENSITIES, TRAINING_SESSION_STATUSES, TRAINING_TYPES } from "../constants/training.js";

export const emptySessionForm = Object.freeze({ scheduledAt: "", trainingType: "", distanceMetres: "", intensity: "", surface: "", target: "", notes: "", riderId: "" });
export const emptySessionResultForm = Object.freeze({ distanceMetres: "", timeSeconds: "", heartRate: "", intensity: "", feedback: "", abnormalObservation: false });
export const emptyTrainerEvaluationForm = Object.freeze({ comment: "", adjustFutureSessions: false });

const pad = (value) => String(value).padStart(2, "0");
export function sessionDateTimeInput(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function sessionForm(session = emptySessionForm) {
    return {
        scheduledAt: session.scheduledAt ? sessionDateTimeInput(session.scheduledAt) : "",
        trainingType: session.trainingType || "",
        distanceMetres: session.distanceMetres == null ? "" : String(session.distanceMetres),
        intensity: session.intensity || "",
        surface: session.surface || "",
        target: session.target || "",
        notes: session.notes || "",
        riderId: session.riderId || "",
    };
}

function validLocalDateTime(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
    if (!match) return false;
    const parts = match.slice(1).map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5] || 0);
    return Number.isFinite(date.getTime()) && date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1
        && date.getDate() === parts[2] && date.getHours() === parts[3] && date.getMinutes() === parts[4] && date.getSeconds() === (parts[5] || 0);
}

export function validSessionDateTime(value) {
    if (typeof value !== "string" || !value) return false;
    return validLocalDateTime(value) || /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) && Number.isFinite(Date.parse(value));
}

export function sessionInstant(value, original) {
    if (original && value === sessionDateTimeInput(original)) return original;
    return new Date(value).toISOString();
}

export function validateSession(values) {
    const errors = {};
    if (!validSessionDateTime(values.scheduledAt)) errors.scheduledAt = "Choose a valid scheduled date and time.";
    if (!TRAINING_TYPES.includes(values.trainingType)) errors.trainingType = "Choose a supported training type.";
    const distance = Number(values.distanceMetres);
    if (!Number.isFinite(distance) || distance < SESSION_LIMITS.minDistance || distance > SESSION_LIMITS.maxDistance)
        errors.distanceMetres = `Distance must be ${SESSION_LIMITS.minDistance}–${SESSION_LIMITS.maxDistance} metres.`;
    if (!TRAINING_INTENSITIES.includes(values.intensity)) errors.intensity = "Choose a supported intensity.";
    for (const field of ["surface", "target"]) {
        const value = typeof values[field] === "string" ? values[field].trim() : "";
        if (!value || value.length > SESSION_LIMITS.text) errors[field] = `Enter ${field} of 1–${SESSION_LIMITS.text} characters.`;
    }
    if (typeof values.notes !== "string" || values.notes.length > SESSION_LIMITS.text) errors.notes = `Use at most ${SESSION_LIMITS.text} characters.`;
    if (values.riderId !== "" && typeof values.riderId !== "string") errors.riderId = "Choose an eligible WorkRider or leave the session unassigned.";
    return errors;
}

export function sessionPayload(values, original) {
    return {
        scheduledAt: sessionInstant(values.scheduledAt, original?.scheduledAt),
        trainingType: values.trainingType,
        distanceMetres: Number(values.distanceMetres),
        intensity: values.intensity,
        surface: values.surface.trim(),
        target: values.target.trim(),
        notes: values.notes,
        riderId: values.riderId || null,
    };
}

export function validTrainingSession(value, expected = {}) {
    return !!(value && typeof value.id === "string" && value.id.trim()
        && typeof value.horseId === "string" && value.horseId.trim()
        && typeof value.planId === "string" && value.planId.trim()
        && (value.riderId === null || typeof value.riderId === "string" && value.riderId.trim())
        && validSessionDateTime(value.scheduledAt) && TRAINING_TYPES.includes(value.trainingType)
        && Number.isFinite(value.distanceMetres) && value.distanceMetres >= SESSION_LIMITS.minDistance && value.distanceMetres <= SESSION_LIMITS.maxDistance
        && TRAINING_INTENSITIES.includes(value.intensity) && typeof value.surface === "string" && typeof value.target === "string" && typeof value.notes === "string"
        && TRAINING_SESSION_STATUSES.includes(value.status) && (value.startedAt === null || validSessionDateTime(value.startedAt))
        && (!expected.id || value.id === expected.id) && (!expected.horseId || value.horseId === expected.horseId)
        && (!expected.planId || value.planId === expected.planId));
}

export function isAssignedWorkRider(user, session) {
    return user?.role === "WorkRider" && typeof user.id === "string" && typeof session?.riderId === "string"
        && user.id.toLowerCase() === session.riderId.toLowerCase();
}

export function validateSessionResult(values) {
    const errors = {};
    const distance = Number(values.distanceMetres);
    if (!Number.isFinite(distance) || distance < SESSION_RESULT_LIMITS.minDistance || distance > SESSION_RESULT_LIMITS.maxDistance)
        errors.distanceMetres = `Distance must be ${SESSION_RESULT_LIMITS.minDistance}–${SESSION_RESULT_LIMITS.maxDistance} metres.`;
    const time = Number(values.timeSeconds);
    if (!Number.isFinite(time) || time < SESSION_RESULT_LIMITS.minTimeSeconds || time > SESSION_RESULT_LIMITS.maxTimeSeconds)
        errors.timeSeconds = `Time must be ${SESSION_RESULT_LIMITS.minTimeSeconds}–${SESSION_RESULT_LIMITS.maxTimeSeconds} seconds.`;
    if (values.heartRate !== "") {
        const heartRate = Number(values.heartRate);
        if (!Number.isInteger(heartRate) || heartRate < SESSION_RESULT_LIMITS.minHeartRate || heartRate > SESSION_RESULT_LIMITS.maxHeartRate)
            errors.heartRate = `Heart rate must be a whole number from ${SESSION_RESULT_LIMITS.minHeartRate}–${SESSION_RESULT_LIMITS.maxHeartRate}, or blank.`;
    }
    if (!TRAINING_INTENSITIES.includes(values.intensity)) errors.intensity = "Choose a supported intensity.";
    const feedback = typeof values.feedback === "string" ? values.feedback.trim() : "";
    if (!feedback || feedback.length > SESSION_RESULT_LIMITS.text) errors.feedback = `Enter feedback of 1–${SESSION_RESULT_LIMITS.text} characters.`;
    if (typeof values.abnormalObservation !== "boolean") errors.abnormalObservation = "Choose whether an abnormal observation occurred.";
    return errors;
}

export function sessionResultPayload(values) {
    return {
        distanceMetres: Number(values.distanceMetres),
        timeSeconds: Number(values.timeSeconds),
        heartRate: values.heartRate === "" ? null : Number(values.heartRate),
        intensity: values.intensity,
        feedback: values.feedback.trim(),
        abnormalObservation: values.abnormalObservation,
    };
}

export function validSessionResult(value, expected = {}) {
    return !!(value && typeof value.id === "string" && value.id.trim()
        && typeof value.sessionId === "string" && value.sessionId.trim()
        && Number.isFinite(value.distanceMetres) && value.distanceMetres >= SESSION_RESULT_LIMITS.minDistance && value.distanceMetres <= SESSION_RESULT_LIMITS.maxDistance
        && Number.isFinite(value.timeSeconds) && value.timeSeconds >= SESSION_RESULT_LIMITS.minTimeSeconds && value.timeSeconds <= SESSION_RESULT_LIMITS.maxTimeSeconds
        && Number.isFinite(value.speedMetresPerSecond) && value.speedMetresPerSecond >= 0
        && (value.heartRate === null || Number.isInteger(value.heartRate) && value.heartRate >= SESSION_RESULT_LIMITS.minHeartRate && value.heartRate <= SESSION_RESULT_LIMITS.maxHeartRate)
        && TRAINING_INTENSITIES.includes(value.intensity) && typeof value.feedback === "string" && typeof value.abnormalObservation === "boolean"
        && (!expected.sessionId || value.sessionId === expected.sessionId));
}

export function validateTrainerEvaluation(values) {
    const errors = {};
    const comment = typeof values.comment === "string" ? values.comment.trim() : "";
    if (!comment || comment.length > TRAINER_EVALUATION_LIMITS.comment)
        errors.comment = `Enter an evaluation comment of 1–${TRAINER_EVALUATION_LIMITS.comment} characters.`;
    if (typeof values.adjustFutureSessions !== "boolean") errors.adjustFutureSessions = "Choose whether future sessions may need adjustment.";
    return errors;
}

export function trainerEvaluationPayload(values) {
    return { comment: values.comment.trim(), adjustFutureSessions: values.adjustFutureSessions };
}

export function validTrainerEvaluation(value, expected = {}) {
    return !!(value && typeof value.id === "string" && value.id.trim()
        && typeof value.sessionId === "string" && value.sessionId.trim()
        && typeof value.trainerId === "string" && value.trainerId.trim()
        && typeof value.comment === "string" && value.comment.trim() && value.comment.length <= TRAINER_EVALUATION_LIMITS.comment
        && typeof value.adjustFutureSessions === "boolean"
        && (!expected.sessionId || value.sessionId === expected.sessionId)
        && (!expected.trainerId || value.trainerId.toLowerCase() === expected.trainerId.toLowerCase()));
}

export function validateSkipReason(reason) {
    const value = typeof reason === "string" ? reason.trim() : "";
    return value && value.length <= SESSION_RESULT_LIMITS.skipReason ? "" : `Enter a skip reason of 1–${SESSION_RESULT_LIMITS.skipReason} characters.`;
}

function appliesAt(restriction, instant) {
    if (!restriction || restriction.cleared === true) return false;
    const from = Date.parse(restriction.validFrom);
    const until = restriction.validUntil == null ? Infinity : Date.parse(restriction.validUntil);
    return Number.isFinite(from) && (until === Infinity || Number.isFinite(until)) && from <= instant && instant <= until;
}

export function sessionMedicalBlocks(horseDetail, restrictions, values) {
    if (!validSessionDateTime(values.scheduledAt)) return [];
    const instant = Date.parse(sessionInstant(values.scheduledAt));
    const blocks = [];
    const health = horseDetail?.horse?.healthStatus;
    if (health === "Isolated") blocks.push({ code: "isolated", message: "The Horse is isolated, so all training is blocked." });
    if (health === "Injured" && values.intensity === "Heavy") blocks.push({ code: "injured-heavy", message: "Heavy training is blocked while the Horse is injured." });
    const intensity = TRAINING_INTENSITIES.indexOf(values.intensity);
    for (const restriction of Array.isArray(restrictions) ? restrictions : []) {
        if (!appliesAt(restriction, instant)) continue;
        const suffix = restriction.reason ? ` Reason: ${restriction.reason}` : "";
        if (restriction.blockAllTraining) blocks.push({ code: "block-all", message: `An applicable restriction blocks all training.${suffix}`, restriction });
        if (restriction.trainingLock && values.intensity === "Heavy") blocks.push({ code: "training-lock", message: `An applicable training lock blocks Heavy intensity.${suffix}`, restriction });
        const maximum = TRAINING_INTENSITIES.indexOf(restriction.maxIntensity);
        if (maximum >= 0 && intensity > maximum) blocks.push({ code: "max-intensity", message: `Intensity exceeds the applicable ${restriction.maxIntensity} maximum.${suffix}`, restriction });
        if (restriction.maxDistanceMetres != null && Number(values.distanceMetres) > Number(restriction.maxDistanceMetres))
            blocks.push({ code: "max-distance", message: `Distance exceeds the applicable ${restriction.maxDistanceMetres} metre maximum.${suffix}`, restriction });
        if (restriction.noSprint && values.trainingType === "Sprint") blocks.push({ code: "no-sprint", message: `An applicable restriction blocks Sprint training.${suffix}`, restriction });
    }
    return blocks;
}
