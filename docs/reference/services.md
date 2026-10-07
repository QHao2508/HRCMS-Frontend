# Giải thích function: services

Các function có tên trong source nghiệp vụ/UI. Callback anonymous của LINQ/React và getter tự động được giải thích trong function bao ngoài; migration sinh tự động được giữ nguyên.

## src/services/api.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### refreshSession()

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Dùng chung một request refresh cho nhiều lỗi 401 đồng thời; kiểm generation để response muộn không phục hồi phiên đã đăng xuất.

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Promise.reject`, `api.post`.

## src/services/apiError.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### normalizeApiError(error)

**Kết quả:** Đối tượng dữ liệu chuẩn hóa/snapshot được mô tả ở mục đích; kiểu và trường xuất ra được xác định bởi return trong source.

Chuẩn hóa JSON/blob/lỗi mạng thành thông báo tiếng Việt, giữ status/trace/reference và mã auth có cấu trúc cho điều hướng.

| Đầu vào | Ý nghĩa |
|---|---|
| `error` | Lỗi từ HTTP/network/ghi dữ liệu cần chuẩn hóa hoặc trình bày an toàn. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `data.text`, `JSON.parse`, `value.trim`, `Object.values`, `Object.fromEntries`, `Object.entries`, `Array.isArray`.

## src/services/authService.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### fetchCurrentUser(generation)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Gọi /me rồi kiểm profile qua session store trước khi xác nhận đăng nhập.

| Đầu vào | Ý nghĩa |
|---|---|
| `generation` | Số thế hệ phiên; chặn request muộn cập nhật phiên mới hoặc phiên đã đăng xuất. |

Lời gọi chính: `api.get`.

### login(credentials)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Xóa phiên cũ, gửi credentials, lưu token và lấy /me; lỗi hoặc cần xác thực không tạo phiên authenticated.

| Đầu vào | Ý nghĩa |
|---|---|
| `credentials` | Giá trị credentials truyền vào login; tham chiếu phần thân để xem cách dùng. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### restoreSession()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Khôi phục phiên từ token bằng /me và dùng chung promise khi StrictMode gọi lặp; lỗi thì xóa session.

Lời gọi chính: `Promise.resolve`.

### logout()

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Gửi yêu cầu thu hồi phiên nếu có token, luôn xóa session local trong finally.

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### register(options0)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Trim trường danh tính và chỉ gửi contract đăng ký chủ ngựa; giữ nguyên password, không lưu OTP/credential hay đăng nhập tự động.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { firstName, lastName, userName, email, phone, address, nationalId, password, confirmPassword }. Các props/callback lấy từ caller. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`, `firstName.trim`, `lastName.trim`, `userName.trim`, `email.trim`, `phone.trim`, `address.trim`.

### verifyEmail(options0)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Gửi email/OTP và yêu cầu verified=true mới coi là thành công; không cấp token.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { email, code }. Các props/callback lấy từ caller. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `api.post`, `email.trim`, `code.trim`.

### resendVerification(options0)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Gửi email tới endpoint resend và dùng phản hồi chung, không suy luận tài khoản tồn tại.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { email }. Các props/callback lấy từ caller. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`, `email.trim`.

### forgotPassword(options0)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Gửi email để yêu cầu OTP reset và giữ phản hồi chung cho mọi email.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { email }. Các props/callback lấy từ caller. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`, `email.trim`.

### submitPassword(path, options1, failureMessage)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Dùng contract ResetRequest chung cho reset/invite; yêu cầu changed=true và giữ tính đúng đắn của session khi request thất bại.

| Đầu vào | Ý nghĩa |
|---|---|
| `path` | Giá trị path truyền vào submitPassword; tham chiếu phần thân để xem cách dùng. |
| `options1` | Đối tượng destructuring: { email, code, password, confirmPassword }. Các props/callback lấy từ caller. |
| `failureMessage` | Giá trị failureMessage truyền vào submitPassword; tham chiếu phần thân để xem cách dùng. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`, `email.trim`, `code.trim`.

### resetPassword(request)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Gửi OTP và mật khẩu mới đến endpoint Reset, không dùng link token trên URL.

| Đầu vào | Ý nghĩa |
|---|---|
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### acceptInvitation(request)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Gửi OTP Invite và mật khẩu tự chọn của nhân viên để kích hoạt tài khoản.

| Đầu vào | Ý nghĩa |
|---|---|
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

## src/services/authValidation.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### validateEmail(values)

**Kết quả:** Object lỗi theo field; object rỗng khi dữ liệu form đạt các kiểm tra phía client.

Trim email và kiểm cú pháp trước khi gửi; backend vẫn là nơi quyết định hợp lệ cuối cùng.

| Đầu vào | Ý nghĩa |
|---|---|
| `values` | Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `u.test`.

### validatePasswords(values)

**Kết quả:** Object lỗi theo field; object rỗng khi dữ liệu form đạt các kiểm tra phía client.

Kiểm giới hạn độ dài, chữ hoa/thường/số và confirmPassword theo AUTH_POLICY.

| Đầu vào | Ý nghĩa |
|---|---|
| `values` | Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `u.test`.

### validateRegistration(values)

**Kết quả:** Object lỗi theo field; object rỗng khi dữ liệu form đạt các kiểm tra phía client.

Kiểm các trường bắt buộc, username/email, mật khẩu và căn cước optional theo policy kiểm vào.

| Đầu vào | Ý nghĩa |
|---|---|
| `values` | Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### validateVerification(values)

**Kết quả:** Object lỗi theo field; object rỗng khi dữ liệu form đạt các kiểm tra phía client.

Kiểm email và đúng 6 chữ số ASCII của OTP xác thực.

| Đầu vào | Ý nghĩa |
|---|---|
| `values` | Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### validatePasswordSetup(values)

**Kết quả:** Object lỗi theo field; object rỗng khi dữ liệu form đạt các kiểm tra phía client.

Kiểm email, OTP 6 chữ số và chính sách mật khẩu mới trước reset/invite.

| Đầu vào | Ý nghĩa |
|---|---|
| `values` | Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### getNavigationEmail(state)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Lấy email hợp lệ về kiểu/độ dài từ router state; không đọc mật khẩu/OTP từ query URL.

| Đầu vào | Ý nghĩa |
|---|---|
| `state` | Giá trị state truyền vào getNavigationEmail; tham chiếu phần thân để xem cách dùng. |

## src/services/clubService.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### idPath(id)

**Kết quả:** Chuỗi nhãn/URL/thời gian đã định dạng theo hợp đồng của helper; không dùng nhãn tiếng Việt thay enum value.

Encode ID trước khi ghép đường dẫn endpoint ngựa/hồ sơ.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

### listHorses(params)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc danh sách có lọc/phân trang ngựa qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `params` | Giá trị params truyền vào listHorses; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `api.get`.

### getHorse(id)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc chi tiết ngựa qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

Lời gọi chính: `api.get`.

### assignStaff(id, request)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Phân công nhân viên qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### reviewRegistration(id, request)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Duyệt hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### editAdministrativeRegistration(id, request)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Chỉnh sửa Administrative Registration qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.put`.

### staffDirectory(role)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc hết trang danh bạ theo role, lọc kết quả đúng role và trả danh sách để chọn người phân công.

| Đầu vào | Ý nghĩa |
|---|---|
| `role` | Role enum chính xác của backend để kiểm quyền/lọc dữ liệu. |

Lời gọi chính: `api.get`, `items.push`, `items.filter`.

### fetchHorsePhoto(id)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Tải dữ liệu Horse Photo qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

Lời gọi chính: `api.get`.

## src/services/historyView.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### historyView(snapshot)

**Kết quả:** Đối tượng dữ liệu chuẩn hóa/snapshot được mô tả ở mục đích; kiểu và trường xuất ra được xác định bởi return trong source.

Đọc snapshot JSON lịch sử dạng cũ/mới, chuyển thành nhãn/dòng hiển thị mà không xuất các ID nội bộ.

| Đầu vào | Ý nghĩa |
|---|---|
| `snapshot` | JSON lịch sử đã lưu; chỉ parse và hiển thị các trường cần thiết. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `JSON.parse`, `Array.isArray`, `rows.push`.

### historyView.add(label, value)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đưa một giá trị snapshot đơn giản vào dòng hiển thị; bỏ cấu trúc không hợp lệ hoặc dữ liệu không cần xuất.

| Đầu vào | Ý nghĩa |
|---|---|
| `label` | Giá trị label truyền vào add; tham chiếu phần thân để xem cách dùng. |
| `value` | Giá trị value truyền vào add; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `rows.push`.

## src/services/registrationAttachments.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### path(id)

**Kết quả:** Chuỗi nhãn/URL/thời gian đã định dạng theo hợp đồng của helper; không dùng nhãn tiếng Việt thay enum value.

**Kết quả:** Chuỗi nhãn/URL/thời gian đã định dạng theo hợp đồng của helper; không dùng nhãn tiếng Việt thay enum value.

Tạo đường dẫn API với ID được encodeURIComponent để dữ liệu không chèn vào URL.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

### listAttachments(id)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc danh sách có lọc/phân trang tệp đính kèm qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

Lời gọi chính: `api.get`.

### validateAttachment(options0, count)

**Kết quả:** Chuỗi lỗi tiếng Việt hoặc chuỗi rỗng khi file hợp lệ.

Kiểm loại tệp, đuôi, dung lượng, số tệp và ngày chứng nhận; backend kiểm thêm chữ ký nội dung.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { file, type, certificateNumber = "", issueDate = "", expiryDate = "" }. Các props/callback lấy từ caller. |
| `count` | Giá trị count truyền vào validateAttachment; tham chiếu phần thân để xem cách dùng. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `ATTACHMENT_TYPES.includes`.

### attachmentFormData(values)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Tạo multipart chỉ chứa file/type và metadata chứng nhận khi đúng loại; không tự đặt boundary.

| Đầu vào | Ý nghĩa |
|---|---|
| `values` | Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API. |

Lời gọi chính: `form.append`.

### uploadAttachment(id, values)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

POST FormData qua API có authentication; browser tạo Content-Type/boundary của multipart.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `values` | Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### fetchAttachment(id, attachmentId)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Tải blob qua API kiểm quyền thay vì dùng URL Azure private/SAS trong UI.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `attachmentId` | Giá trị attachmentId truyền vào fetchAttachment; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `api.get`.

## src/services/registrationPhoto.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### saveDraftWithPhoto(options0)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Lưu hoặc cập nhật bản nháp trước, báo onSaved để giữ ID rồi upload ảnh; lỗi upload không khiến lần thử lại tạo hồ sơ mới.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { registrationId, values, file, onSaved }. Các props/callback lấy từ caller. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

## src/services/registrationService.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### path(id)

Tạo đường dẫn API với ID được encodeURIComponent để dữ liệu không chèn vào URL.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

### listRegistrations(options0)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc danh sách có lọc/phân trang hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `options0` | Đối tượng destructuring: { status = "", page = 1, pageSize = 20 } = {}. Các props/callback lấy từ caller. |

Lời gọi chính: `api.get`.

### getRegistration(id)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc chi tiết hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

Lời gọi chính: `api.get`.

### createRegistration(form)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Tạo mới hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `form` | Giá trị form controlled, chưa được coi là dữ liệu đã lưu ở server. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### updateRegistration(id, form)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Cập nhật hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `form` | Giá trị form controlled, chưa được coi là dữ liệu đã lưu ở server. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.put`.

### submitRegistration(id)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Gửi hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### cancelRegistration(id)

**Kết quả:** Boolean thể hiện kiểm tra đúng/sai; không sửa dữ liệu server.

Hủy hồ sơ đăng ký qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### listPreferredStaff()

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc danh sách có lọc/phân trang Preferred Staff qua API client; giữ giá trị enum/payload theo hợp đồng backend.

Lời gọi chính: `Promise.all`, `PREFERENCES.map`, `api.get`, `staff.push`, `items.filter`, `Object.fromEntries`.

## src/services/registrationValidation.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### registrationForm(record)

**Kết quả:** Đối tượng dữ liệu chuẩn hóa/snapshot được mô tả ở mục đích; kiểu và trường xuất ra được xác định bởi return trong source.

Chuyển các trường intake được phép sửa thành chuỗi controlled, thay null bằng chuỗi rỗng.

| Đầu vào | Ý nghĩa |
|---|---|
| `record` | Bản ghi/payload do server trả hoặc giá trị dùng dựng form; không tự phát minh ID/trạng thái. |

Lời gọi chính: `Object.fromEntries`, `EDITABLE_FIELDS.map`.

### registrationPayload(form)

**Kết quả:** Đối tượng dữ liệu chuẩn hóa/snapshot được mô tả ở mục đích; kiểu và trường xuất ra được xác định bởi return trong source.

Gửi đủ trường owner PUT, đổi rỗng thành null và chỉ đổi height/weight sang number; tránh gửi field quản lý hoặc role.

| Đầu vào | Ý nghĩa |
|---|---|
| `form` | Giá trị form controlled, chưa được coi là dữ liệu đã lưu ở server. |

Lời gọi chính: `Object.fromEntries`, `EDITABLE_FIELDS.map`.

### validDate(value)

**Kết quả:** Boolean thể hiện kiểm tra đúng/sai; không sửa dữ liệu server.

Kiểm ngày ISO có thật, không chấp nhận ngày bị JavaScript tự điều chỉnh như ngày 30 tháng 2.

| Đầu vào | Ý nghĩa |
|---|---|
| `value` | Giá trị value truyền vào validDate; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `Number.isFinite`, `date.getTime`, `date.toISOString`.

### validateDraft(form, today)

**Kết quả:** Object lỗi theo field; object rỗng khi dữ liệu form đạt các kiểm tra phía client.

Cho phép bản nháp chưa đủ thông tin nhưng kiểm dữ liệu đã nhập, giới hạn thể chất và thứ tự/ngày hợp lệ.

| Đầu vào | Ý nghĩa |
|---|---|
| `form` | Giá trị form controlled, chưa được coi là dữ liệu đã lưu ở server. |
| `today` | Ngày nghiệp vụ dùng kiểm form; truyền được trong kiểm thử để cố định ranh giới. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Intl.DateTimeFormat`, `Number.isFinite`, `HORSE_GENDERS.includes`.

### submissionMissing(record, attachments)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Liệt kê trường bắt buộc còn thiếu và yêu cầu đúng HorsePhoto/Certificate trước khi gửi hồ sơ.

| Đầu vào | Ý nghĩa |
|---|---|
| `record` | Bản ghi/payload do server trả hoặc giá trị dùng dựng form; không tự phát minh ID/trạng thái. |
| `attachments` | Giá trị attachments truyền vào submissionMissing; tham chiếu phần thân để xem cách dùng. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `required.filter`, `fields.find`, `attachments.some`, `missing.push`.

## src/services/sessionStore.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### isToken(value)

**Kết quả:** Boolean thể hiện kiểm tra đúng/sai; không sửa dữ liệu server.

Kiểm giá trị token là chuỗi không rỗng trước khi đưa vào phiên.

| Đầu vào | Ý nghĩa |
|---|---|
| `value` | Giá trị value truyền vào isToken; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `value.trim`.

### readStoredTokens()

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đọc bộ token/expiry từ localStorage, bỏ dữ liệu hỏng; hồ sơ user cache không được xem là bằng chứng đăng nhập.

Lời gọi chính: `JSON.parse`, `localStorage.getItem`, `Number.isFinite`.

### getSession()

**Kết quả:** Đối tượng dữ liệu chuẩn hóa/snapshot được mô tả ở mục đích; kiểu và trường xuất ra được xác định bởi return trong source.

Trả snapshot session hiện tại để React đọc nhất quán qua useSyncExternalStore.

### subscribeSession(listener)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Đăng ký listener session và trả hàm hủy đăng ký để component không bị rò rỉ subscription.

| Đầu vào | Ý nghĩa |
|---|---|
| `listener` | Giá trị listener truyền vào subscribeSession; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `listeners.add`, `listeners.delete`.

### publish(next)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Cập nhật snapshot, lưu token an toàn theo cơ chế hiện có và báo listener; tiếp tục dùng phiên trong bộ nhớ nếu storage lỗi.

| Đầu vào | Ý nghĩa |
|---|---|
| `next` | Giá trị next truyền vào publish; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `localStorage.setItem`, `JSON.stringify`, `localStorage.removeItem`, `listeners.forEach`.

### assertCurrentSession(generation)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Chặn response của generation cũ cập nhật phiên sau logout hoặc một lần login khác.

| Đầu vào | Ý nghĩa |
|---|---|
| `generation` | Số thế hệ phiên; chặn request muộn cập nhật phiên mới hoặc phiên đã đăng xuất. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### setTokens(data, generation)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Kiểm cấu trúc token và expiresIn, tính expiry rồi cập nhật store; chưa đánh dấu authenticated cho đến khi /me xác nhận.

| Đầu vào | Ý nghĩa |
|---|---|
| `data` | Giá trị data truyền vào setTokens; tham chiếu phần thân để xem cách dùng. |
| `generation` | Số thế hệ phiên; chặn request muộn cập nhật phiên mới hoặc phiên đã đăng xuất. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

Lời gọi chính: `Date.now`, `Number.isFinite`.

### setCurrentUser(user, generation)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Chỉ xác lập authenticated khi có token cùng user đang hoạt động/đã xác thực và đúng generation.

| Đầu vào | Ý nghĩa |
|---|---|
| `user` | Tài khoản đã tra cứu/kiểm; response chỉ được lấy trường cho phép. |
| `generation` | Số thế hệ phiên; chặn request muộn cập nhật phiên mới hoặc phiên đã đăng xuất. |

- Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.

### clearSession(generation)

**Kết quả:** Giá trị return hoặc Promise theo thao tác ở phần thân; handler cập nhật state có thể không trả dữ liệu. Các lỗi không chắc chắn được giữ cho caller/hook xử lý.

Xóa token/user và tăng generation để các request cũ không khôi phục phiên.

| Đầu vào | Ý nghĩa |
|---|---|
| `generation` | Số thế hệ phiên; chặn request muộn cập nhật phiên mới hoặc phiên đã đăng xuất. |

## src/services/trainingPayload.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### sessionPayload(form)

**Kết quả:** Đối tượng dữ liệu chuẩn hóa/snapshot được mô tả ở mục đích; kiểu và trường xuất ra được xác định bởi return trong source.

Chuyển giá trị form buổi tập sang contract API, số/null và lịch UTC theo múi giờ câu lạc bộ.

| Đầu vào | Ý nghĩa |
|---|---|
| `form` | Giá trị form controlled, chưa được coi là dữ liệu đã lưu ở server. |

## src/services/trainingService.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### path(kind, id)

**Kết quả:** Chuỗi nhãn/URL/thời gian đã định dạng theo hợp đồng của helper; không dùng nhãn tiếng Việt thay enum value.

Tạo đường dẫn API với ID được encodeURIComponent để dữ liệu không chèn vào URL.

| Đầu vào | Ý nghĩa |
|---|---|
| `kind` | Giá trị kind truyền vào path; tham chiếu phần thân để xem cách dùng. |
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

### listTemplates(params)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc danh sách có lọc/phân trang giáo án qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `params` | Giá trị params truyền vào listTemplates; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `api.get`.

### createTemplate(request)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Tạo mới giáo án qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### editTemplate(id, request)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Chỉnh sửa giáo án qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.put`.

### archiveTemplate(id)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Lưu trữ giáo án qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### listPlans(params)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc danh sách có lọc/phân trang kế hoạch huấn luyện qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `params` | Giá trị params truyền vào listPlans; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `api.get`.

### createPlan(request)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Tạo mới kế hoạch huấn luyện qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### getPlan(id, params)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc chi tiết kế hoạch huấn luyện qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `params` | Giá trị params truyền vào getPlan; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `api.get`.

### editPlan(id, request)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Chỉnh sửa kế hoạch huấn luyện qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.put`.

### changePlanStatus(id, status)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

PUT enum trạng thái mới của kế hoạch; backend kiểm chuyển trạng thái và các buổi tập còn hoạt động.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `status` | Trạng thái enum API, tách khỏi nhãn tiếng Việt. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.put`.

### planHistory(id, params)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc lịch sử kế hoạch có phân trang; trả snapshot đã lưu thay vì suy diễn lịch sử từ dữ liệu hiện tại.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `params` | Giá trị params truyền vào planHistory; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `api.get`.

### createSession(id, request)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Tạo mới buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### listSessions(params)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đọc danh sách có lọc/phân trang buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `params` | Giá trị params truyền vào listSessions; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `api.get`.

### getSession(id)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Trả snapshot session hiện tại để React đọc nhất quán qua useSyncExternalStore.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

Lời gọi chính: `api.get`.

### editSession(id, request)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Chỉnh sửa buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.put`.

### startSession(id)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Bắt đầu buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### skipSession(id, reason)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Bỏ qua buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `reason` | Giá trị reason truyền vào skipSession; tham chiếu phần thân để xem cách dùng. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### submitResult(id, request)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Gửi kết quả buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

### evaluateSession(id, request)

**Kết quả:** Promise kết quả API (hoặc lỗi đã chuẩn hóa). Chỉ response thành công mới được dùng cập nhật dữ liệu UI.

Đánh giá buổi tập qua API client; giữ giá trị enum/payload theo hợp đồng backend.

| Đầu vào | Ý nghĩa |
|---|---|
| `id` | ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi. |
| `request` | Request đã có hợp đồng; thao tác upload dùng abstraction tách khỏi HTTP. |

- Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.

Lời gọi chính: `api.post`.

## src/services/workflowHelpers.js

Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX.

### isAssigned(horse, user, role)

**Kết quả:** Boolean thể hiện kiểm tra đúng/sai; không sửa dữ liệu server.

Kiểm user ID/role trong phân công đang hoạt động của ngựa để quyết định action UI; API vẫn kiểm quyền lại.

| Đầu vào | Ý nghĩa |
|---|---|
| `horse` | Giá trị horse truyền vào isAssigned; tham chiếu phần thân để xem cách dùng. |
| `user` | Tài khoản đã tra cứu/kiểm; response chỉ được lấy trường cho phép. |
| `role` | Role enum chính xác của backend để kiểm quyền/lọc dữ liệu. |

### clubToday()

**Kết quả:** Chuỗi nhãn/URL/thời gian đã định dạng theo hợp đồng của helper; không dùng nhãn tiếng Việt thay enum value.

Tạo ngày ISO hiện tại theo timezone câu lạc bộ để mặc định/kiểm ngày form.

Lời gọi chính: `Intl.DateTimeFormat`.

### localDateTime(value)

**Kết quả:** Chuỗi nhãn/URL/thời gian đã định dạng theo hợp đồng của helper; không dùng nhãn tiếng Việt thay enum value.

Tạo chuỗi datetime-local theo giờ câu lạc bộ cho input; không dùng locale hiển thị để tạo payload.

| Đầu vào | Ý nghĩa |
|---|---|
| `value` | Giá trị value truyền vào localDateTime; tham chiếu phần thân để xem cách dùng. |

Lời gọi chính: `Number.isFinite`, `date.getTime`, `Intl.DateTimeFormat`.

### scheduledPayload(value)

**Kết quả:** Chuỗi nhãn/URL/thời gian đã định dạng theo hợp đồng của helper; không dùng nhãn tiếng Việt thay enum value.

Chuyển datetime-local sang thời điểm có offset nghiệp vụ để backend nhận đúng UTC.

| Đầu vào | Ý nghĩa |
|---|---|
| `value` | Giá trị value truyền vào scheduledPayload; tham chiếu phần thân để xem cách dùng. |
