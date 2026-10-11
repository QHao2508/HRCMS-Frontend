import api from './api.js';
import { MSG, msg } from '../messages/index.js';
export const read = (path, params) => api.get(path, { params }).then(r => r.data);
export const change = (path, data, method = 'post') => api[method](path, data, { retryOnUnauthorized: false }).then(r => r.data);
export const id = value => encodeURIComponent(value);
export async function allPages(path, params = {}) {
    const items = [];
    for (let page = 1; page <= 1000; page++) {
        const data = await read(path, { ...params, page, pageSize: 100 });
        if (!Array.isArray(data?.items) || data.page !== page || !Number.isInteger(data.total)) throw new Error(msg(MSG.MEDICAL_INVALID_RESPONSE));
        items.push(...data.items);
        if (items.length >= data.total) return items;
        if (!data.items.length) break;
    }
    throw new Error(msg(MSG.MEDICAL_INVALID_RESPONSE));
}
