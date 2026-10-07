# Giải thích function: utils

Các function có tên trong source nghiệp vụ/UI. Callback anonymous của LINQ/React và getter tự động được giải thích trong function bao ngoài; migration sinh tự động được giữ nguyên.

## src/utils/userDisplay.js

Helper thuần dùng chung, hiện gồm tên user hiển thị an toàn.

### getUserDisplayName(user)

**Kết quả:** Chuỗi nhãn/URL/thời gian đã định dạng theo hợp đồng của helper; không dùng nhãn tiếng Việt thay enum value.

Ưu tiên họ tên, rồi username và tên thành viên chung; không dùng token hoặc email làm tên hiển thị.

| Đầu vào | Ý nghĩa |
|---|---|
| `user` | Tài khoản đã tra cứu/kiểm; response chỉ được lấy trường cho phép. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `value.trim`, `userName.trim`.
