import api from "./api.js";
import { MSG, msg } from "../messages/index.js";

const writes = new Map();
async function write(method, url, data) {
    if (writes.has(url)) throw new Error(msg(MSG.MEDICAL_RELOAD));
    writes.set(url, true);
    try {
        const response = await api[method](url, data, { retryOnUnauthorized: false });
        if (!response.data?.id) throw new Error(msg(MSG.MEDICAL_RELOAD));
        writes.delete(url);
        return response;
    } catch (error) {
        if ([400, 413, 415, 422, 429].includes(error.status)) writes.delete(url);
        else error.message = msg(MSG.MEDICAL_RELOAD);
        throw error;
    }
}

export const getMedicalHorses = async (params = {}) => {
    const response = await api.get("/api/horses", { params });
    return response.data;
};

export const getMedicalSummary = async (horseId) => {
    const response = await api.get(`/api/horses/${encodeURIComponent(horseId)}/medical/summary`);
    return response.data;
};

export const getMedicalRecords = async (horseId, params = {}) => {
    const response = await api.get(`/api/horses/${encodeURIComponent(horseId)}/medical/records`, { params });
    return response.data;
};

export const createMedicalRecord = async (horseId, data) => {
    const response = await write('post', `/api/horses/${encodeURIComponent(horseId)}/medical/records`, data);
    return response.data;
};

export const correctMedicalRecord = async (horseId, recordId, data) => {
    const response = await write('put', `/api/horses/${encodeURIComponent(horseId)}/medical/records/${encodeURIComponent(recordId)}`, data);
    return response.data;
};

export const getMedicalInjuries = async (horseId, params = {}) => {
    const response = await api.get(`/api/horses/${encodeURIComponent(horseId)}/medical/injuries`, { params });
    return response.data;
};

export const createMedicalInjury = async (horseId, data) => {
    const response = await write('post', `/api/horses/${encodeURIComponent(horseId)}/medical/injuries`, data);
    return response.data;
};

export const getMedicalTreatments = async (horseId, params = {}) => {
    const response = await api.get(`/api/horses/${encodeURIComponent(horseId)}/medical/treatments`, { params });
    return response.data;
};

export const createMedicalTreatment = async (horseId, data) => {
    const response = await write('post', `/api/horses/${encodeURIComponent(horseId)}/medical/treatments`, data);
    return response.data;
};

export const updateMedicalTreatmentStatus = async (horseId, treatmentId, completed) => {
    const response = await write('put', `/api/horses/${encodeURIComponent(horseId)}/medical/treatments/${encodeURIComponent(treatmentId)}/status`, { completed });
    return response.data;
};

export const getMedicalRestrictions = async (horseId, params = {}) => {
    const response = await api.get(`/api/horses/${encodeURIComponent(horseId)}/medical/restrictions`, { params });
    return response.data;
};

export const createMedicalRestriction = async (horseId, data) => {
    const response = await write('post', `/api/horses/${encodeURIComponent(horseId)}/medical/restrictions`, data);
    return response.data;
};

export const getMedicalFollowUps = async (horseId, params = {}) => {
    const response = await api.get(`/api/horses/${encodeURIComponent(horseId)}/medical/follow-ups`, { params });
    return response.data;
};

export const createMedicalFollowUp = async (horseId, data) => {
    const response = await write('post', `/api/horses/${encodeURIComponent(horseId)}/medical/follow-ups`, data);
    return response.data;
};

export const getMedicalCaseHistory = async (horseId, recordId) => {
    const response = await api.get(`/api/horses/${encodeURIComponent(horseId)}/medical/records/${encodeURIComponent(recordId)}/history`);
    return response.data;
};
export const mergeMedicalCases = async (horseId, recordId, data) => {
    const response = await write('post', `/api/horses/${encodeURIComponent(horseId)}/medical/records/${encodeURIComponent(recordId)}/merge`, data);
    return response.data;
};