# HRCMS Phase 4.3 — final regression và code review

Ngày kiểm tra: 12/10/2026 (Asia/Saigon). Frontend workspace `D:\School\SWP\Code\FE\HRCMS-Frontend-Phase2`, branch `feat/hrcms-auth-f01-f02-bao`, HEAD/baseline `0daf8b962791781aaba2595d3efa9431b4da47da`. Backend READ-ONLY tham chiếu commit `8f6cbb7aced00e6eaae0d4a3edf3d133c877291b`. Nguồn requirement là `HRCMS_Project_Tracking (1).xlsx`, sheet `Total Project Tracking`; [TASK_MATRIX.md](TASK_MATRIX.md) giữ nguyên văn các ô E/I. Workbook không có cột acceptance criteria riêng.

## Kết luận

**READY WITH RISKS.** Cả bảy task đã qua review source, Backend contract đã ghi trong handoff và full automated suite, nhưng vẫn **UAT_PENDING**. Không có bug/regression còn mở được chứng minh bởi diff hoặc tests. Có thể chuẩn bị commit/push trên nhánh tính năng riêng để code review sau khi người dùng phê duyệt; chưa có bằng chứng để merge hoặc release. Checkpoint này không tạo commit/push/PR, không sửa Backend và không gọi mutation trên Backend thật.

## Ma trận 7 task

| Task / requirement Tracking | Frontend và automated evidence | Backend dependency / giới hạn | Browser/API UAT còn thiếu | Trạng thái |
|---|---|---|---|---|
| #13 — E18/I18: login, recovery, session; lifecycle/network regression | Auth pages, `authService`, `api`, `sessionStore`. Full suite gồm auth/session/routing tests. Không có diff #13. | Auth, `/me`, refresh, recovery trên bản Backend triển khai; session/network thực. | Login/logout, refresh và reset khi token hết hạn, mạng lỗi, request đến muộn. | UAT_PENDING |
| #14 — E19/I19: Owner register, OTP, staff invitation; OTP sai/hết hạn/dùng lại | `finishInvitation` xóa session generation cũ chỉ khi `changed=true`; `accountLifecycle` test two-step payload, thất bại và response đến muộn. | Invitation two-step/OTP/setup token và email delivery Backend. | Owner/staff registration, OTP sai/hết hạn/dùng lại, account hết hạn, redirect sau activation. | UAT_PENDING |
| #15 — E20/I20: list, draft, upload, submit, status; không mất form/double-submit | Registration components/services; ảnh thay thế sai định dạng xóa selection cũ. Full suite gồm registration/attachment/lock tests. | Owner-only draft/submit, HorsePhoto/Certificate attachment và storage. | Giữ form qua navigation/reload, upload file thật, submit/resubmit, double-click và mạng chậm. | UAT_PENDING |
| #16 — E21/I21: review, sửa hành chính, revision/approval; allowlist/audit | `ReviewPages` yêu cầu lưu form trước quyết định; `reviewValidation` chỉ gửi bốn field; `be02` test payload và role guard. | Backend Manager RBAC, review và audit Before/After. Null/omitted không xóa optional administrative values. | Review quyết định thật, 403 khi field ngoài allowlist, audit, lỗi/network. | UAT_PENDING |
| #25 — E30/I30: summary, khám/restriction/treatment, follow-up/clearance, preventive; Vet và role khác | Follow-up gửi ID chọn lọc; `TrainingMedicalContext` hiển thị operational restrictions trên horse detail; medical/routing tests. | Backend #21 selective clearance, Vet clinical scope, horse summary; màn medical cũ cần kiểm dữ liệu >100. | Vet lifecycle, A cleared/B còn mở, summary theo role, phân trang dữ liệu lớn. | UAT_PENDING |
| #26 — E31/I31: giao/nhận/record care task, portions, Groom task mình và Owner summary | `careVisibility` che Treatment/IceBath instructions/notes cho Manager/Owner; care visibility/business rule tests. | Backend #24 lọc task và redact text. “Instructions tối thiểu” chưa được Tracking định nghĩa theo field. | Bốn role, Treatment/IceBath privacy, task record, portions, error states. | UAT_PENDING |
| #29 — E34/I34: list/filter, invite, active/inactive, activation status | `StaffPage` dùng role filter/phân trang server; `staffDirectory` chỉ hiện resend cho active chưa verified; staff/routing/lifecycle tests. | `/api/staff` chỉ có page/pageSize/role; search tên/email hoặc lọc active toàn tập cần contract mới nếu nghiệp vụ yêu cầu. | Invite/resend, activation, normal/emergency disable với workload, nhiều trang, 403 role khác. | UAT_PENDING |

## Validation thực tế

| Lệnh yêu cầu | Kết quả |
|---|---|
| `npm run lint` | PASS, exit 0 |
| `npm run build` | PASS ngoài sandbox, 2,104 modules transformed; JS 782.58 kB, warning chunk >500 kB |
| `npm test` mặc định | **221 PASS / 0 FAIL / 0 SKIP**, exit 0 ngoài sandbox; baseline trước Phase 4 là 211/211 |
| `git diff --check` | PASS, exit 0; chỉ có cảnh báo LF → CRLF ở `TrainingMedicalContext.jsx` |
| `git status` | Đúng branch, 13 modified tracked và 9 untracked sau khi tạo báo cáo; không staged |
| `git diff --stat` | 13 tracked files, +120/-16; lệnh này không tính 9 file untracked |

Trong sandbox, `npm run build` và `npm test` dừng ở `spawn EPERM` khi Vite/Node tạo child process. Chạy lại **đúng các lệnh mặc định** ngoài sandbox đều pass. Kết quả `npm test` xác nhận isolation mặc định không tái hiện ba lỗi test harness từng xảy ra khi ép `--test-isolation=none`. Warning chunk >500 kB được ghi riêng; không sửa kiến trúc để xử lý warning trong phạm vi này. Test dùng adapter/rendering, không phải UAT browser hoặc request ghi Backend thật.

## File thay đổi so với baseline

Tracked modified (13):

- `src/components/registrations/HorsePhotoInput.jsx`
- `src/components/training/TrainingMedicalContext.jsx`
- `src/messages/messageKeys.js`
- `src/messages/vi.js`
- `src/pages/horses/HorsePages.jsx`
- `src/pages/manager/StaffPage.jsx`
- `src/pages/reviews/ReviewPages.jsx`
- `src/pages/support/CarePage.jsx`
- `src/services/managerService.js`
- `tests/accountLifecycle.test.js`
- `tests/be02.test.js`
- `tests/medical.test.js`
- `tests/registrations.test.js`

Untracked (9, phải được đưa vào phạm vi review khi được phê duyệt):

- `docs/phase4/CONTEXT.md`
- `docs/phase4/TASK_MATRIX.md`
- `docs/phase4/PROGRESS.md`
- `docs/phase4/FINAL_REPORT.md`
- `src/services/careVisibility.js`
- `src/services/reviewValidation.js`
- `src/services/staffDirectory.js`
- `tests/care-visibility.test.js`
- `tests/staff-directory.test.js`

**Lưu ý inventory:** trạng thái cuối là **13 modified + 9 untracked = 22 file**. `git diff --stat` chỉ liệt kê 13 tracked modified; khi được phê duyệt cần đưa đủ file mới vào phạm vi review.

## Review regression, dữ liệu và giới hạn

- Phase 2 Auth/Flow 1 và Phase 3 Training Flow 2 vẫn qua full suite mặc định. Các thay đổi không mở rộng Auth/Session/RBAC hoặc API contract ngoài cơ chế invitation cleanup đã được kiểm race.
- Administrative edit chỉ tạo payload bốn field; FE không giả lập audit. Review bị chặn khi form chưa lưu. HorsePhoto selection cũ bị xóa khi chọn file thay thế không hợp lệ. Các hành vi này có automated tests, chưa được xác nhận trên browser.
- Medical summary chỉ render DTO summary và restrictions, không render clinical records. Treatment/IceBath text bị che ở UI cho Manager/Owner kể cả response bất thường; Backend vẫn là lớp phân quyền chính. Staff page chỉ Manager và nút resend tuân điều kiện Backend. Không thấy accidental data exposure trong diff, nhưng privacy theo role vẫn cần UAT/API thực.
- Không có regression hoặc bug Frontend còn mở có bằng chứng từ review/test. Giới hạn cần theo dõi: medical list cũ có giới hạn tải 100; search tên/email và filter active toàn tập của staff chưa có Backend API; thao tác xóa optional administrative values chưa có contract; “instructions tối thiểu” cho Groom chưa có tiêu chí field-level. Các mục này không được giả lập hoặc tự triển khai từ suy đoán.

## Quyết định về commit/push

**An toàn về mặt automated gates để commit/push lên nhánh tính năng riêng cho review sau khi được phê duyệt**, với điều kiện đưa đủ file untracked Phase 4 vào thay đổi được review và giữ nguyên cảnh báo UAT_PENDING. Chưa an toàn để tuyên bố DONE, merge hoặc release. Không có thao tác Git ghi lịch sử nào được thực hiện trong Phase 4.3.
