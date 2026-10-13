import { scheduledPayload } from './workflowHelpers.js';
export function isInFreeRange(localStart, durationMinutes, ranges = []) {
    const duration = Number(durationMinutes); const start = Date.parse(scheduledPayload(localStart));
    if (!localStart || !Number.isInteger(duration) || duration < 1 || duration > 480 || !Number.isFinite(start)) return false;
    return ranges.some(x => start >= Date.parse(x.start) && start + duration * 60000 <= Date.parse(x.end));
}
export const toMinute = value => { const [hours, minutes] = value.split(':').map(Number); return hours * 60 + minutes; };
export const minuteText = value => String(Math.floor(value / 60)).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
