import api from "./api.js";

const path = (id) => `/api/horses/${encodeURIComponent(id)}`;
export async function listHorses({ search = "", healthStatus = "", page = 1, pageSize = 20 } = {}) {
    return (await api.get("/api/horses", { params: {
        page, pageSize, ...(search.trim() ? { search: search.trim() } : {}), ...(healthStatus ? { healthStatus } : {}),
    } })).data;
}
export async function getHorse(id) { return (await api.get(path(id))).data; }
export async function getHorsePhoto(id) {
    const { data } = await api.get(`${path(id)}/photo`, { responseType: "blob" });
    if (!(data instanceof Blob) || !data.size || !["image/png", "image/jpeg"].includes(data.type)) {
        throw new Error("The Horse photo could not be displayed.");
    }
    return data;
}
