# Giải thích function: routes

Các function có tên trong source nghiệp vụ/UI. Callback anonymous của LINQ/React và getter tự động được giải thích trong function bao ngoài; migration sinh tự động được giữ nguyên.

## src/routes/AppRoutes.jsx

Ánh xạ URL, protected/role guards, menu theo quyền và redirect đích an toàn.

### AppRoutes()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Khai báo route public/protected và giới hạn role; nối URL với page/layout tương ứng.

## src/routes/navigation.js

Ánh xạ URL, protected/role guards, menu theo quyền và redirect đích an toàn.

### getNavigationForRole(role)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Lọc menu đã triển khai theo allowlist role; đây là điều hướng, bảo vệ thực tế vẫn nằm ở route/API.

| Đầu vào | Ý nghĩa |
|---|---|
| `role` | Role enum chính xác của backend để kiểm quyền/lọc dữ liệu. |

Lời gọi chính: `items.filter`.

## src/routes/ProtectedRoute.jsx

Ánh xạ URL, protected/role guards, menu theo quyền và redirect đích an toàn.

### ProtectedRoute(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Chờ khôi phục phiên; nếu chưa đăng nhập thì giữ URL đích trong state và chuyển login.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { children }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

## src/routes/redirects.js

Ánh xạ URL, protected/role guards, menu theo quyền và redirect đích an toàn.

### getLoginRedirect(location)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Tạo redirect login cùng pathname/search/hash đích để sau đăng nhập quay lại đúng màn hình.

| Đầu vào | Ý nghĩa |
|---|---|
| `location` | Giá trị location truyền vào getLoginRedirect; tham chiếu phần thân để xem cách dùng. |

### getLoginDestination(state)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Chọn URL nội bộ an toàn từ state, chặn URL ngoài và vòng lặp login; fallback về dashboard.

| Đầu vào | Ý nghĩa |
|---|---|
| `state` | Giá trị state truyền vào getLoginDestination; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `pathname.startsWith`, `decodedPath.replace`, `decodedPath.startsWith`, `decodedPath.includes`, `search.startsWith`, `hash.startsWith`.

## src/routes/RoleRoute.jsx

Ánh xạ URL, protected/role guards, menu theo quyền và redirect đích an toàn.

### AuthorizedContent(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Kiểm allowlist role rồi render nội dung hoặc chuyển trang không có quyền.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { allowedRoles, children }. Các props/callback lấy từ caller. |

### RoleRoute(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Bao protected route bằng kiểm role; chặn role không hợp lệ mà không xóa phiên đang dùng.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { allowedRoles, children }. Các props/callback lấy từ caller. |
