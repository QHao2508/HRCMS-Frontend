// Ánh xạ trạng thái nghiệp vụ sang 5 tông màu của StatusBadge; chữ luôn đi kèm nên không chỉ dựa vào màu.
const health = { Fit: 'success', Monitoring: 'warning', Injured: 'danger', Isolated: 'info' };
const session = { Completed: 'success', InProgress: 'info', IssueReported: 'warning', Skipped: 'neutral', Assigned: 'neutral', Planned: 'neutral' };
const care = { Completed: 'success', InProgress: 'info', IssueReported: 'warning', Skipped: 'neutral', Pending: 'neutral' };

export const HEALTH_ORDER = ['Fit', 'Monitoring', 'Injured', 'Isolated'];
export const healthTone = value => health[value] || 'neutral';
export const sessionTone = value => session[value] || 'neutral';
export const careTone = value => care[value] || 'neutral';
