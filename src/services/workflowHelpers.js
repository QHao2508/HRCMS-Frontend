/**
 * Kiểm user ID/role trong phân công đang hoạt động của ngựa để quyết định action UI; API vẫn kiểm quyền lại.
 * @param horse Giá trị horse truyền vào isAssigned; tham chiếu phần thân để xem cách dùng.
 * @param user Tài khoản đã tra cứu/kiểm; response chỉ được lấy trường cho phép.
 * @param role Role enum chính xác của backend để kiểm quyền/lọc dữ liệu.
 */
export function isAssigned(horse, user, role) { return !horse?.horse?.archived && !horse?.historyOnly && user?.role === role && horse?.assignments?.some(a => a.active && a.staffId === user.id && a.role === role); }
/**
 * Tạo ngày ISO hiện tại theo timezone câu lạc bộ để mặc định/kiểm ngày form.
 */
export const clubToday = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
/**
 * Tạo chuỗi datetime-local theo giờ câu lạc bộ cho input; không dùng locale hiển thị để tạo payload.
 * @param value Giá trị value truyền vào localDateTime; tham chiếu phần thân để xem cách dùng.
 */
export function localDateTime(value) { if (!value) return ""; const date = new Date(value); if (!Number.isFinite(date.getTime())) return ""; return new Intl.DateTimeFormat("sv-SE", { year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:"Asia/Ho_Chi_Minh" }).format(date).replace(" ","T"); }
/**
 * Chuyển datetime-local sang thời điểm có offset nghiệp vụ để backend nhận đúng UTC.
 * @param value Giá trị value truyền vào scheduledPayload; tham chiếu phần thân để xem cách dùng.
 */
export function scheduledPayload(value) { return `${value}:00+07:00`; }
