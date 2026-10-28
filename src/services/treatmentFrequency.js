import { MSG, msg } from '../messages/index.js';

// Existing descriptive schedules keep their meaning; bare counts are per day.
export function treatmentFrequency(value) {
    const text = String(value ?? '').trim();
    const count = text.match(/^(\d+)\s*(?:\/\s*ngày)?$/u);
    return count ? msg(MSG.TREAT_FREQUENCY_PER_DAY, { count: count[1] }) : text;
}
