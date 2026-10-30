// Ánh xạ trạng thái nghiệp vụ sang 5 tông màu của StatusBadge; chữ luôn đi kèm nên không chỉ dựa vào màu.
const health = { Fit: 'success', Monitoring: 'warning', Injured: 'danger', Isolated: 'info' };
const session = { Completed: 'success', InProgress: 'info', IssueReported: 'warning', Skipped: 'neutral', Assigned: 'neutral', Planned: 'neutral' };
const care = { Completed: 'success', InProgress: 'info', IssueReported: 'warning', Skipped: 'neutral', Pending: 'neutral' };

const registration = { Draft: 'neutral', PendingReview: 'info', RevisionRequired: 'warning', Approved: 'success', Cancelled: 'neutral' };
const plan = { Active: 'success', Paused: 'warning', Completed: 'info', Archived: 'neutral' };

export const HEALTH_ORDER = ['Fit', 'Monitoring', 'Injured', 'Isolated'];
export const healthTone = value => health[value] || 'neutral';
export const sessionTone = value => session[value] || 'neutral';
export const careTone = value => care[value] || 'neutral';
export const registrationTone = value => registration[value] || 'neutral';
export const planTone = value => plan[value] || 'neutral';

// Trạng thái chung trong màn huấn luyện: Đang thực hiện / Hoàn thành = xanh, Tạm dừng / Có vấn đề = vàng, Chấn thương = đỏ.
const state = { ...session, ...plan, Fit: 'success', Monitoring: 'warning', Injured: 'danger', Isolated: 'info', Completed: 'success' };
export const stateTone = value => state[value] || 'neutral';
