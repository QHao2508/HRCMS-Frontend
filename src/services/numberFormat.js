import { MSG, msg, UI_LOCALE } from '../messages/index.js';

const toNumber = value => typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
const isNumber = value => typeof value === 'number' && Number.isFinite(value);
/** Số có dấu phân cách hàng nghìn kiểu Việt Nam: 8000 → "8.000". */
export const formatNumber = raw => { const value = toNumber(raw); return isNumber(value) ? value.toLocaleString(UI_LOCALE, { maximumFractionDigits: 2 }) : '—'; };
export const formatMetres = raw => isNumber(toNumber(raw)) ? msg(MSG.DISTANCE_VALUE, { value: formatNumber(raw) }) : '—';
/** Thời lượng từ số giây: 4000 → "1 giờ 6 phút", 45 → "45 giây". */
export function formatDuration(seconds) {
    if (!isNumber(seconds) || seconds < 0) return '—';
    if (seconds < 60) return msg(MSG.DURATION_SECONDS, { seconds: Math.round(seconds) });
    const totalMinutes = Math.round(seconds / 60);
    const hours = Math.floor(totalMinutes / 60), minutes = totalMinutes % 60;
    if (!hours) return msg(MSG.DURATION_MINUTES, { minutes });
    return minutes ? msg(MSG.DURATION_HOURS_MINUTES, { hours: formatNumber(hours), minutes }) : msg(MSG.DURATION_HOURS, { hours: formatNumber(hours) });
}
/** Nhãn kỳ báo cáo: ngày "2026-10-27" → "27/10/2026", tháng "2026-10" → "10/2026"; dạng khác giữ nguyên. */
export function reportPeriod(value) {
    const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (day) return `${day[3]}/${day[2]}/${day[1]}`;
    const month = /^(\d{4})-(\d{2})$/.exec(value || '');
    return month ? `${month[2]}/${month[1]}` : (value || '—');
}
