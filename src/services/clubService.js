import api from "./api.js";
/**
 * Encode ID trước khi ghép đường dẫn endpoint ngựa/hồ sơ.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
const idPath = id => encodeURIComponent(id);
/**
 * Đọc danh sách có lọc/phân trang ngựa qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * @param params Giá trị params truyền vào listHorses; tham chiếu phần thân để xem cách dùng.
 */
export const listHorses = (params = {}) => api.get("/api/horses", { params }).then(r => r.data);
/**
 * Đọc chi tiết ngựa qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
export const getHorse = id => api.get(`/api/horses/${idPath(id)}`).then(r => r.data);
/**
 * Phân công nhân viên qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export const assignStaff = (id, request) => api.post(`/api/horses/${idPath(id)}/assignments`, request).then(r => r.data);
/**
 * Duyệt hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export const reviewRegistration = (id, request) => api.post(`/api/registrations/${idPath(id)}/review`, request).then(r => r.data);
/**
 * Chỉnh sửa Administrative Registration qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param request Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP.
 */
export const editAdministrativeRegistration = (id, request) => api.put(`/api/registrations/${idPath(id)}`, request).then(r => r.data);
/**
 * Đọc hết trang danh bạ theo role, lọc kết quả đúng role và trả danh sách để chọn người phân công.
 * @param role Role enum chính xác của backend để kiểm quyền/lọc dữ liệu.
 */
export async function staffDirectory(role) {
    const items = [];
    for (let page = 1; ; page++) {
        const { data } = await api.get("/api/staff/directory", { params: { role, page, pageSize: 100 } });
        items.push(...data.items.filter(item => item.role === role));
        if (!data.items.length || data.page * data.pageSize >= data.total) break;
    }
    return items;
}
/**
 * Tải dữ liệu Horse Photo qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
export const fetchHorsePhoto = id => api.get(`/api/horses/${idPath(id)}/photo`, { responseType: "blob" }).then(r => r.data);
