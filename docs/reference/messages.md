# Giải thích function: messages

Các function có tên trong source nghiệp vụ/UI. Callback anonymous của LINQ/React và getter tự động được giải thích trong function bao ngoài; migration sinh tự động được giữ nguyên.

## src/messages/backendErrors.js

MSG key enum, catalog VI, formatter và bản dịch lỗi API. Dữ liệu người dùng nhập không bị dịch.

### backendErrorMessage(text, fallback)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Ánh xạ lỗi nghiệp vụ API và mẫu lỗi có tham số sang catalog tiếng Việt; lỗi chưa biết dùng fallback, không render chi tiết server thô.

| Đầu vào | Ý nghĩa |
|---|---|
| `text` | Giá trị text truyền vào backendErrorMessage; tham chiếu phần thân để xem cách dùng. |
| `fallback` | Giá trị fallback truyền vào backendErrorMessage; tham chiếu phần thân để xem cách dùng. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Object.hasOwn`.

## src/messages/index.js

MSG key enum, catalog VI, formatter và bản dịch lỗi API. Dữ liệu người dùng nhập không bị dịch.

### msg(key, parameters)

**Kết quả:** Chuỗi nhãn/URL/thời gian đã định dạng theo hợp đồng của helper; không dùng nhãn tiếng Việt thay enum value.

Tra thông điệp theo enum key, thay tham số một lượt và báo thiếu key/tham số; dữ liệu người dùng được React escape khi render.

| Đầu vào | Ý nghĩa |
|---|---|
| `key` | Khóa thông điệp enum trong catalog, không phải nội dung hiển thị. |
| `parameters` | Tham số thay thế placeholder của thông điệp; dữ liệu vẫn được React/HTML renderer escape. |

Lời gọi chính: `Object.hasOwn`.
