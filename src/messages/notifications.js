import { MSG, msg } from './index.js';
import { serverMessage } from './serverMessages.js';

/**
 * Nội dung thông báo dịch theo `messageCode` (MessageKey của Backend), không dựa vào câu chữ server lưu.
 * Mã lạ (Backend thêm loại mới trước khi FE cập nhật) hiển thị câu chung thay vì câu tiếng Anh.
 * @param notification Dòng từ GET /api/notifications.
 */
export function notificationText(notification) {
    return serverMessage(notification?.messageCode, [], msg(MSG.NOTIFICATION_NEW));
}

/**
 * Tên đối tượng liên quan để người nhận biết thông báo nói về ngựa / hồ sơ / vật tư nào.
 * @param notification Dòng từ GET /api/notifications (horseName, subject do Backend tra khi đọc).
 */
export function notificationSubject(notification) {
    return notification?.horseName || notification?.subject || null;
}

// Màn hình mở khi bấm vào thông báo, theo NotificationType của Backend (giá trị enum, không phải chữ hiển thị).
const typeRoutes = Object.freeze({
    RegistrationReview: id => id && `/reviews/${encodeURIComponent(id)}`,
    RegistrationRevision: id => id && `/registrations/${encodeURIComponent(id)}`,
    SessionAssigned: id => id && `/training/sessions/${encodeURIComponent(id)}`,
    SessionUnassigned: () => '/training/sessions',
    SessionSkipped: id => id && `/training/sessions/${encodeURIComponent(id)}`,
    SessionOverdue: id => id && `/training/sessions/${encodeURIComponent(id)}`,
    SessionResult: () => '/training/sessions',
    IncidentReported: () => '/care/incidents',
    MedicalPreventiveDue: () => '/medical/preventive-care',
    MedicalFollowUpDue: () => '/medical/follow-up',
    CareAssigned: () => '/care/tasks',
    CareIssue: () => '/care/tasks',
    InventoryLowStock: () => '/inventory',
    InventoryReplenishment: () => '/inventory/replenishments',
    InventoryReplenishmentReviewed: () => '/inventory/replenishments',
    TreatmentTaskCompleted: () => '/medical/treatment',
});

/**
 * Đường dẫn trong ứng dụng ứng với thông báo; null khi không có màn hình phù hợp.
 * Thông báo trỏ thẳng vào ngựa mở hồ sơ ngựa; còn lại mở danh sách/chi tiết theo loại.
 * @param notification Dòng từ GET /api/notifications.
 */
export function notificationTarget(notification) {
    if (!notification) return null;
    const { type, referenceId, horseId } = notification;
    if (horseId && (referenceId === horseId || !Object.hasOwn(typeRoutes, type))) return `/horses/${encodeURIComponent(horseId)}`;
    return Object.hasOwn(typeRoutes, type) ? typeRoutes[type](referenceId) || null : null;
}
