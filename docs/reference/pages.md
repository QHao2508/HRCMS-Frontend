# Giải thích function: pages

Các function có tên trong source nghiệp vụ/UI. Callback anonymous của LINQ/React và getter tự động được giải thích trong function bao ngoài; migration sinh tự động được giữ nguyên.

## src/pages/auth/AcceptInvitation.jsx

Login, Register, VerifyEmail, Forgot/ResetPassword và AcceptInvitation; OTP 6 chữ số, không dùng mật khẩu/OTP trên URL.

### AcceptInvitation()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Dùng PasswordSetupForm cho nhân viên tự kích hoạt tài khoản theo lời mời do quản lý tạo.

## src/pages/auth/ForgotPassword.jsx

Login, Register, VerifyEmail, Forgot/ResetPassword và AcceptInvitation; OTP 6 chữ số, không dùng mật khẩu/OTP trên URL.

### ForgotPassword()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Yêu cầu OTP đặt lại mật khẩu, giữ thông báo chung và cooldown để không tiết lộ email tồn tại.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `cooldown.start`, `form.submit`, `email.trim`, `form.field`.

### ForgotPassword.requestCode(values)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Yêu cầu OTP Reset từ email đã kiểm, hiển thị thông báo chung và bắt đầu cooldown.

| Đầu vào | Ý nghĩa |
|---|---|
| `values` | Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `cooldown.start`.

## src/pages/auth/Login.jsx

Login, Register, VerifyEmail, Forgot/ResetPassword và AcceptInvitation; OTP 6 chữ số, không dùng mật khẩu/OTP trên URL.

### Login()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Quản lý form username/email và password; đăng nhập, xử lý cần xác thực/quá hạn và điều hướng về vị trí người dùng muốn vào.

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `event.preventDefault`, `email.includes`, `email.trim`.

### Login.submit(event)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.

| Đầu vào | Ý nghĩa |
|---|---|
| `event` | Event UI; đọc target/currentTarget, chặn submit mặc định khi cần. |

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `event.preventDefault`, `email.includes`, `email.trim`.

## src/pages/auth/Register.jsx

Login, Register, VerifyEmail, Forgot/ResetPassword và AcceptInvitation; OTP 6 chữ số, không dùng mật khẩu/OTP trên URL.

### Register()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Thu thập dữ liệu chủ ngựa, kiểm hợp lệ, đăng ký rồi chuyển xác thực; hỗ trợ quay lại xác thực khi tài khoản đã tồn tại.

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `email.trim`, `form.submit`, `form.field`.

### Register.submit(values)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.

| Đầu vào | Ý nghĩa |
|---|---|
| `values` | Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API. |

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

Lời gọi chính: `email.trim`.

## src/pages/auth/ResetPassword.jsx

Login, Register, VerifyEmail, Forgot/ResetPassword và AcceptInvitation; OTP 6 chữ số, không dùng mật khẩu/OTP trên URL.

### ResetPassword()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Dùng PasswordSetupForm cho mục đích đặt lại mật khẩu bằng OTP.

## src/pages/auth/VerifyEmail.jsx

Login, Register, VerifyEmail, Forgot/ResetPassword và AcceptInvitation; OTP 6 chữ số, không dùng mật khẩu/OTP trên URL.

### VerifyEmail()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Nhập email/OTP, xác thực hoặc gửi lại mã với cooldown riêng; không coi gửi email hay xác thực là đã đăng nhập.

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `email.trim`, `form.submit`, `cooldown.start`, `form.field`.

### VerifyEmail.verify(values)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Gửi email/OTP; thành công mới chuyển login cùng notice xác thực, không lưu mã vào URL.

| Đầu vào | Ý nghĩa |
|---|---|
| `values` | Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API. |

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

Lời gọi chính: `email.trim`.

### VerifyEmail.resend()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Gửi lại OTP khi hết cooldown, chỉ kiểm email để không bắt người dùng nhập OTP trước khi xin mã mới.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `form.submit`, `cooldown.start`.

## src/pages/Dashboard.jsx

Component cấp màn hình theo route, phối hợp form/resource/mutation và service.

### Dashboard()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Hiển thị aggregate từ một endpoint và menu theo role; role lạ chỉ nhận cảnh báo/phạm vi an toàn.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `api.get`, `Promise.resolve`, `cards.map`.

### Dashboard.load()

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

Lời gọi chính: `api.get`, `Promise.resolve`.

## src/pages/Home.jsx

Component cấp màn hình theo route, phối hợp form/resource/mutation và service.

### Home()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Hiển thị nhận diện thương hiệu và phần chào mừng; nút vào hệ thống đi đến login hoặc dashboard theo phiên đã khôi phục.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

## src/pages/horses/HorsePages.jsx

Danh sách/hồ sơ ngựa, ảnh Azure qua API private và phân công nhân sự theo quyền.

### HorseList()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tải/lọc/phân trang ngựa trong phạm vi API cấp; trình bày sức khỏe bằng enum và liên kết hồ sơ.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `items.map`.

### HorseList.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

### HorsePhoto(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tải ảnh ngựa qua endpoint kiểm phạm vi và tạo object URL; không dùng trực tiếp blob private.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { id }. Các props/callback lấy từ caller. |

- Object URL chỉ là tài nguyên bộ nhớ browser; được revoke khi không còn dùng.

- Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `URL.createObjectURL`, `URL.revokeObjectURL`.

### AssignmentForm(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Quản lý chọn nhân sự chính thức hoặc huấn luyện viên trưởng chọn huấn luyện viên; gửi role/staff/date theo contract.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { horse,user,reload }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `e.preventDefault`, `mutation.run`.

### AssignmentForm.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

### AssignmentForm.change(e)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Cập nhật form theo name/value và reset lựa chọn phụ thuộc khi cần, không tự sửa dữ liệu server.

| Đầu vào | Ý nghĩa |
|---|---|
| `e` | Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm. |

### AssignmentForm.submit(e)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.

| Đầu vào | Ý nghĩa |
|---|---|
| `e` | Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `e.preventDefault`, `mutation.run`.

### HorseDetail()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tải hồ sơ ngựa, số đo/phân công và danh bạ cần thiết; chỉ render form phân công khi role/phạm vi phù hợp.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Promise.all`, `assignments.map`, `Object.fromEntries`, `groups.flat`.

### HorseDetail.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

Lời gọi chính: `Promise.all`, `assignments.map`, `Object.fromEntries`, `groups.flat`.

## src/pages/NotFound.jsx

Component cấp màn hình theo route, phối hợp form/resource/mutation và service.

### NotFound()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Trang URL không tồn tại; đưa về login/dashboard theo phiên và không hiển thị đường dẫn nhạy cảm.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

## src/pages/PermissionDenied.jsx

Component cấp màn hình theo route, phối hợp form/resource/mutation và service.

### PermissionDenied()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Giải thích tài khoản không có quyền và đưa về dashboard an toàn.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

## src/pages/registrations/RegistrationCreate.jsx

Tạo/lưu bản nháp, wizard, upload ảnh/tài liệu, gửi/hủy và danh sách intake.

### RegistrationCreate()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Giữ intake/ảnh chọn trong bộ nhớ, lưu bản nháp rồi upload; giữ ID khi upload lỗi và chặn tạo trùng khi response không chắc chắn.

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `event.preventDefault`, `Object.keys`.

### RegistrationCreate.save(event)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm dữ liệu hiện có, lưu qua API và dùng ID/response thật để cập nhật form hoặc chuyển trang.

| Đầu vào | Ý nghĩa |
|---|---|
| `event` | Event UI; đọc target/currentTarget, chặn submit mặc định khi cần. |

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

Lời gọi chính: `event.preventDefault`, `Object.keys`.

### save.onSaved(record)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Giữ ID bản nháp ngay sau lần lưu để lỗi upload ảnh không làm mất liên kết hoặc tạo bản nháp trùng.

| Đầu vào | Ý nghĩa |
|---|---|
| `record` | Bản ghi/payload do server trả hoặc giá trị dùng dựng form; không tự phát minh ID/trạng thái. |

## src/pages/registrations/RegistrationDetail.jsx

Tạo/lưu bản nháp, wizard, upload ảnh/tài liệu, gửi/hủy và danh sách intake.

### RegistrationDetailContent(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Điều phối sửa nháp, upload, gửi/hủy và trạng thái stale; chỉ dùng response/reload thật để đổi trạng thái.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { initialRecord, initialAttachments, reload }. Các props/callback lấy từ caller. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `JSON.stringify`, `event.preventDefault`, `Object.keys`, `missing.map`.

### RegistrationDetailContent.run(name, action)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Khóa lượt thao tác đang chạy, gọi hàm ghi rồi reload/callback; ghi nhận thành công hoặc lỗi và yêu cầu đối soát khi kết quả chưa chắc chắn.

| Đầu vào | Ý nghĩa |
|---|---|
| `name` | Tên/key đầu vào theo mục đích hàm; xem kiểu và điều kiện kiểm trong thân hàm. |
| `action` | Giá trị action truyền vào run; tham chiếu phần thân để xem cách dùng. |

### RegistrationDetailContent.acceptRecord(updated)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đồng bộ record và giá trị form từ response đã lưu để reset dirty/version đúng với server.

| Đầu vào | Ý nghĩa |
|---|---|
| `updated` | Giá trị updated truyền vào acceptRecord; tham chiếu phần thân để xem cách dùng. |

### RegistrationDetailContent.save(event)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm dữ liệu hiện có, lưu qua API và dùng ID/response thật để cập nhật form hoặc chuyển trang.

| Đầu vào | Ý nghĩa |
|---|---|
| `event` | Event UI; đọc target/currentTarget, chặn submit mặc định khi cần. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `event.preventDefault`, `Object.keys`.

### RegistrationDetailContent.submit()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Object.keys`.

### RegistrationDetailContent.cancel()

**Kết quả:** Boolean thể hiện kiểm tra đúng/sai; không sửa dữ liệu server.

Chỉ gửi hủy sau xác nhận, dùng response thật và giữ lỗi khi request không thành công.

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### RegistrationDetailContent.upload(values)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm file và trạng thái thao tác, gọi upload API rồi tải lại metadata để UI chỉ hiển thị tệp đã lưu.

| Đầu vào | Ý nghĩa |
|---|---|
| `values` | Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### RegistrationDetail()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tải hồ sơ cùng attachments theo ID và render phần nội dung tương ứng.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Promise.all`.

### RegistrationDetail.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

Lời gọi chính: `Promise.all`.

## src/pages/registrations/RegistrationList.jsx

Tạo/lưu bản nháp, wizard, upload ảnh/tài liệu, gửi/hủy và danh sách intake.

### RegistrationListContent(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Render bảng hồ sơ, badge trạng thái và các thao tác được phép từ dữ liệu API.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { data }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `items.map`, `createdAt.slice`.

### RegistrationList()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Giữ bộ lọc/trang và tải danh sách intake của chủ ngựa, hỗ trợ mở/tạo hồ sơ.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Object.values`, `Math.max`, `Math.ceil`.

### RegistrationList.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

## src/pages/reviews/ReviewPages.jsx

Màn hình quản lý duyệt hoặc yêu cầu chỉnh sửa intake.

### ReviewList()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Lọc/phân trang intake cho quản lý và dẫn tới màn hình kiểm tra hồ sơ.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `items.map`.

### ReviewList.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

### ReviewContent(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Render thông tin và tài liệu intake, sửa trường hành chính, phê duyệt hoặc yêu cầu chỉnh sửa có lý do.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { data,reload }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `e.preventDefault`, `mutation.run`, `Object.fromEntries`, `Object.entries`, `reason.trim`.

### ReviewContent.change(e)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Cập nhật form theo name/value và reset lựa chọn phụ thuộc khi cần, không tự sửa dữ liệu server.

| Đầu vào | Ý nghĩa |
|---|---|
| `e` | Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm. |

### ReviewContent.save(e)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm dữ liệu hiện có, lưu qua API và dùng ID/response thật để cập nhật form hoặc chuyển trang.

| Đầu vào | Ý nghĩa |
|---|---|
| `e` | Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm. |

Lời gọi chính: `e.preventDefault`, `mutation.run`, `Object.fromEntries`, `Object.entries`.

### ReviewContent.review(approve)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Gửi quyết định duyệt/yêu cầu chỉnh sửa của quản lý và tải trạng thái/hồ sơ ngựa thật sau response.

| Đầu vào | Ý nghĩa |
|---|---|
| `approve` | Giá trị approve truyền vào review; tham chiếu phần thân để xem cách dùng. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `reason.trim`, `mutation.run`.

### ReviewDetail()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tải hồ sơ/tài liệu để quản lý duyệt, dùng trạng thái thật sau mutation.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### ReviewDetail.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

## src/pages/training/PlanPages.jsx

Giáo án mẫu, kế hoạch, buổi tập, kết quả và đánh giá theo vai trò.

### collect(load)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc hết các trang danh sách để dựng lựa chọn ngựa/giáo án; dừng theo tổng/pageSize và trang rỗng.

| Đầu vào | Ý nghĩa |
|---|---|
| `load` | Giá trị load truyền vào collect; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `items.push`.

### PlanList()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tải và phân trang kế hoạch, tùy chọn lọc theo ngựa và action tạo theo role.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `search.get`, `items.map`.

### PlanList.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

### PlanCreate()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tải lựa chọn ngựa/giáo án, giữ form kế hoạch cá nhân hóa và tạo qua API.

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `search.get`, `templates.find`, `e.preventDefault`, `mutation.run`, `horses.map`, `templates.map`.

### PlanCreate.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

### PlanCreate.change(e)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Cập nhật form theo name/value và reset lựa chọn phụ thuộc khi cần, không tự sửa dữ liệu server.

| Đầu vào | Ý nghĩa |
|---|---|
| `e` | Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm. |

Lời gọi chính: `templates.find`.

### PlanCreate.submit(e)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.

| Đầu vào | Ý nghĩa |
|---|---|
| `e` | Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm. |

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

Lời gọi chính: `e.preventDefault`, `mutation.run`.

### PlanFields(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Các trường controlled mục tiêu/giai đoạn/ngày/ghi chú dùng chung tạo và sửa kế hoạch.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: {form,onChange}. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### History(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Phân trang lịch sử huấn luyện và đọc snapshot theo từng sự kiện.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: {id}. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `items.map`.

### History.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

### HistorySnapshot(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Render snapshot đã parse cùng badge trạng thái; fallback khi dữ liệu lịch sử không đọc được.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: {snapshot}. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `rows.map`.

### PlanContent(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Render kế hoạch, hạn chế vận động, sửa/trạng thái và tab buổi tập/lịch sử theo phân công.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: {data,horse,user,id,reload}. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `restrictions.map`, `e.preventDefault`, `mutation.run`.

### SessionTable(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Hiển thị buổi tập của kế hoạch với giờ Việt Nam, nhãn enum và đường dẫn chi tiết.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: {data}. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `sessions.map`.

### PlanDetail()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tải kế hoạch cùng hồ sơ ngựa, giữ phân trang buổi tập và key theo version để tránh form stale.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### PlanDetail.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

## src/pages/training/SessionPages.jsx

Giáo án mẫu, kế hoạch, buổi tập, kết quả và đánh giá theo vai trò.

### SessionFields(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Các trường controlled lịch, bài tập, quãng đường, cường độ và người cưỡi dùng chung tạo/sửa buổi tập.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: {form,change,riders,disabled,min,max}. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `riders.map`.

### SessionCreate()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Chỉ hiển thị tạo buổi tập cho huấn luyện viên được giao ngựa và kế hoạch Active; gửi payload qua helper chuẩn hóa.

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `e.preventDefault`, `mutation.run`.

### SessionCreate.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

### SessionList()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Lọc/phân trang buổi tập theo trạng thái, hiển thị enum tiếng Việt và liên kết chi tiết.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `items.map`.

### SessionList.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

### SessionContent(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Điều phối sửa/giao, bắt đầu/bỏ qua, nhập kết quả và đánh giá; mỗi action kiểm role, phân công và trạng thái UI.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: {data,reload,user}. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `e.preventDefault`, `mutation.run`, `reason.trim`.

### SessionDetail()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tải buổi tập, kế hoạch, ngựa và danh bạ người cưỡi cần thiết; dựng nội dung theo version.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### SessionDetail.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

## src/pages/training/TemplatePages.jsx

Giáo án mẫu, kế hoạch, buổi tập, kết quả và đánh giá theo vai trò.

### TemplateForm(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Các trường controlled của giáo án mẫu, gồm mục tiêu/cường độ/tần suất và ghi chú.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: {form,onChange,disabled}. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Object.values`.

### TemplateList()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tải/phân trang giáo án, mở form tạo/sửa và xác nhận lưu trữ theo role được phép.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `mutation.reset`, `Object.fromEntries`, `Object.keys`, `e.preventDefault`, `mutation.run`, `resource.reload`, `items.map`.

### TemplateList.load()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.

### TemplateList.open(record)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Mở form tạo hoặc sửa bằng dữ liệu bản ghi/default, đồng thời reset trạng thái mutation trước lượt mới.

| Đầu vào | Ý nghĩa |
|---|---|
| `record` | Bản ghi/payload do server trả hoặc giá trị dùng dựng form; không tự phát minh ID/trạng thái. |

Lời gọi chính: `mutation.reset`, `Object.fromEntries`, `Object.keys`.

### TemplateList.submit(e)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.

| Đầu vào | Ý nghĩa |
|---|---|
| `e` | Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm. |

Lời gọi chính: `e.preventDefault`, `mutation.run`, `resource.reload`.
