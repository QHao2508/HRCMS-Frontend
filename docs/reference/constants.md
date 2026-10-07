# Giải thích function: constants

Các function có tên trong source nghiệp vụ/UI. Callback anonymous của LINQ/React và getter tự động được giải thích trong function bao ngoài; migration sinh tự động được giữ nguyên.

## src/constants/enumLabels.js

Enum API và cấu hình giới hạn dùng chung; label hiển thị lấy từ messages, không dùng label để gửi API.

### getEnumLabel(value)

**Kết quả:** Chuỗi nhãn/URL/thời gian đã định dạng theo hợp đồng của helper; không dùng nhãn tiếng Việt thay enum value.

Đổi enum API thành nhãn tiếng Việt an toàn; giá trị không biết không bị hiển thị trực tiếp.

| Đầu vào | Ý nghĩa |
|---|---|
| `value` | Giá trị value truyền vào getEnumLabel; tham chiếu phần thân để xem cách dùng. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Object.hasOwn`.

## src/constants/registration.js

Enum API và cấu hình giới hạn dùng chung; label hiển thị lấy từ messages, không dùng label để gửi API.

### statusDisplay(status)

**Kết quả:** Đối tượng dữ liệu chuẩn hóa/snapshot được mô tả ở mục đích; kiểu và trường xuất ra được xác định bởi return trong source.

Tra nhãn/màu hồ sơ đăng ký theo enum, xử lý trạng thái lạ bằng fallback an toàn.

| Đầu vào | Ý nghĩa |
|---|---|
| `status` | Trạng thái enum API, tách khỏi nhãn tiếng Việt. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Object.hasOwn`.

### canEditRegistration(status)

**Kết quả:** Boolean thể hiện kiểm tra đúng/sai; không sửa dữ liệu server.

Chỉ cho sửa intake ở trạng thái Draft hoặc RevisionRequired theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `status` | Trạng thái enum API, tách khỏi nhãn tiếng Việt. |

## src/constants/roles.js

Enum API và cấu hình giới hạn dùng chung; label hiển thị lấy từ messages, không dùng label để gửi API.

### isKnownRole(role)

**Kết quả:** Boolean thể hiện kiểm tra đúng/sai; không sửa dữ liệu server.

Chỉ nhận bảy tên enum role backend; không chấp nhận nhãn hiển thị hay biến thể chữ hoa/thường.

| Đầu vào | Ý nghĩa |
|---|---|
| `role` | Role enum chính xác của backend để kiểm quyền/lọc dữ liệu. |

Lời gọi chính: `ALL_ROLES.includes`.

### getRoleLabel(role)

**Kết quả:** Chuỗi nhãn/URL/thời gian đã định dạng theo hợp đồng của helper; không dùng nhãn tiếng Việt thay enum value.

Trả nhãn tiếng Việt của role đã biết hoặc thông báo role không nhận diện.

| Đầu vào | Ý nghĩa |
|---|---|
| `role` | Role enum chính xác của backend để kiểm quyền/lọc dữ liệu. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### isRoleAllowed(role, allowedRoles)

**Kết quả:** Boolean thể hiện kiểm tra đúng/sai; không sửa dữ liệu server.

Kiểm role chính xác trong allowlist; thiếu restriction nghĩa là chỉ cần đăng nhập, role lạ không được cấp quyền.

| Đầu vào | Ý nghĩa |
|---|---|
| `role` | Role enum chính xác của backend để kiểm quyền/lọc dữ liệu. |
| `allowedRoles` | Allowlist enum role; role lạ không được cấp quyền. |

Lời gọi chính: `Array.isArray`, `allowed.some`.
