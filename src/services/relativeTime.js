import { MSG, msg, UI_LOCALE } from '../messages/index.js';

const relative = new Intl.RelativeTimeFormat(UI_LOCALE, { numeric: 'auto' });
const steps = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];

/**
 * Thời gian tương đối tiếng Việt ("5 phút trước", "hôm qua"); dưới một phút hiển thị "Vừa xong".
 * @param value Thời điểm ISO từ API.
 * @param now Mốc so sánh (ms), dùng cho test.
 */
export function relativeTime(value, now = Date.now()) {
    const seconds = (Date.parse(value) - now) / 1000;
    if (!Number.isFinite(seconds)) return '';
    for (const [unit, size] of steps) if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
    return msg(MSG.NOTIFICATION_JUST_NOW);
}
