# Giải thích function: lint

Các function có tên trong source nghiệp vụ/UI. Callback anonymous của LINQ/React và getter tự động được giải thích trong function bao ngoài; migration sinh tự động được giữ nguyên.

## eslint-rules/no-hardcoded-ui-text.js

Quy tắc ESLint của dự án chặn chữ hiển thị hardcoded trong JSX/label.

### create(context)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Khởi tạo visitor ESLint kiểm text hiển thị hardcoded; không chạy trong ứng dụng browser.

| Đầu vào | Ý nghĩa |
|---|---|
| `context` | Giá trị context truyền vào create; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `value.trim`, `context.report`, `displayAttributes.has`.

### JSXText(node)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Báo lint khi JSX chứa chữ hiển thị hardcoded, yêu cầu chuyển vào messages/vi.js.

| Đầu vào | Ý nghĩa |
|---|---|
| `node` | Giá trị node truyền vào JSXText; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `value.trim`, `context.report`.

### JSXAttribute(node)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Báo lint khi thuộc tính label/title/placeholder/ARIA dùng chuỗi hiển thị trực tiếp.

| Đầu vào | Ý nghĩa |
|---|---|
| `node` | Giá trị node truyền vào JSXAttribute; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `displayAttributes.has`, `value.trim`, `context.report`.

### Property(node)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Báo lint khi option/object label chứa text hardcoded thay vì message key.

| Đầu vào | Ý nghĩa |
|---|---|
| `node` | Giá trị node truyền vào Property; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `value.trim`, `context.report`.
