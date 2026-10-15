/**
 * Gốc URL của backend. Trống khi chạy local (Vite proxy chuyển /api tới BE);
 * khi deploy, VITE_API_BASE_URL trỏ tới Container App để <img src> và link tải file đi đúng BE.
 */
export const API_BASE = (import.meta.env?.VITE_API_BASE_URL?.trim() || '').replace(/\/+$/, '');

/** Ghép đường dẫn API tương đối (bắt đầu bằng /api) với gốc backend. */
export const apiUrl = path => API_BASE + path;
