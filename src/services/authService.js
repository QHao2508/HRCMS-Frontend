import api from "./api";

export const login = async (credentials) => {
    const response = await api.post("/api/auth/login", credentials);

    return response.data;
};

export const register = async (data) => {
    const response = await api.post("/api/auth/register", data);

    return response.data;
};

export const logout = async () => {
    const response = await api.post("/api/auth/logout");

    return response.data;
};