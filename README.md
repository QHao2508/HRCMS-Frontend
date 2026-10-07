# HRCMS-Frontend

Repository frontend riêng cho hệ thống quản lý câu lạc bộ và huấn luyện ngựa đua HorseClub. Thiết kế đã hoàn thành trên Figma theo thông tin nhóm; frontend hiện có baseline React/Vite và hạ tầng phiên đăng nhập.

- Backend: [QHao2508/HRCMS](https://github.com/QHao2508/HRCMS), nhánh main.
- Thiết kế: [Figma HorseClub](https://www.figma.com/design/AKLYJd26mWHeG1W8V0ach5/Figma-basics--Copy-?node-id=1669-162202).
- Hướng dẫn API/database: [BACKEND_GUIDE.md](https://github.com/QHao2508/HRCMS/blob/main/docs/BACKEND_GUIDE.md).
- Phân công backend: [BACKEND_TASK_ASSIGNMENT.md](https://github.com/QHao2508/HRCMS/blob/main/docs/BACKEND_TASK_ASSIGNMENT.md).

## Phạm vi giao diện

Giao diện cho 7 vai trò: Horse Owner, Club Manager, Head Trainer, Trainer, Work Rider, Veterinarian và Groom. Các module gồm tài khoản, hồ sơ/phân công ngựa, huấn luyện, thú y, chăm sóc/chuồng, kho, thông báo và báo cáo.

Phase 1 có Login, khôi phục phiên, refresh token và logout. Phase 2 bổ sung đăng ký Horse Owner, xác thực/resend email, forgot/reset password và nhận invitation staff. Phase 3 bổ sung authenticated shell, role guards và dashboard giới thiệu tài khoản. Phase 4 bổ sung F01 phía HorseOwner; chưa triển khai Manager review, assignment, dashboard nghiệp vụ hoặc quản lý staff.

## Chạy frontend và kiểm tra

1. Cài dependencies bằng `npm ci` (Node.js 24 được dùng khi kiểm chứng).
2. Sao chép `.env.example` thành `.env.local`; đặt `VITE_API_BASE_URL` bằng origin backend, ví dụ `http://localhost:5299`, không thêm `/api`. Khởi động lại Vite sau khi đổi cấu hình.
3. Chạy `npm run dev`; backend cần cho phép origin frontend trong `Cors:Origins`.
4. Kiểm tra bằng `npm run lint`, `npm test`, `npm run build`. Tests dùng Node test runner và mock Axios, không gọi backend/database. `dist/` được Git ignore.

Session lưu trong `localStorage` tại `hrcms.session`: access token, refresh token, `expiresAt` (milliseconds) và user từ `/api/auth/me`. Startup luôn xác thực lại bằng `/me`, không tin user đã lưu. Token là opaque; không decode JWT và không suy đoán thời hạn refresh token. HTTP 401 của request có token kích hoạt một refresh dùng chung trong tab, sau đó retry tối đa một lần. Refresh thất bại hoặc retry vẫn 401 sẽ xóa session. HTTP 403/409 không refresh/retry. Khi storage không khả dụng, phiên chỉ tồn tại trong bộ nhớ. Dữ liệu token/user của scaffold cũ được bỏ qua và dọn khi session được cập nhật.

Logout gọi backend nếu có token và luôn xóa session local; nếu backend không liên lạc được, màn hình Login thông báo chưa xác nhận được logout phía server. Login chỉ chuyển vào dashboard sau khi `/me` trả user active, verified. Chưa đồng bộ session giữa các tab.

## Phase 2 — account lifecycle

Public routes: `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/accept-invitation`. Register chỉ tạo HorseOwner; không có role selector và không đăng nhập tự động. Register → Verify Email → Login. Forgot Password trả thông báo generic; người dùng chuyển sang Reset Password và nhập code nhận qua email. Invitation chỉ đặt password cho account đã được management tạo, không tạo staff mới.

Services dùng đúng `/api/auth/register`, `/verify-email`, `/resend-verification`, `/forgot-password`, `/reset-password`, `/accept-invitation` và API client chung. `verified`/`changed` phải là boolean `true`; HTTP 200 với false hoặc thiếu cờ không được xem là thành công. Password setup thành công xóa session local hiện tại qua Phase 1 store để yêu cầu đăng nhập mới; thất bại không đổi session.

Client validation trong `src/services/authValidation.js` theo `HorseClub.BLL/Contracts/Requests.cs`, `Services/AuthenticationService.cs`, `Infrastructure/ClubOptions.cs` và checked-in `Horse_BackEnd/appsettings.json`:

- National ID hiện **optional**: `RequireNationalId` không được override, default false. Nếu nhập thì đúng 12 ASCII digits; giữ dạng string để không mất số 0 đầu. Không lưu National ID phía client.
- Password 12–128 characters, có uppercase/lowercase/digit; confirmation phải khớp. Không trim password.
- Required identity/contact fields và max lengths theo RegisterRequest; username 3–80 characters.
- Verify code có 6 digits. Reset/invitation dùng code đầy đủ từ email, không giới hạn thành OTP 6 digits; không thay đổi hoa/thường của code.
- Backend không có public security-policy endpoint. `AUTH_POLICY` là baseline checked-in, không phải config runtime được fetch. Nếu deployment override NationalId/password/resend policy, phải đồng bộ baseline frontend; backend vẫn authoritative.

Resend verification và request reset code có UI cooldown 60 giây theo `Security:ResendSeconds`, áp dụng sau request đã gửi (kể cả lỗi) để tránh gửi liên tục. Chỉ timestamp được lưu trong sessionStorage để giữ cooldown khi reload; không chứa email/password/code/token. Đây là UI throttle, không khẳng định email được gửi hoặc thay thế rate limiting phía server. Backend trả generic message cả khi không eligible hoặc đang cooldown.

Email được truyền qua React Router navigation state, luôn sửa được; không đặt email/code vào URL. Direct navigation hoặc thiếu state hiển thị form trống an toàn. Password/code chỉ ở component memory, không đưa vào localStorage/sessionStorage hoặc log. Thành công verification/reset/invitation chuyển về Login với thông báo cố định, không auto-login. Backend hiện gửi code trong nội dung email, không có contract link chứa query token; người dùng nhập code thủ công.

Tests gồm 18 ca Phase 1 giữ nguyên và 21 ca Phase 2 (mock Axios, validation/policy, generic response, true/false business result và không lưu secrets). Phase 1.5 vẫn **environment-blocked**, không phải live integration passed. Cần kiểm lại email delivery, account state, policy overrides và toàn luồng với backend/database thật khi môi trường sẵn sàng; không chạy seed, migrations hoặc service administration để kiểm frontend.

## Phase 3 — authenticated shell and route authorization

`src/constants/roles.js` is the single source for the seven exact backend names:
`HorseOwner`, `ClubManager`, `HeadTrainer`, `Trainer`, `WorkRider`, `Veterinarian`, `Groom`.
These match `HorseClub.DAL/Domain/Entities.cs`. `UserResponse` in
`HorseClub.BLL/Contracts/Responses.cs` contains `Role`; `AuthWorkflow.GetMe` returns that
profile, and `Horse_BackEnd/Program.cs` serializes enums as strings. Readable labels
are presentation only and never grant access.

The Bootstrap `AppLayout` provides the current name/username, readable role,
existing logout button, role-filtered navigation and an `Outlet`. All seven known
roles see Dashboard; Phase 4 adds Horse registrations for HorseOwner only. There
are no links to unimplemented modules.

| Route | Behavior |
| --- | --- |
| `/` | Redirect to `/dashboard`, then apply the authentication guard. |
| `/login` | Public; wait for restoration, then redirect an authenticated user to a safe intended destination or `/dashboard`. |
| `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/accept-invitation` | Public lifecycle forms remain accessible with or without an existing session. |
| `/dashboard` | Authenticated shell and current-user summary, no business data. |
| `/permission-denied` | Authenticated shell, permission explanation and link back to Dashboard. |
| `/registrations`, `/registrations/new`, `/registrations/:id` | HorseOwner only; Phase 4 registration list, create draft and detail/edit. |
| Other paths | Generic not-found page with a login or dashboard link, according to session state. |

`ProtectedRoute` waits for session restoration and preserves pathname/query/hash
when redirecting an anonymous user to Login. `RoleRoute` composes that guard with
an optional `allowedRoles` value: one `ROLES` constant, an array, or omitted for
authenticated-only routes. It supports nested `Outlet` routes or child content.
Wrong-role access redirects to `/permission-denied` without clearing the session.
The existing API client's 403 handling still does not refresh or log out.

Unknown roles receive no role navigation and fail closed on every explicitly
restricted route. They retain the authenticated dashboard/logout with a readable
warning so the user is not trapped in a redirect loop. Empty/invalid allowlists
deny access. Login destinations are limited to internal paths and reject login
loops; lifecycle routes are not blanket-redirected merely because a session exists.

Future feature routes can declare their `allowedRoles` using the same constants
and add navigation entries only when implemented. These frontend checks do not
replace backend ownership, assignment or record-state checks. In particular,
`HorseClub.BLL/Infrastructure/ApiSupport.cs` enforces registration access scope,
and `HorseClub.BLL/Services/HorseService.cs` enforces staff-assignment rules.
Phase 3 added no F01 routes; the Owner-only module added in Phase 4 is described below.

`tests/routing.test.js` adds 19 tests: exact roles/navigation, authentication and
role guards, intended destinations, restoration loading, unknown roles, shell
rendering/logout, public lifecycle access and 403/404 behavior. The original
39 tests are unchanged (58 tests through Phase 3). Routing tests render real components through
the installed Vite/React tools, record navigation decisions and invoke the real
logout handler with mocked Axios. They do not verify browser effects or a live
backend. Phase 1.5 remains environment-blocked; live `/me` role profiles,
reload/redirect behavior, backend 403 enforcement and token invalidation still
need integration checks when the existing environment is available.

## Phase 4 — HorseOwner registration intake

Only HorseOwner has the Horse registrations navigation entry and access to
`/registrations`, `/registrations/new`, `/registrations/:id`. The entry stays active
on new/detail pages. There is no Manager review or assignment UI, and no Horse
Profile link to an unimplemented route.

Backend source contracts used:

| Source under `BE/HRCMS` | Verified contract |
| --- | --- |
| `Horse_BackEnd/Endpoints/HorseEndpoints.cs`, `HorseClub.BLL/Workflows/HorseWorkflow.cs` | POST/GET registrations, GET/PUT detail; submit/cancel return 204; list accepts status/page/pageSize. |
| `HorseClub.BLL/Contracts/Requests.cs` | `RegistrationDraftRequest`: 17 nullable editable properties; Owner PUT replaces missing fields with null. |
| `HorseClub.DAL/Domain/Entities.cs` | Registration response includes intake fields, id, ownerId, status, reviewReason, createdAt and version. Exact statuses are Draft, PendingReview, RevisionRequired, Approved, Cancelled. |
| `HorseClub.BLL/Services/HorseService.cs` | Partial drafts; only Draft/RevisionRequired allow Owner edits/submission; submit validates required fields and attachments, transitions to PendingReview, clears reviewReason. |
| `HorseClub.BLL/Infrastructure/ApiSupport.cs` | Backend ownership enforcement; 1-based pagination; PageResponse contains items/page/pageSize/total. |
| `HorseClub.BLL/Workflows/AuthWorkflow.cs`, `Contracts/Responses.cs` | Authenticated role-filtered, paginated active-staff directory; directory items contain id/firstName/lastName/role. |
| `Horse_BackEnd/Endpoints/AttachmentEndpoints.cs`, `HorseClub.BLL/Workflows/AttachmentWorkflow.cs` | Plain-array metadata list, multipart POST, authenticated GET download; no delete/replace endpoint. |
| `HorseClub.DAL/Domain/BusinessEnums.cs`, `HorseClub.BLL/Workflows/MetadataWorkflow.cs` | Gender Male/Female/Gelding; intake types HorsePhoto/Certificate/MedicalDocument. Metadata endpoint is authenticated and returns enum-name arrays; this phase uses centralized source-verified values without an extra metadata request. |

The list supports all five exact status filters, loading/empty/error states and
pagination (20 per page). Draft creation may be entirely partial. After POST,
the returned persistent id opens the detail page. The form has horse information,
pedigree, physical information, health declaration, boarding and staff preferences.
Attachments become available after draft creation.

Every Owner PUT sends **all 17 editable fields** from the complete loaded form.
Blank strings become null; numeric inputs become numbers; dates remain yyyy-MM-dd
and optional ids remain strings or null. Neither ownerId nor preferredTrainerId is
sent. Server-returned values replace the saved form after success. Preferences
request HeadTrainer/Groom/Veterinarian separately and follow directory pages;
Trainer and WorkRider are never choices. Unavailable saved preferences are retained
until explicitly cleared/changed. Preferences are not official assignments.

| Status | Edit/save | Upload | Submit | Cancel |
| --- | --- | --- | --- | --- |
| Draft | Yes | Yes | When saved data and required attachments are complete | With confirmation |
| RevisionRequired | Yes | Yes | Resubmit with the same checks/endpoint | With confirmation |
| PendingReview | No | No | No | No |
| Approved | No | No | No | No |
| Cancelled | No | No | No | No |
| Unknown | No | No | No | No |

All states retain authorized attachment downloads. Revision reason is shown only
when returned. Submit requires name/sire/dam/dateOfBirth/gender/breed/heightCm/
weightKg/measurementDate/declaredHealth/boardingStart plus HorsePhoto and Certificate.
Unsaved edits must first be saved. Submit/resubmit and cancel re-fetch the record
after 204 rather than inventing local statuses. Cancellation requires an explicit
confirmation and does not delete the record.

Uploads send FormData fields file/type and optional certificateNumber/issueDate/
expiryDate for Certificate. Photos accept PNG/JPEG; Certificate and MedicalDocument
accept PNG/JPEG/PDF. The server checks byte signatures and matching extensions;
the browser checks extensions, size and metadata dates. No multipart boundary is
set manually. Downloads use the authenticated shared Axios client with responseType
blob and a temporary object URL that is revoked after download starts. Files are
not stored in browser storage. Uploaded items cannot be removed/replaced here.

Checked-in limits are 10 MiB per file, 20 attachments, height 1–300 cm, weight
1–2000 kg, and Asia/Ho_Chi_Minh date validation (`ClubOptions.cs` and
`Horse_BackEnd/appsettings.json`). No runtime policy endpoint exposes these limits;
deployment overrides must be aligned with this client baseline. Backend validation
remains authoritative. Certificate metadata is optional, including its dates.

Errors reuse the existing normalized API errors. 401 uses existing session/refresh
handling; 403 never logs out; 404 and 409 are shown without exposing restricted
record details. Server diagnostics are suppressed. Conflicts, access loss or
uncertain mutation results require a reload before another mutation; reload warns
that unsaved edits will be discarded. There is no automatic business POST retry
beyond the shared client's existing single authentication retry. A network failure
during initial creation can leave an uncertain result: check the list before
creating another draft. The backend provides no create/upload idempotency key.

40 new mocked/rendered tests cover Owner-only routes, list/partial create, complete
PUT/clearing, state restrictions, directory pagination, attachments, multipart,
protected downloads, completeness, submit/resubmit, cancel, conflicts and duplicate
submit prevention. Total: **98 tests**. Existing 58 remain passing; the sole Phase 3
assertion updated is the exact Owner navigation expectation to include the newly
implemented link. Phase 1/2 tests remain unchanged. No new dependencies were added.

Live integration remains environment-blocked. Real backend ownership enforcement,
persisted drafts, storage/downloads, multipart bytes, revision/cancellation races,
runtime policy overrides and actual browser interaction still require verification.
No SQL administration, migrations, backend changes or Manager workflows were performed.

## Đưa mã frontend lên repo

Clone repo này vào thư mục riêng với backend. Tạo nhánh feat/frontend-import, chép mã frontend hiện có vào thư mục đã clone, giữ thư mục .git của repo này. Không chép .git từ dự án khác, node_modules, dist hoặc file môi trường chứa secrets. Commit/push nhánh và tạo pull request vào main.

Dùng git pull để đồng bộ trước khi bắt đầu task; mỗi người làm nhánh riêng. Không force-push main để nhập mã.

## Kết nối với backend

Frontend → HTTP API → Backend → SQL Server.

1. Chạy backend theo README của repo HRCMS; SQL Server và connection string được cấu hình phía backend.
2. API local mặc định: http://localhost:5299; các endpoint nghiệp vụ dưới /api.
3. Kiểm backend tại http://localhost:5299/health. Import contract từ http://localhost:5299/openapi/v1.json khi backend chạy Development.
4. Đặt API base URL bằng cấu hình môi trường của frontend; dùng một API client chung. Nếu mã hiện có dùng Vite, có thể dùng VITE_API_BASE_URL. Quy ước base URL gồm hay không gồm /api phải thống nhất trong client.
5. Backend cấu hình Cors:Origins bằng origin frontend thực tế; mặc định Development có http://localhost:5173.
6. Đăng nhập lấy bearer token; gửi Authorization: Bearer <accessToken> cho API có quyền. Xử lý refresh/logout và lỗi 401/403 theo contract.

Frontend không lưu SQL connection string, password database hoặc SMTP secrets. Các biến môi trường được đưa vào bundle frontend đều có thể được người dùng xem. Chỉ commit .env.example chứa cấu hình mẫu không nhạy cảm.

## Quy tắc tích hợp

- Role/status/type theo enum của backend; metadata tại /api/metadata/enums yêu cầu đăng nhập.
- Dùng API client, enum và bộ message dùng chung; không hardcode dữ liệu nghiệp vụ trong component.
- List API có pagination items/page/pageSize/total; timestamp ISO 8601, date yyyy-MM-dd, đơn vị theo BACKEND_GUIDE.
- Có loading, empty, validation, permission và lỗi nghiệp vụ. Medical block trả HTTP 409 cần hiển thị thông báo đúng phạm vi; không bỏ qua guard phía backend.
- Upload dùng multipart theo contract. Không gửi trực tiếp đường dẫn file trên máy.
- Nếu màn hình Figma thiếu endpoint/field, tạo issue và phối hợp chủ module backend trước khi đổi contract.

## Bàn giao pull request

Ghi màn hình/module, endpoint tích hợp, cấu hình môi trường cần thêm, cách chạy/test và ảnh UI. Không đưa mật khẩu, OTP, thông tin cá nhân thật hoặc secrets vào commit.
