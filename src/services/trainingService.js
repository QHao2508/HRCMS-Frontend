import api from "./api.js";
/**
 * Tạo đường dẫn API với ID được encodeURIComponent để dữ liệu không chèn vào URL.
 * @param kind Giá trị kind truyền vào path; tham chiếu phần thân để xem cách dùng.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
const path = (kind, id) => `/api/training/${kind}${id ? `/${encodeURIComponent(id)}` : ""}`;
/**
 * Đọc danh sách có lọc/phân trang giáo án qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * @param params Giá trị params truyền vào listTemplates; tham chiếu phần thân để xem cách dùng.
 */
export const listTemplates = params => api.get(path("templates"), { params }).then(r => r.data);
/**
 * Tạo mới giáo án qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export const createTemplate = request => api.post(path("templates"), request).then(r => r.data);
/**
 * Chỉnh sửa giáo án qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export const editTemplate = (id, request) => api.put(path("templates", id), request).then(r => r.data);
/**
 * Lưu trữ giáo án qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
export const archiveTemplate = id => api.post(`${path("templates", id)}/archive`).then(r => r.data);
/**
 * Đọc danh sách có lọc/phân trang kế hoạch huấn luyện qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * @param params Giá trị params truyền vào listPlans; tham chiếu phần thân để xem cách dùng.
 */
export const listPlans = params => api.get(path("plans"), { params }).then(r => r.data);
/**
 * Tạo mới kế hoạch huấn luyện qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export const createPlan = request => api.post(path("plans"), request).then(r => r.data);
/**
 * Đọc chi tiết kế hoạch huấn luyện qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param params Giá trị params truyền vào getPlan; tham chiếu phần thân để xem cách dùng.
 */
export const getPlan = (id, params) => api.get(path("plans", id), { params }).then(r => r.data);
/**
 * Chỉnh sửa kế hoạch huấn luyện qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export const editPlan = (id, request) => api.put(path("plans", id), request).then(r => r.data);
/**
 * PUT enum trạng thái mới của kế hoạch; backend kiểm chuyển trạng thái và các buổi tập còn hoạt động.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param status Trạng thái enum API, tách khỏi nhãn tiếng Việt.
 */
export const changePlanStatus = (id, status) => api.put(`${path("plans", id)}/status`, { status }).then(r => r.data);
/**
 * Đọc lịch sử kế hoạch có phân trang; trả snapshot đã lưu thay vì suy diễn lịch sử từ dữ liệu hiện tại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param params Giá trị params truyền vào planHistory; tham chiếu phần thân để xem cách dùng.
 */
export const planHistory = (id, params) => api.get(`${path("plans", id)}/history`, { params }).then(r => r.data);
/**
 * Tạo mới buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export const createSession = (id, request) => api.post(`${path("plans", id)}/sessions`, request).then(r => r.data);
/**
 * Đọc danh sách có lọc/phân trang buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * @param params Giá trị params truyền vào listSessions; tham chiếu phần thân để xem cách dùng.
 */
export const listSessions = params => api.get(path("sessions"), { params }).then(r => r.data);
/**
 * Trả snapshot session hiện tại để React đọc nhất quán qua useSyncExternalStore.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
export const getSession = id => api.get(path("sessions", id)).then(r => r.data);
/**
 * Chỉnh sửa buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export const editSession = (id, request) => api.put(path("sessions", id), request).then(r => r.data);
/**
 * Bắt đầu buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
export const startSession = id => api.post(`${path("sessions", id)}/start`).then(r => r.data);
/**
 * Bỏ qua buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param reason Giá trị reason truyền vào skipSession; tham chiếu phần thân để xem cách dùng.
 */
export const skipSession = (id, reason) => api.post(`${path("sessions", id)}/skip`, { reason }).then(r => r.data);
/**
 * Gửi kết quả buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export const submitResult = (id, request) => api.post(`${path("sessions", id)}/results`, request).then(r => r.data);
/**
 * Đánh giá buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export const evaluateSession = (id, request) => api.post(`${path("sessions", id)}/evaluation`, request).then(r => r.data);
