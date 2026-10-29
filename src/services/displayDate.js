const zone = 'Asia/Ho_Chi_Minh';
export function clubInstant(value) {
    if (!value) return '';
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value) ? `${value}+07:00` : value;
}
const clubParts = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
function parts(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return Object.fromEntries(clubParts.formatToParts(date).map(part => [part.type, part.value]));
}
/** Thời điểm theo giờ CLB, luôn dạng "28/10/2026 09:00" (không có giây). */
export function clubDateTime(value) {
    const p = value ? parts(value) : null;
    return p ? `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}` : '—';
}
/** Như clubDateTime nhưng có giây, dùng khi cần phân biệt bản ghi cùng phút. */
export function clubDateTimeSeconds(value) {
    const p = value ? parts(value) : null;
    return p ? `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}:${p.second}` : '—';
}
/** Chỉ giờ:phút theo giờ CLB. */
export function clubTime(value) {
    const p = value ? parts(value) : null;
    return p ? `${p.hour}:${p.minute}` : '—';
}
/** Ngày hiển thị dd/mm/yyyy: giữ nguyên ngày lịch với giá trị chỉ có ngày, đổi sang giờ CLB với thời điểm. */
export function displayDate(value) {
    if (!value) return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return calendarDate(value);
    const p = parts(value);
    return p ? `${p.day}/${p.month}/${p.year}` : '—';
}
// Date-only values are calendar dates, not instants in the browser's timezone.
export function calendarDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
}
export function clubDateTimeInput(value = new Date()) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const parts = Object.fromEntries(new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
