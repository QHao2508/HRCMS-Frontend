// Ngày làm việc của câu lạc bộ luôn tính theo giờ Việt Nam (UTC+7), không theo múi giờ của trình duyệt.
const zone = 'Asia/Ho_Chi_Minh';
const dayParts = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
const longDate = new Intl.DateTimeFormat('vi-VN', { timeZone: zone, weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

function parts(now) {
    return Object.fromEntries(dayParts.formatToParts(now).map(part => [part.type, part.value]));
}

/** Khoảng [from, to) của ngày CLB chứa `now`, dạng ISO có +07:00 để gửi lên API. */
export function clubDayRange(now = new Date()) {
    const p = parts(now);
    const from = new Date(`${p.year}-${p.month}-${p.day}T00:00:00+07:00`);
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
}

/** Buổi trong ngày theo giờ CLB: sáng trước 11h, chiều trước 18h, còn lại là tối. */
export function dayPeriod(now = new Date()) {
    const hour = Number(parts(now).hour);
    return hour < 11 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
}

/** "Thứ Năm, 29/10/2026" theo giờ CLB; viết hoa chữ đầu. */
export function clubLongDate(now = new Date()) {
    const text = longDate.format(now);
    return text.charAt(0).toLocaleUpperCase('vi-VN') + text.slice(1);
}

/** Khóa ngày "YYYY-MM-DD" theo giờ CLB của một thời điểm; rỗng khi không hợp lệ. */
export function clubDateKey(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const p = parts(date);
    return `${p.year}-${p.month}-${p.day}`;
}

/** "today" | "tomorrow" | null: thời điểm rơi vào hôm nay hay ngày mai theo lịch CLB. */
export function relativeClubDay(value, now = new Date()) {
    const key = clubDateKey(value);
    if (!key) return null;
    if (key === clubDateKey(now)) return 'today';
    return key === clubDateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000)) ? 'tomorrow' : null;
}

/** Tuổi tròn năm tính từ ngày sinh (YYYY-MM-DD) đến hôm nay theo giờ CLB; null khi thiếu dữ liệu. */
export function ageInYears(dateOfBirth, now = new Date()) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateOfBirth || '');
    if (!match) return null;
    const [year, month, day] = clubDateKey(now).split('-').map(Number);
    const age = year - Number(match[1]) - (month < Number(match[2]) || (month === Number(match[2]) && day < Number(match[3])) ? 1 : 0);
    return age >= 0 ? age : null;
}
