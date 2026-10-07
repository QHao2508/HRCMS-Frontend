import api from "./api.js";
import { registrationPayload } from "./registrationValidation.js";
import { PREFERENCES } from "../constants/registration.js";

const root = "/api/registrations";
/**
 * Tạo đường dẫn API với ID được encodeURIComponent để dữ liệu không chèn vào URL.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
const path = (id) => `${root}/${encodeURIComponent(id)}`;
/**
 * Đọc danh sách có lọc/phân trang hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * @param options0 Đối tượng destructuring: { status = "", page = 1, pageSize = 20 } = {}. Các props/callback lấy từ caller.
 */
export async function listRegistrations({ status = "", page = 1, pageSize = 20 } = {}) {
    return (await api.get(root, { params: { page, pageSize, ...(status ? { status } : {}) } })).data;
}
/**
 * Đọc chi tiết hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
export async function getRegistration(id) { return (await api.get(path(id))).data; }
/**
 * Tạo mới hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param form Giá trị form controlled, chưa được coi là dữ liệu đã lưu ở server.
 */
export async function createRegistration(form) { return (await api.post(root, registrationPayload(form))).data; }
/**
 * Cập nhật hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param form Giá trị form controlled, chưa được coi là dữ liệu đã lưu ở server.
 */
export async function updateRegistration(id, form) { return (await api.put(path(id), registrationPayload(form))).data; }
/**
 * Gửi hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
export async function submitRegistration(id) {
    await api.post(`${path(id)}/submit`);
    return getRegistration(id); // 204 does not contain the new status.
}
/**
 * Hủy hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
export async function cancelRegistration(id) {
    await api.post(`${path(id)}/cancel`);
    return getRegistration(id);
}
/**
 * Đọc danh sách có lọc/phân trang Preferred Staff qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 */
export async function listPreferredStaff() {
    const groups = await Promise.all(PREFERENCES.map(async ({ role }) => {
        const staff = [];
        let page = 1;
        for (;;) {
            const { data } = await api.get("/api/staff/directory", { params: { role, page, pageSize: 20 } });
            staff.push(...data.items.filter((person) => person.role === role));
            if (data.page * data.pageSize >= data.total || !data.items.length) break;
            page = data.page + 1;
        }
        return [role, staff];
    }));
    return Object.fromEntries(groups);
}
