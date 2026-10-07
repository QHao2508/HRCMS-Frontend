# Giải thích function: layouts

Các function có tên trong source nghiệp vụ/UI. Callback anonymous của LINQ/React và getter tự động được giải thích trong function bao ngoài; migration sinh tự động được giữ nguyên.

## src/layouts/AppLayout.jsx

PublicLayout cho Home/auth và AppLayout cho trang quản lý; cùng logo, giữ palette của từng theme.

### AppLayout()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Dựng header tài khoản, logo, menu theo role và Outlet cho màn hình quản lý; không cấp quyền chỉ dựa vào menu.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `pathname.startsWith`, `navigation.map`.

## src/layouts/PublicLayout.jsx

PublicLayout cho Home/auth và AppLayout cho trang quản lý; cùng logo, giữ palette của từng theme.

### PublicLayout(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Dựng header/logo trỏ về Home, nội dung và footer cho các trang public; className chỉ điều chỉnh theme của màn hình gọi.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { children, className = "" }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
