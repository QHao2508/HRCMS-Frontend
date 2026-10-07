# Màn hình và kết nối API — 07/10/2026

Frontend dùng React/Vite, đã kết nối backend SQL Server qua các service thật. Không thay layout hoặc tạo thêm module chưa có UI.

## Màn hình hiện có

| Nhóm | Route/màn hình | API |
| --- | --- | --- |
| Tài khoản | /login, /register, /verify-email, /forgot-password, /reset-password, /accept-invitation; nút logout | /api/auth/*, /api/auth/me |
| Tổng quan | /dashboard | /api/dashboard |
| Đăng ký ngựa (Owner) | /registrations, /registrations/new, /registrations/:id; wizard, draft/edit, upload/download, submit/cancel | /api/registrations/*, /api/staff/directory |
| Duyệt hồ sơ (Manager) | /reviews, /reviews/:id; chỉnh thông tin quản lý, yêu cầu sửa/phê duyệt | /api/registrations/*, /review |
| Hồ sơ ngựa | /horses, /horses/:id; tìm kiếm, ảnh, thông tin, lịch sử phân công và form phân công theo quyền | /api/horses/*, /assignments, /photo, /api/staff/directory |
| Giáo án | /training/templates; danh sách, tạo/sửa/lưu trữ trong cùng màn hình (HeadTrainer) | /api/training/templates/* |
| Kế hoạch | /training/plans, /training/plans/new, /training/plans/:id; chỉnh, đổi trạng thái, hạn chế vận động, buổi tập và lịch sử | /api/training/plans/* |
| Buổi tập | /training/sessions, /training/plans/:id/sessions/new, /training/sessions/:id; chỉnh/giao Rider, bắt đầu, bỏ qua, kết quả và đánh giá | /api/training/sessions/* |
| Trạng thái điều hướng | /permission-denied, trang 404; route guard và navigation theo role | Backend vẫn kiểm role/owner/assignment/state |

Chưa có UI cho y tế, chăm sóc/chuồng, kho, báo cáo, danh sách thông báo/audit hoặc quản lý tài khoản nhân viên. Dashboard có số tổng hợp và phân công có danh sách nhân viên, không phải màn hình quản lý riêng cho các module đó.

## Chạy local

Backend tại E:/SWP391/HorseClub:

```powershell
dotnet run --project Horse_BackEnd --configuration Release --launch-profile http
```

Frontend tại thư mục repository này:

```powershell
npm ci
npm run dev
```

Mở http://localhost:5173. Vite giữ cổng 5173, không tự đổi cổng khi bị chiếm. Request /api, /health và /openapi được proxy tới http://localhost:5299, nên chạy local không cần tạo .env. Có thể đổi API_PROXY_TARGET trong .env.local khi backend ở origin khác. VITE_API_BASE_URL để trống dùng cùng origin; nếu cấu hình trực tiếp thì chỉ đặt origin backend, không thêm /api.

Proxy chỉ hoạt động trong Vite dev. Khi deploy, cấu hình reverse proxy cùng origin hoặc đặt VITE_API_BASE_URL khi build và cho origin frontend trong CORS backend. npm run preview chỉ phục vụ build, không thay reverse proxy API production.

Tokens là opaque Bearer; service đã xử lý refresh, restore /me, logout, paging, enum chuỗi, multipart và 204. Không có password/code/token thật trong source hoặc báo cáo.

## Kiểm chứng

- npm run build và npm run lint: pass.
- npm test: 150 pass, không fail/skip; đây là kiểm service/component với mock.
- Chromium headless: 59 lượt mở màn hình theo 7 vai trò, không lỗi JavaScript hoặc lỗi API ngoài probe quyền Groom có chủ đích. Bản test thực hiện navigation SPA; reload liên tục trong test trước đó đã kích hoạt đúng rate limit auth, không thay giới hạn runtime.
- npm run test:live: pass qua frontend -> Vite proxy -> API -> SQL Server tạm, sử dụng các service của ứng dụng, không mock Axios.
- Fixture live kiểm login/me/dashboard/horses cho 7 role; draft/cancel, intake đầy đủ, upload/download, submit/review, assignment, template/plan/session, start/result/evaluation/history, refresh/logout.
- Database test đã được dọn sau kiểm chứng; file/key test trong TestResults của backend. Database test và file/key test tách riêng HRCMS. Không thêm dữ liệu fixture vào HRCMS.

Chạy smoke service đọc dữ liệu với tài khoản test sẵn có:

```powershell
$env:HRCMS_LIVE_API_URL = 'http://localhost:5173'
$env:HRCMS_LIVE_EMAIL = 'email-tai-khoan-test'
# Cấp HRCMS_LIVE_PASSWORD qua môi trường bảo mật, không commit vào .env.example.
npm run test:live
Remove-Item Env:HRCMS_LIVE_EMAIL,Env:HRCMS_LIVE_PASSWORD,Env:HRCMS_LIVE_API_URL
```

Mặc định smoke test chỉ đọc dữ liệu nghiệp vụ, login và logout (logout thu hồi session theo backend). HRCMS_LIVE_FIXTURE=1 bật kiểm ghi dữ liệu chỉ cho môi trường fixture được chuẩn bị riêng; không dùng cờ đó trên database thật. Test không tự seed hoặc xóa database.

UI gửi và nhận dữ liệu qua contract hiện tại, chưa chứng minh SMTP ngoài hệ thống hoặc toàn bộ trường hợp lỗi trên production. Snapshot API: E:/SWP391/HorseClub/docs/contracts/openapi.current.json.
