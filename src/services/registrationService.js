import api from "./api.js";
import { registrationPayload } from "./registrationValidation.js";
import { PREFERENCES } from "../constants/registration.js";

const root = "/api/registrations";
const path = (id) => `${root}/${encodeURIComponent(id)}`;
export async function listRegistrations({ status = "", page = 1, pageSize = 20 } = {}) {
    return (await api.get(root, { params: { page, pageSize, ...(status ? { status } : {}) } })).data;
}
export async function getRegistration(id) { return (await api.get(path(id))).data; }
export async function createRegistration(form) { return (await api.post(root, registrationPayload(form))).data; }
export async function updateRegistration(id, form) { return (await api.put(path(id), registrationPayload(form))).data; }
export async function submitRegistration(id) {
    await api.post(`${path(id)}/submit`);
    return getRegistration(id); // 204 does not contain the new status.
}
export async function cancelRegistration(id) {
    await api.post(`${path(id)}/cancel`);
    return getRegistration(id);
}
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
