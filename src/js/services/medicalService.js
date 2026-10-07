import api from "./api";

export const getMedicalHorses = async (params = {}) => {
    const response = await api.get("/api/horses", { params });
    return response.data;
};

export const getMedicalSummary = async (horseId) => {
    const response = await api.get(`/api/horses/${horseId}/medical/summary`);
    return response.data;
};

export const getMedicalRecords = async (horseId, params = {}) => {
    const response = await api.get(`/api/horses/${horseId}/medical/records`, { params });
    return response.data;
};

export const createMedicalRecord = async (horseId, data) => {
    const response = await api.post(`/api/horses/${horseId}/medical/records`, data);
    return response.data;
};

export const correctMedicalRecord = async (horseId, recordId, data) => {
    const response = await api.put(`/api/horses/${horseId}/medical/records/${recordId}`, data);
    return response.data;
};

export const getMedicalInjuries = async (horseId, params = {}) => {
    const response = await api.get(`/api/horses/${horseId}/medical/injuries`, { params });
    return response.data;
};

export const createMedicalInjury = async (horseId, data) => {
    const response = await api.post(`/api/horses/${horseId}/medical/injuries`, data);
    return response.data;
};

export const getMedicalTreatments = async (horseId, params = {}) => {
    const response = await api.get(`/api/horses/${horseId}/medical/treatments`, { params });
    return response.data;
};

export const createMedicalTreatment = async (horseId, data) => {
    const response = await api.post(`/api/horses/${horseId}/medical/treatments`, data);
    return response.data;
};

export const getMedicalRestrictions = async (horseId, params = {}) => {
    const response = await api.get(`/api/horses/${horseId}/medical/restrictions`, { params });
    return response.data;
};

export const createMedicalRestriction = async (horseId, data) => {
    const response = await api.post(`/api/horses/${horseId}/medical/restrictions`, data);
    return response.data;
};

export const getMedicalFollowUps = async (horseId, params = {}) => {
    const response = await api.get(`/api/horses/${horseId}/medical/follow-ups`, { params });
    return response.data;
};

export const createMedicalFollowUp = async (horseId, data) => {
    const response = await api.post(`/api/horses/${horseId}/medical/follow-ups`, data);
    return response.data;
};
