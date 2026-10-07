# Giải thích function: context

Các function có tên trong source nghiệp vụ/UI. Callback anonymous của LINQ/React và getter tự động được giải thích trong function bao ngoài; migration sinh tự động được giữ nguyên.

## src/context/AuthContext.jsx

AuthProvider và hook quản lý session, form, cooldown, resource và mutation; khóa request lặp/response stale.

### AuthProvider(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Đăng ký theo dõi session store bằng useSyncExternalStore và khôi phục phiên một lần; cung cấp user, loading và các thao tác auth cho component.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { children }. Các props/callback lấy từ caller. |

- Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.

## src/context/useAuth.js

AuthProvider và hook quản lý session, form, cooldown, resource và mutation; khóa request lặp/response stale.

### useAuth()

**Kết quả:** State và callback của hook, hoặc context hiện tại. Caller dùng pending/loading/error để quyết định UI.

Đọc AuthContext; phát hiện component bị dùng ngoài AuthProvider thay vì âm thầm giả định quyền.

## src/context/useAuthCooldown.js

AuthProvider và hook quản lý session, form, cooldown, resource và mutation; khóa request lặp/response stale.

### readDeadline(purpose)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc timestamp cooldown từ storage, bỏ dữ liệu hỏng/hết hạn và chịu được storage bị chặn.

| Đầu vào | Ý nghĩa |
|---|---|
| `purpose` | Enum mục đích OTP Verify/Reset/Invite; ngăn dùng mã của luồng khác. |

Lời gọi chính: `sessionStorage.getItem`, `Number.isFinite`, `Date.now`.

### startAuthCooldown(purpose)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Lưu thời hạn được phép gửi lại OTP theo mục đích để reload trang không bỏ qua thời gian chờ.

| Đầu vào | Ý nghĩa |
|---|---|
| `purpose` | Enum mục đích OTP Verify/Reset/Invite; ngăn dùng mã của luồng khác. |

Lời gọi chính: `Date.now`, `sessionStorage.setItem`.

### useAuthCooldown(purpose)

**Kết quả:** State và callback của hook, hoặc context hiện tại. Caller dùng pending/loading/error để quyết định UI.

Theo dõi hạn chờ gửi lại OTP theo mục đích; chỉ lưu timestamp, không lưu email, OTP hoặc mật khẩu.

| Đầu vào | Ý nghĩa |
|---|---|
| `purpose` | Enum mục đích OTP Verify/Reset/Invite; ngăn dùng mã của luồng khác. |

- Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.

Lời gọi chính: `Math.max`, `Math.ceil`, `Date.now`.

### useAuthCooldown.start()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Khởi động thời gian chờ gửi lại OTP bằng helper dùng chung, không lưu mã hay mật khẩu.

Lời gọi chính: `Date.now`.

## src/context/useAuthForm.js

AuthProvider và hook quản lý session, form, cooldown, resource và mutation; khóa request lặp/response stale.

### useAuthForm(initialValues, validate)

**Kết quả:** State và callback của hook, hoặc context hiện tại. Caller dùng pending/loading/error để quyết định UI.

Giữ values/errors/pending cho form auth, kiểm bằng validator và khóa bằng ref để không gửi hai request cùng lúc.

| Đầu vào | Ý nghĩa |
|---|---|
| `initialValues` | Giá trị initialValues truyền vào useAuthForm; tham chiếu phần thân để xem cách dùng. |
| `validate` | Giá trị validate truyền vào useAuthForm; tham chiếu phần thân để xem cách dùng. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Object.keys`.

### useAuthForm.onChange(event)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Cập nhật field theo event và xóa lỗi cũ của field; giữ form controlled.

| Đầu vào | Ý nghĩa |
|---|---|
| `event` | Event UI; đọc target/currentTarget, chặn submit mặc định khi cần. |

### useAuthForm.submit(action, validator, actionName)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.

| Đầu vào | Ý nghĩa |
|---|---|
| `action` | Giá trị action truyền vào submit; tham chiếu phần thân để xem cách dùng. |
| `validator` | Giá trị validator truyền vào submit; tham chiếu phần thân để xem cách dùng. |
| `actionName` | Giá trị actionName truyền vào submit; tham chiếu phần thân để xem cách dùng. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Object.keys`.

### useAuthForm.field(name)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Tạo props name/value/onChange/error cho AuthInput từ trạng thái hook form.

| Đầu vào | Ý nghĩa |
|---|---|
| `name` | Tên/key đầu vào theo mục đích hàm; xem kiểu và điều kiện kiểm trong thân hàm. |

## src/context/useMutation.js

AuthProvider và hook quản lý session, form, cooldown, resource và mutation; khóa request lặp/response stale.

### useMutation()

**Kết quả:** State và callback của hook, hoặc context hiện tại. Caller dùng pending/loading/error để quyết định UI.

Quản lý thao tác ghi với pending/error/notice; đánh dấu uncertain khi kết quả máy chủ chưa chắc chắn để tránh retry mù.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### useMutation.run(action, onSuccess, notice)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Khóa lượt thao tác đang chạy, gọi hàm ghi rồi reload/callback; ghi nhận thành công hoặc lỗi và yêu cầu đối soát khi kết quả chưa chắc chắn.

| Đầu vào | Ý nghĩa |
|---|---|
| `action` | Giá trị action truyền vào run; tham chiếu phần thân để xem cách dùng. |
| `onSuccess` | Giá trị onSuccess truyền vào run; tham chiếu phần thân để xem cách dùng. |
| `notice` | Giá trị notice truyền vào run; tham chiếu phần thân để xem cách dùng. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### useMutation.reset()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Xóa lỗi/thông báo/trạng thái uncertain của hook trước một lượt thao tác mới đã được kiểm tra.

## src/context/useRegistrationResource.js

AuthProvider và hook quản lý session, form, cooldown, resource và mutation; khóa request lặp/response stale.

### useRegistrationResource(load)

**Kết quả:** State và callback của hook, hoặc context hiện tại. Caller dùng pending/loading/error để quyết định UI.

Tải dữ liệu theo loader và phiên hiện tại, bỏ response cũ khi unmount/đổi loader; trả loading, error, data và reload.

| Đầu vào | Ý nghĩa |
|---|---|
| `load` | Giá trị load truyền vào useRegistrationResource; tham chiếu phần thân để xem cách dùng. |

- Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.

Lời gọi chính: `Promise.resolve`.

### useRegistrationResource.reload()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Yêu cầu loader chạy lại để lấy trạng thái thật từ API, không tự giả lập dữ liệu thành công.
