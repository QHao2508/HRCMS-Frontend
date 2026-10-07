# Giải thích function: components

Các function có tên trong source nghiệp vụ/UI. Callback anonymous của LINQ/React và getter tự động được giải thích trong function bao ngoài; migration sinh tự động được giữ nguyên.

## src/components/auth/AuthButton.jsx

Form, input, button, logout và thiết lập mật khẩu chung cho các luồng OTP.

### AuthButton(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Nút submit đổi nhãn khi pending và ngăn gửi lặp; nhãn lấy từ bộ thông điệp.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { pending, pendingLabel = msg(MSG.DANG_XU_LY), children, disabled = false }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

## src/components/auth/AuthForm.jsx

Form, input, button, logout và thiết lập mật khẩu chung cho các luồng OTP.

### AuthForm(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Dựng form xác thực thống nhất, hiển thị lỗi/trạng thái và khóa fieldset khi đang gửi.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { title, description, form, onSubmit, submitLabel, pendingLabel, success, children, footer, submitDisabled = false }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Object.values`, `event.preventDefault`.

## src/components/auth/AuthInput.jsx

Form, input, button, logout và thiết lập mật khẩu chung cho các luồng OTP.

### AuthInput(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Nối label, input/textarea, trợ giúp và lỗi bằng ID/ARIA; nhận props từ hook form để giữ trường controlled.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { label, name, error, help, multiline = false, ...props }. Các props/callback lấy từ caller. |

## src/components/auth/LogoutButton.jsx

Form, input, button, logout và thiết lập mật khẩu chung cho các luồng OTP.

### LogoutButton()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Gọi logout rồi chuyển về login; giữ cảnh báo nếu chưa xác nhận được thu hồi phiên phía máy chủ.

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### LogoutButton.handleLogout()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Thực hiện đăng xuất, khóa thao tác lặp và chuyển hướng cả khi request logout lỗi vì phiên local đã được xóa.

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

## src/components/auth/PasswordSetupForm.jsx

Form, input, button, logout và thiết lập mật khẩu chung cho các luồng OTP.

### PasswordSetupForm(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Dùng chung form email, OTP và mật khẩu mới cho Reset/Invite; chọn endpoint đúng mục đích và yêu cầu đăng nhập lại sau thành công.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { invitation = false }. Các props/callback lấy từ caller. |

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `email.trim`, `form.submit`, `form.field`.

### PasswordSetupForm.submit(values)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.

| Đầu vào | Ý nghĩa |
|---|---|
| `values` | Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API. |

- Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.

Lời gọi chính: `email.trim`.

## src/components/BrandLogo.jsx

UI dùng chung, workflow states và logo Azure. Component nhận data/callback; service chịu trách nhiệm request.

### BrandLogo(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Đọc logo Azure qua URL API chung, khai báo kích thước để hạn chế nhảy bố cục và chuyển sang chữ HRCMS nếu ảnh không tải được.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { className = '', priority = false }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

## src/components/BrandMark.jsx

UI dùng chung, workflow states và logo Azure. Component nhận data/callback; service chịu trách nhiệm request.

### BrandMark()

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Trình bày cùng huy hiệu logo trong mọi header bằng CSS crop, giữ nguyên ảnh gốc và màu theme.

## src/components/registrations/HorsePhotoInput.jsx

Wizard intake, field metadata, trạng thái, tệp và xem trước ảnh trong bộ nhớ.

### HorsePhotoInput(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Chọn/kiểm ảnh ngựa và preview bằng object URL trong bộ nhớ; giải phóng URL khi thay ảnh/unmount, không lưu file local.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { file, onChange, disabled }. Các props/callback lấy từ caller. |

- Object URL chỉ là tài nguyên bộ nhớ browser; được revoke khi không còn dùng.

- Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `URL.createObjectURL`, `element.removeAttribute`, `URL.revokeObjectURL`.

### HorsePhotoInput.choose(event)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc file được chọn, kiểm PNG/JPEG và dung lượng trước khi cập nhật state; không upload file lỗi.

| Đầu vào | Ý nghĩa |
|---|---|
| `event` | Event UI; đọc target/currentTarget, chặn submit mặc định khi cần. |

### HorsePhotoInput.remove()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Xóa lựa chọn ảnh và reset input để có thể chọn lại cùng file.

### RegistrationPhotoPreview(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tải ảnh đã lưu qua API kiểm quyền, bỏ response muộn và revoke object URL khi đổi ảnh hoặc rời trang.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { registrationId, attachmentId }. Các props/callback lấy từ caller. |

- Object URL chỉ là tài nguyên bộ nhớ browser; được revoke khi không còn dùng.

- Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `URL.createObjectURL`, `URL.revokeObjectURL`.

## src/components/registrations/RegistrationAttachments.jsx

Wizard intake, field metadata, trạng thái, tệp và xem trước ảnh trong bộ nhớ.

### RegistrationAttachments(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Hiển thị metadata/preview ảnh, upload tài liệu và download có quyền; khóa lượt tải để tránh thao tác lặp.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { registrationId, attachments, editable, busy, onUpload }. Các props/callback lấy từ caller. |

- Object URL chỉ là tài nguyên bộ nhớ browser; được revoke khi không còn dùng.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `event.preventDefault`, `URL.createObjectURL`, `document.createElement`, `body.appendChild`, `anchor.click`, `anchor.remove`, `URL.revokeObjectURL`, `attachments.filter`, `attachments.map`, `Object.hasOwn`, `Math.ceil`, `ATTACHMENT_TYPES.map`.

### RegistrationAttachments.change(event)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Cập nhật form theo name/value và reset lựa chọn phụ thuộc khi cần, không tự sửa dữ liệu server.

| Đầu vào | Ý nghĩa |
|---|---|
| `event` | Event UI; đọc target/currentTarget, chặn submit mặc định khi cần. |

### RegistrationAttachments.upload(event)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm file và trạng thái thao tác, gọi upload API rồi tải lại metadata để UI chỉ hiển thị tệp đã lưu.

| Đầu vào | Ý nghĩa |
|---|---|
| `event` | Event UI; đọc target/currentTarget, chặn submit mặc định khi cần. |

Lời gọi chính: `event.preventDefault`.

### RegistrationAttachments.download(item)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Tải blob có quyền, tạo liên kết download trong bộ nhớ và thu hồi object URL; không dùng URL private trực tiếp.

| Đầu vào | Ý nghĩa |
|---|---|
| `item` | Giá trị item truyền vào download; tham chiếu phần thân để xem cách dùng. |

- Object URL chỉ là tài nguyên bộ nhớ browser; được revoke khi không còn dùng.

Lời gọi chính: `URL.createObjectURL`, `document.createElement`, `body.appendChild`, `anchor.click`, `anchor.remove`, `URL.revokeObjectURL`.

## src/components/registrations/RegistrationError.jsx

Wizard intake, field metadata, trạng thái, tệp và xem trước ảnh trong bộ nhớ.

### RegistrationError(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Hiển thị lỗi đã chuẩn hóa; che chi tiết server và tài nguyên riêng khi lỗi 500/403/404.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { error }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

## src/components/registrations/RegistrationForm.jsx

Wizard intake, field metadata, trạng thái, tệp và xem trước ảnh trong bộ nhớ.

### RegistrationForm(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Render các section intake theo wizard, lựa chọn nhân sự và lỗi theo field; giữ đề xuất khác với phân công chính thức.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { values, onChange, errors = {}, disabled = false, step }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `options.includes`, `options.map`, `FORM_SECTIONS.flatMap`, `sections.map`, `fields.map`, `PREFERENCES.map`, `options.some`.

### RegistrationForm.input(field)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Chọn select/textarea/input theo metadata field, nối ID và lỗi ARIA, giữ value enum nguyên bản.

| Đầu vào | Ý nghĩa |
|---|---|
| `field` | Giá trị field truyền vào input; tham chiếu phần thân để xem cách dùng. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `options.includes`, `options.map`.

## src/components/registrations/RegistrationStatus.jsx

Wizard intake, field metadata, trạng thái, tệp và xem trước ảnh trong bộ nhớ.

### RegistrationStatus(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Hiển thị badge trạng thái hồ sơ bằng enum và nhãn/màu tập trung.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { status }. Các props/callback lấy từ caller. |

## src/components/registrations/RegistrationWizard.jsx

Wizard intake, field metadata, trạng thái, tệp và xem trước ảnh trong bộ nhớ.

### WizardSteps(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Render thứ tự các bước và aria-current, cho chuyển bước khi không có thao tác đang chạy.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { step, onChange, disabled }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `WIZARD_STEPS.map`.

### RegistrationSummary(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Đọc các trường intake theo section để người dùng kiểm tra trước gửi; enum giới tính được Việt hóa, dữ liệu nhập giữ nguyên.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { record }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `FORM_SECTIONS.map`, `fields.map`.

## src/components/WorkflowUI.jsx

UI dùng chung, workflow states và logo Azure. Component nhận data/callback; service chịu trách nhiệm request.

### PageHeading(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Dựng tiêu đề, mô tả và action của màn hình theo cùng bố cục.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { title, description, action, id }. Các props/callback lấy từ caller. |

### ResourceState(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Hiển thị loading/error và nút reload của resource mà không giả lập dữ liệu.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { resource }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### Pagination(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tính tổng trang và khóa nút trước/sau theo page/pageSize/total từ server.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { data, onChange }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Math.max`, `Math.ceil`.

### BackLink(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Tạo liên kết quay lại với nhãn thông điệp mặc định hoặc nội dung caller truyền.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { to, children = msg(MSG.QUAY_LAI) }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### Field(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Render input/select/textarea controlled; giữ option value enum API và chỉ dịch label.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { label, name, value, onChange, options, multiline, ...props }. Các props/callback lấy từ caller. |

Lời gọi chính: `options.map`.

### MutationState(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Hiển thị pending/error/notice và yêu cầu reload khi kết quả ghi chưa chắc chắn.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { mutation, reload }. Các props/callback lấy từ caller. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `mutation.reset`.

### StateBadge(options0)

**Kết quả:** React UI/JSX hoặc null/redirect theo trạng thái. Callback trong component không trực tiếp cấp quyền hoặc ghi database.

Chọn màu badge từ enum trạng thái và trả nhãn tiếng Việt an toàn.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { value }. Các props/callback lấy từ caller. |
