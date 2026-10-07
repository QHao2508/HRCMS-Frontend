import api from "./api.js";
const idPath = id => encodeURIComponent(id);
export const listHorses = (params = {}) => api.get("/api/horses", { params }).then(r => r.data);
export const getHorse = id => api.get(`/api/horses/${idPath(id)}`).then(r => r.data);
export const assignStaff = (id, request) => api.post(`/api/horses/${idPath(id)}/assignments`, request).then(r => r.data);
export const reviewRegistration = (id, request) => api.post(`/api/registrations/${idPath(id)}/review`, request).then(r => r.data);
export const editAdministrativeRegistration = (id, request) => api.put(`/api/registrations/${idPath(id)}`, request).then(r => r.data);
export async function staffDirectory(role) {
    const items = [];
    for (let page = 1; ; page++) {
        const { data } = await api.get("/api/staff/directory", { params: { role, page, pageSize: 100 } });
        items.push(...data.items.filter(item => item.role === role));
        if (!data.items.length || data.page * data.pageSize >= data.total) break;
    }
    return items;
}
export const fetchHorsePhoto = id => api.get(`/api/horses/${idPath(id)}/photo`, { responseType: "blob" }).then(r => r.data);
