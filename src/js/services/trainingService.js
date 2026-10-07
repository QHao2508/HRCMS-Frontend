import api from "./api";

// F02-A — Standard Training Templates
export const getTrainingTemplates = async (page = 1, pageSize = 10) => {
    const response = await api.get("/api/training/templates", {
        params: { page, pageSize },
    });
    return response.data;
};

export const createTrainingTemplate = async (data) => {
    const response = await api.post("/api/training/templates", data);
    return response.data;
};

export const updateTrainingTemplate = async (id, data) => {
    const response = await api.put(`/api/training/templates/${id}`, data);
    return response.data;
};

export const archiveTrainingTemplate = async (id) => {
    const response = await api.post(`/api/training/templates/${id}/archive`);
    return response.data;
};

// F02-B — Training Plans
export const getTrainingPlans = async (page = 1, pageSize = 50, horseId) => {
    const response = await api.get("/api/training/plans", {
        params: {
            page,
            pageSize,
            ...(horseId ? { horseId } : {}),
        },
    });
    return response.data;
};

export const getTrainingPlan = async (id) => {
    const response = await api.get(`/api/training/plans/${id}`);
    return response.data;
};

export const createTrainingPlan = async (data) => {
    const response = await api.post("/api/training/plans", data);
    return response.data;
};

export const updateTrainingPlan = async (id, data) => {
    const response = await api.put(`/api/training/plans/${id}`, data);
    return response.data;
};

export const updateTrainingPlanStatus = async (id, status) => {
    const response = await api.put(`/api/training/plans/${id}/status`, {
        status,
    });
    return response.data;
};

export const getTrainingPlanHistory = async (id, page = 1, pageSize = 50) => {
    const response = await api.get(`/api/training/plans/${id}/history`, {
        params: { page, pageSize },
    });
    return response.data;
};

// Used by F02-B to show the plan timeline until F02-C has its own screen.
export const getTrainingSessions = async ({
    horseId,
    status,
    from,
    to,
    page = 1,
    pageSize = 100,
} = {}) => {
    const response = await api.get("/api/training/sessions", {
        params: {
            page,
            pageSize,
            ...(horseId ? { horseId } : {}),
            ...(status ? { status } : {}),
            ...(from ? { from } : {}),
            ...(to ? { to } : {}),
        },
    });
    return response.data;
};

// F02-B pre-save medical validation / context.
export const getHorseMedicalSummary = async (horseId) => {
    const response = await api.get(`/api/horses/${horseId}/medical/summary`);
    return response.data;
};

// F01 horse data used by the Training Plan selector.
export const getHorses = async (page = 1, pageSize = 100) => {
    const response = await api.get("/api/horses", {
        params: { page, pageSize },
    });
    return response.data;
};


// F02-C — Training Sessions
export const createTrainingSession = async (planId, data) => {
    const response = await api.post(`/api/training/plans/${planId}/sessions`, data);
    return response.data;
};

export const getTrainingSession = async (id) => {
    const response = await api.get(`/api/training/sessions/${id}`);
    return response.data;
};

export const updateTrainingSession = async (id, data) => {
    const response = await api.put(`/api/training/sessions/${id}`, data);
    return response.data;
};

export const assignTrainingSession = async (id, riderId) => {
    const response = await api.post(`/api/training/sessions/${id}/assign`, { riderId });
    return response.data;
};

export const startTrainingSession = async (id) => {
    const response = await api.post(`/api/training/sessions/${id}/start`);
    return response.data;
};

export const skipTrainingSession = async (id, data) => {
    const response = await api.post(`/api/training/sessions/${id}/skip`, data);
    return response.data;
};

export const getWorkRiders = async (page = 1, pageSize = 100) => {
    const response = await api.get('/api/staff/directory', {
        params: { role: 'WorkRider', page, pageSize },
    });
    return response.data;
};


// F02-D — Work Rider Execution
export const submitTrainingResult = async (id, data) => {
    const response = await api.post(`/api/training/sessions/${id}/results`, data);
    return response.data;
};


// F02-E — Trainer Evaluation
export const submitTrainingEvaluation = async (id, data) => {
    const response = await api.post(`/api/training/sessions/${id}/evaluation`, data);
    return response.data;
};
