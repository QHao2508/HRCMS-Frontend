# HRCMS Phase 4 — progress và handoff

**Trạng thái:** Phase 4.3 final regression/code review đã hoàn tất; cả bảy task code complete nhưng còn UAT thực tế, chưa task nào được xác nhận DONE. Báo cáo cuối tại [FINAL_REPORT.md](FINAL_REPORT.md). Chưa commit/push/merge/PR.

| Phân loại | Task |
|---|---|
| DONE | Không có task được xác nhận đầy đủ |
| UAT_PENDING | #13, #14, #15, #16, #25, #26, #29 |
| NEEDS_VERIFICATION | Không có |
| PARTIAL | Không có gap Frontend bắt buộc còn mở theo yêu cầu Excel hiện tại |
| BLOCKED | Không có task được xác nhận bị chặn bởi contract remote hiện tại |
| NOT_STARTED | Không có ở Frontend baseline |

## Checkpoint 1: #13 và #14

### Checkpoint #13 — hoàn tất trong lượt Phase 4.2 này

- Backend remote `main` được đọc qua GitHub connector, commit `8f6cbb7aced00e6eaae0d4a3edf3d133c877291b` (11/10/2026); checkout Backend cục bộ vẫn giữ nguyên. Auth endpoint/contract được xác nhận.
- Source FE đủ login, recovery và session lifecycle. Targeted tests `auth`, `pendingAccount`, `accountLifecycle`, `routing`: 62/62 pass. Không sửa code; không tạo diff chỉ để đánh dấu hoàn thành.
- Trạng thái `UAT_PENDING`: cần #32 browser/API với lifecycle/network thật. Tiêu chí “regression lifecycle/network” từ Tracking ô I; các ca session chi tiết suy ra từ mô tả/source, không phải acceptance criteria riêng.

### Checkpoint #14 — hoàn tất trong lượt Phase 4.2 này

- Backend remote `main` `8f6cbb7` hỗ trợ đúng invitation hai bước, DTO `VerifyRequest`/`InvitationPasswordRequest`, OTP theo purpose và setup token có hạn/dùng một lần. Kết luận mismatch Phase 4.1 chỉ đúng với snapshot 06/10.
- Sửa `src/services/managerService.js`: sau `/api/auth/invitation/password` trả `changed=true`, xóa session generation cũ trước khi UI chuyển `/login`; lỗi/`changed=false` giữ session. Thêm ba test ở `tests/accountLifecycle.test.js` cho payload, endpoint public, thành công, thất bại/mạng và response muộn.
- Targeted tests `accountLifecycle`, `pendingAccount`, `routing`: 47/47 pass. `npm run lint` pass; `npm run build` pass (warning chunk >500 kB). `git diff --check` pass. Trạng thái `UAT_PENDING`: còn thử OTP sai/hết hạn/dùng lại, tài khoản hết hạn và flow staff trên browser/API thật (#32). Những ca OTP/hết hạn được ghi rõ trong Tracking ô I; yêu cầu dọn session là suy từ flow nhận lời mời và chuyển login.

### Handoff từ checkpoint 1

- #25/#26 khi đó chưa được thực hiện; checkpoint 2 bên dưới đã xác minh contract remote và sửa gap FE có bằng chứng.
- #15, #16 cần source/targeted tests và UAT; #29 cần xác nhận contract staff mới và chốt ý nghĩa “lọc nhân sự”. Không làm lại #13/#14 trừ khi UAT hoặc contract mới phát hiện lỗi.

## Checkpoint 2: #25 và #26

### Task #25 — code complete, UAT_PENDING

- Đọc lại `Total Project Tracking!E30/I30`: “Summary, khám/restriction/treatment, follow-up/clearance và preventive theo contract”; ô I ghi ưu tiên khám → restriction → follow-up, clearance sau BE sửa, demo Vet đủ vòng đời, role khác summary. Không có cột AC riêng.
- Backend remote `main` SHA `8f6cbb7aced00e6eaae0d4a3edf3d133c877291b`: `FollowUpRequest` có ba mảng ID; `MedicalService.RecordFollowUp` chỉ đóng vấn đề được chọn, kiểm cùng horse/trạng thái/ngày; `MedicalPolicyTests` xác nhận A cleared còn B/future và treatment khác không đổi, `Monitoring` được phép. `GetSummary` trả health status + effective restrictions cho horse scope; clinical records/follow-up chỉ Vet đúng scope. Chi tiết và link pinned ở [TASK_MATRIX.md](TASK_MATRIX.md).
- FE follow-up và validation đã gửi ID rõ và load mọi trang. Gap là hồ sơ ngựa cho role ngoài training chỉ có health status, không hiện restriction summary. Đã tái dùng `TrainingMedicalContext` trong `HorseDetail` để hiện operational restrictions mà không mở clinical records. File sửa #25: `src/pages/horses/HorsePages.jsx`, `src/components/training/TrainingMedicalContext.jsx`, `tests/medical.test.js`.
- Targeted tests `medical-validation`, `medical`, `routing`: 54/54 pass sau thay đổi (cùng `care-visibility`: 56/56). Cần UAT Vet end-to-end, summary theo role và dữ liệu >100 ở các màn medical cũ. Tiêu chí chọn từng vấn đề và chỉ xem restriction summary được suy từ mô tả + DTO/contract; nếu “summary” cần thêm trường, cần người dùng xác nhận.

### Task #26 — code complete, UAT_PENDING

- Đọc lại `Total Project Tracking!E31/I31`: giao/nhận, complete/skip/issue, approved/actual portion, summary; Groom chỉ task mình, instructions tối thiểu, Owner summary. Không có cột AC riêng.
- Backend remote cùng SHA: `CareTaskSummaryResponse` có instructions/notes; `CareService.ListTasks` lọc Groom ID, trả `null` cho cả Treatment/IceBath text với Manager/Owner và text cho Groom/Vet; `CareRepository` lọc horse scope. Manager tạo daily care, Vet tạo Treatment/IceBath, Groom chỉ record task mình. Gap UI là table trước đây render mọi text response; đã thêm guard theo role/type để không hiện clinical text ngoài quyền kể cả khi response bất thường. File sửa #26: `src/services/careVisibility.js`, `src/pages/support/CarePage.jsx`, `tests/care-visibility.test.js`.
- Targeted tests `care-visibility`, `business-rules`: 4/4 pass; combined suite 56/56. Cần UAT bốn role, đặc biệt task assignment/complete/skip/issue và portions. “Instructions tối thiểu” chưa được Excel định nghĩa thành field-level redaction; cần xác nhận nếu muốn giới hạn thêm text Groom ngoài DTO đang có.

### Validation và lượt tiếp theo

- `npm run lint`: pass. `npm run build`: pass sau khi chạy ngoài sandbox vì sandbox chặn Vite child process (`spawn EPERM`); warning chunk >500 kB hiện hữu. `git diff --check`: pass. Backend/Excel không đổi; không chạy request ghi Backend thật.
- Giữ nguyên thay đổi chưa commit checkpoint 1 ở `src/services/managerService.js`, `tests/accountLifecycle.test.js`. Không reset/clean/stash/commit/push/merge/PR.
- Task tiếp theo **chỉ ở lượt mới**: #15, #16, #29. #15/#16 ưu tiên source/targeted tests/UAT; #29 cần xác nhận contract staff remote và scope “lọc nhân sự”. Không tự tiếp tục trong checkpoint này.

## Checkpoint 3: #15 và #16

### Task #15 — code complete, UAT_PENDING

- Đã đọc lại `Total Project Tracking!E20/I20` trực tiếp. Backend remote `main` vẫn ở SHA `8f6cbb7aced00e6eaae0d4a3edf3d133c877291b`; nullable 17-field draft, Owner-only create/edit/submit, submit cần HorsePhoto + Certificate. Endpoint attachment xác nhận list/upload/download; chi tiết ở [TASK_MATRIX.md](TASK_MATRIX.md).
- FE đáp ứng save/edit draft, validation trường đã nhập, upload, resubmit, status và mutation lock. Sửa một gap: chọn ảnh thay thế sai định dạng trước đây để lại ảnh cũ trong state và có thể upload nhầm. `HorsePhotoInput` giờ xóa selection cũ khi validation lỗi. File sửa #15: `src/components/registrations/HorsePhotoInput.jsx`, `tests/registrations.test.js`.
- Targeted tests chạy từng file: `registrations` 41/41, `registrationPhoto` 3/3, `routing` 20/20 pass. Chạy ba file chung với `--test-isolation=none` làm ba ca upload cũ va chạm global storage; đây là tương tác test harness, không phải lỗi assertion khi chạy từng file. Còn UAT #32 cho form persistence, ảnh/chứng nhận thật, submit/resubmit và double-click/network delay. Không gửi mutation tới Backend thật.
- Không chạy mutation trên Backend thật; chỉ dùng adapter test. Backend và Excel giữ nguyên.

### Task #16 — code complete, UAT_PENDING

- Đã đọc lại `Total Project Tracking!E21/I21` trực tiếp. Backend remote cùng SHA: Manager chỉ sửa `Name`, `RegistrationNumber`, `BoardingStart`, `BoardingEnd` ở `PendingReview`; FE không gửi các trường clinical/pedigree. `ReviewRequest` là `Approve` + `Reason` (revision cần reason). Backend chịu trách nhiệm ghi audit edit Before/After, revision và approval; `IntakeTests` có bằng chứng allowlist/403/audit. Chi tiết và link pinned ở [TASK_MATRIX.md](TASK_MATRIX.md).
- Sửa gap: Manager trước đây có thể quyết định approve/revision khi form hành chính còn thay đổi chưa lưu, làm quyết định áp dụng dữ liệu cũ. Hai nút và handler giờ chặn khi dirty; hiển thị yêu cầu lưu trước. Sau PUT thành công form đồng bộ theo response thật. Payload lấy đúng bốn field. File sửa #16: `src/pages/reviews/ReviewPages.jsx`, `src/services/reviewValidation.js`, `src/messages/messageKeys.js`, `src/messages/vi.js`, `tests/be02.test.js`.
- Targeted `be02`: 53/53 pass, gồm guard route theo role và payload. Contract Manager dùng null/omitted để giữ giá trị cũ, vì vậy không xóa được optional registration number/boarding end qua API hiện tại; Tracking không nêu thao tác xóa. Nếu nghiệp vụ cần xóa, phải xác nhận Backend contract mới. Còn UAT #32 cho approve/revision, allowlist 403, audit thật và lỗi/network.

### Validation cuối và lượt tiếp theo

- Targeted test files chạy riêng: `registrations` 41/41, `registrationPhoto` 3/3, `be02` 53/53, `routing` 20/20. Regression: `accountLifecycle` 24/24, `medical` 30/30, `care-visibility` 2/2. `npm run lint`, `npm run build`, `git diff --check` pass; build có warning chunk >500 kB hiện hữu. Build chạy ngoài sandbox vì Vite child process từng bị `spawn EPERM`. Bảo toàn mọi thay đổi #14/#25/#26 và docs/phase4.
- Task còn lại **#29**, chỉ xử lý khi có lượt mới và người dùng cho phép. Dừng sau #15/#16 như yêu cầu.

## Checkpoint 4: #29

### Task #29 — code complete, UAT_PENDING

- Đã đọc lại `Total Project Tracking!A34:I34` và [TASK_MATRIX.md](TASK_MATRIX.md). Mô tả gốc: “Danh sách/lọc nhân sự, mời, active/inactive và trạng thái kích hoạt.” Workbook không có cột acceptance criteria riêng; ô I chỉ ghi thời hạn, thứ tự sau #25/#26 và hỗ trợ từ Hào.
- Backend remote `main` vẫn ở SHA `8f6cbb7aced00e6eaae0d4a3edf3d133c877291b`. Manager-only `GET /api/staff` có `page,pageSize,role`, trả `StaffResponse` gồm liên hệ và trạng thái. `GET /api/staff/directory` dành cho các role đăng nhập, chỉ trả nhân sự active với tên/role. Backend đã có resend/workload/active và kiểm RBAC, workload, audit. Snapshot 06/10 không còn đại diện contract hiện tại; link pinned và chi tiết ở [TASK_MATRIX.md](TASK_MATRIX.md).
- FE đã có list phân trang trên server, lọc role, invite, resend, xem workload, bật/tắt, xác nhận, trạng thái kích hoạt, loading/error/retry/empty và route Manager. Gap có bằng chứng: nút resend hiện cho tài khoản inactive chưa xác thực, nhưng Backend từ chối. Đã ẩn nút khi `active=false` hoặc `emailVerified=true`. File sửa checkpoint 4: `src/pages/manager/StaffPage.jsx`, `src/services/staffDirectory.js`, `tests/staff-directory.test.js`. Không sửa `managerService.js`; bảo toàn thay đổi #14 trong đó và mọi thay đổi #25/#26/#15/#16.
- Backend không hỗ trợ search tên/email hoặc filter active trên toàn tập. Excel chỉ nói “lọc” và FE đã lọc role; không tự thêm lọc giả trên trang hiện tại. Nếu yêu cầu thêm search hoặc lọc trạng thái, cần người dùng chốt scope và Backend bổ sung contract. Đây là dependency cho yêu cầu mở rộng, không phải lý do đánh dấu BLOCKED cho mô tả hiện có.
- Test `staff-directory` 2/2, `routing` 20/20, `accountLifecycle` 24/24 pass. `npm run lint`, `npm run build`, `git diff --check` pass; build còn warning chunk >500 kB. Build phải chạy ngoài sandbox vì Vite `spawn EPERM` trong sandbox. Không gửi request ghi tới Backend thật.
- Còn UAT #32: thử invite/resend, email activation, khóa thường/khẩn cấp khi có workload, kích hoạt lại, phân trang nhiều trang và quyền 403 trên browser/API thật. Không đánh dấu DONE chỉ dựa vào code/test.

## Handoff từ Phase 4.2 trước Phase 4.3

| Task | Trạng thái sau Phase 4.2 | Việc còn lại |
|---|---|---|
| #13 | UAT_PENDING | Login/recovery/session và network lifecycle thực |
| #14 | UAT_PENDING | OTP sai/hết hạn/dùng lại, invitation và session thực |
| #15 | UAT_PENDING | Draft/upload/submit/resubmit, double-submit thực |
| #16 | UAT_PENDING | Review, allowlist 403 và audit Backend thực |
| #25 | UAT_PENDING | Vòng đời Vet, clearance từng vấn đề, summary theo role |
| #26 | UAT_PENDING | Care bốn role, Treatment/IceBath privacy và portions |
| #29 | UAT_PENDING | Staff invite/resend/active, workload, pagination và RBAC thực |

Tại cuối Phase 4.2, bước tiếp theo được dự kiến là final regression và kế hoạch UAT riêng với môi trường/actor phù hợp. Phase 4.3 final regression đã được thực hiện ở phần dưới; browser/API UAT vẫn chưa chạy.

## Phase 4.3 — final regression và code review

- Branch/HEAD xác nhận: `feat/hrcms-auth-f01-f02-bao` / `0daf8b962791781aaba2595d3efa9431b4da47da`. Mọi thay đổi Phase 4 vẫn unstaged hoặc untracked; không reset, stash, clean, merge, rebase, commit, push hay PR.
- Đã review toàn bộ diff tracked từ baseline và mọi file mới Phase 4. Không tìm thấy regression/accidental data exposure có bằng chứng. Guard session generation, administrative allowlist, care text, restriction summary và resend đều đúng với contract đã ghi trong [TASK_MATRIX.md](TASK_MATRIX.md). Phase 2 Auth/Flow 1 và Phase 3 Training Flow 2 được bao phủ bởi full suite; không suy ra UAT pass từ đó.
- Chạy đúng `npm run lint`: pass. `npm run build`: sandbox báo `spawn EPERM`, chạy lại đúng lệnh ngoài sandbox pass; bundle JS 782.58 kB, warning chunk >500 kB, không refactor kiến trúc. `npm test` mặc định: sandbox báo `spawn EPERM` trước mọi assertion, chạy lại đúng lệnh ngoài sandbox **221 pass / 0 fail / 0 skip** (baseline 211/211). Test isolation mặc định không tái hiện collision của `--test-isolation=none` ở checkpoint 3.
- `git diff --check`: exit 0; chỉ có thông báo Git sẽ đổi LF thành CRLF khi chạm `TrainingMedicalContext.jsx`. `git status` và `git diff --stat` đã chạy; stat tracked là 13 file, +120/-16, không bao gồm 9 file untracked sau khi tạo báo cáo. Danh sách đủ 22 file trong [FINAL_REPORT.md](FINAL_REPORT.md).
- Kết luận **READY WITH RISKS**: đủ điều kiện kỹ thuật để đưa lên nhánh tính năng riêng phục vụ review **sau khi được phê duyệt**, nhưng chưa đủ bằng chứng UAT để merge/release. UAT và các giới hạn contract được ghi theo 7 task trong [FINAL_REPORT.md](FINAL_REPORT.md). Dừng tại đây để chờ phê duyệt trước commit/push.

## Dấu vết

- Tracking: `Total Project Tracking!A18:I21`, `A30:I31`, `A34:I34`; text E/I nguyên văn và kết luận ở [TASK_MATRIX.md](TASK_MATRIX.md).
- Frontend branch/HEAD và Backend snapshot ở [CONTEXT.md](CONTEXT.md).
- Backend và Excel giữ nguyên; không commit/push/PR/merge. Frontend source hiện có thay đổi từ checkpoint 1–4 (#14/#25/#26/#15/#16/#29) như liệt kê ở trên; `docs/phase4/` là handoff chưa commit.
