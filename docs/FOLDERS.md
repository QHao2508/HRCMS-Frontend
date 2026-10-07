# Chức năng từng folder

Frontend React: route/page → hook/service → Axios → API. Enum giữ hợp đồng backend; message giữ nội dung tiếng Việt.

| Folder | Chức năng |
|---|---|
| `docs` | Tài liệu thiết kế/chính sách, hướng dẫn chạy/Azure/SMTP, hợp đồng và giải thích code; README là điểm vào tìm tài liệu. |
| `docs/reference` | Tra cứu từng function theo module: mục đích, đầu vào, lời gọi chính và lưu ý quyền/transaction/I/O. |
| `eslint-rules` | Quy tắc ESLint của dự án chặn chữ hiển thị hardcoded trong JSX/label. |
| `public` | Tài nguyên public được Vite phục vụ trực tiếp: favicon và ảnh nền thiết kế. Logo/ảnh ngựa được đọc từ Azure qua API. |
| `public/images` | Ảnh nền tĩnh của giao diện; khác với file người dùng upload được lưu trên Azure. |
| `src` | Source React: pages/component/hooks/services/routes, enum và catalog tiếng Việt. |
| `src/components` | UI dùng chung, workflow states và logo Azure. Component nhận data/callback; service chịu trách nhiệm request. |
| `src/components/auth` | Form, input, button, logout và thiết lập mật khẩu chung cho các luồng OTP. |
| `src/components/registrations` | Wizard intake, field metadata, trạng thái, tệp và xem trước ảnh trong bộ nhớ. |
| `src/constants` | Enum API và cấu hình giới hạn dùng chung; label hiển thị lấy từ messages, không dùng label để gửi API. |
| `src/context` | AuthProvider và hook quản lý session, form, cooldown, resource và mutation; khóa request lặp/response stale. |
| `src/layouts` | PublicLayout cho Home/auth và AppLayout cho trang quản lý; cùng logo, giữ palette của từng theme. |
| `src/messages` | MSG key enum, catalog VI, formatter và bản dịch lỗi API. Dữ liệu người dùng nhập không bị dịch. |
| `src/pages` | Component cấp màn hình theo route, phối hợp form/resource/mutation và service. |
| `src/pages/auth` | Login, Register, VerifyEmail, Forgot/ResetPassword và AcceptInvitation; OTP 6 chữ số, không dùng mật khẩu/OTP trên URL. |
| `src/pages/horses` | Danh sách/hồ sơ ngựa, ảnh Azure qua API private và phân công nhân sự theo quyền. |
| `src/pages/registrations` | Tạo/lưu bản nháp, wizard, upload ảnh/tài liệu, gửi/hủy và danh sách intake. |
| `src/pages/reviews` | Màn hình quản lý duyệt hoặc yêu cầu chỉnh sửa intake. |
| `src/pages/training` | Giáo án mẫu, kế hoạch, buổi tập, kết quả và đánh giá theo vai trò. |
| `src/routes` | Ánh xạ URL, protected/role guards, menu theo quyền và redirect đích an toàn. |
| `src/services` | Axios và API clients, chuẩn hóa payload/lỗi, validators, session store và helpers domain; không render JSX. |
| `src/style` | CSS theme chung và CSS Home có scope riêng; giữ màu màn hình khác khi thay logo/Home. |
| `src/utils` | Helper thuần dùng chung, hiện gồm tên user hiển thị an toàn. |
| `tests` | Node test và SSR qua Vite/React; mock API để kiểm hợp đồng, role, OTP, session và upload, không phụ thuộc UI đang mở. |
| `tests/live` | Smoke test API thật; chỉ chạy khi bật script test:live và cung cấp cấu hình kiểm thử phù hợp. |

## Dữ liệu và file không được dọn như cache

User Secrets, file cấu hình local, Data Protection keys trong App_Data/keys, credential và dữ liệu Azure không phải build artifact. Migration/snapshot, package lock, CI, test và tài liệu baseline vẫn cần cho bảo trì. node_modules cung cấp dependency cho frontend chạy; chỉ cache Vite được dọn. bin/obj/dist/TestResults có thể tạo lại.

Các folder hệ thống/third-party không thuộc source: .git giữ lịch sử repository; .vs giữ thiết lập/cache IDE cá nhân; node_modules giữ dependency để chạy npm. Các cache/build bin, obj, dist, .vite và TestResults được tạo lại bởi tool, không lưu code nghiệp vụ.
