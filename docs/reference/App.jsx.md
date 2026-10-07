# Giải thích function: App.jsx

Các function có tên trong source nghiệp vụ/UI. Callback anonymous của LINQ/React và getter tự động được giải thích trong function bao ngoài; migration sinh tự động được giữ nguyên.

## src/App.jsx

Source React: pages/component/hooks/services/routes, enum và catalog tiếng Việt.

### App()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Gắn BrowserRouter, AuthProvider và AppRoutes để toàn bộ màn hình dùng chung điều hướng và phiên đăng nhập.
