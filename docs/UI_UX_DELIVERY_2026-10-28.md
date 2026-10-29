# Bàn giao UI/UX HRCMS — 28/10/2026

## Phạm vi triển khai

Đã cập nhật không gian giao diện của 41 route hiện có, gồm trang chủ, 6 trang xác thực, dashboard, hồ sơ/duyệt/ngựa, huấn luyện, y tế, chăm sóc, kho, chuồng, báo cáo, quản trị và các trang lỗi. Các trang nhận thay đổi từ component/layout chung và các chỉnh sửa riêng theo luồng dưới đây. Giữ nguyên framework, URL route, enum và các API hiện hành.

Không thay đổi backend, database, cấu hình Azure hoặc dữ liệu vận hành. Chưa deploy ứng dụng. Bộ dữ liệu trong ảnh kiểm thử hoàn toàn là fixture; ảnh/logo và con số trong ảnh không đại diện dữ liệu câu lạc bộ thật.

## Những thay đổi đã làm

| Nhóm | Kết quả |
|---|---|
| Giao diện chung | Bảng màu nâu/kem/xanh thống nhất, typography workspace, khoảng cách/card/form/buttons, kích thước input mobile, focus rõ và reduced motion |
| Header/sidebar | Breadcrumb ngữ cảnh, tiêu đề document theo module, focus khi đổi route, menu mobile giữ vị trí, `/inventory` không active nhầm khi đang ở trang con |
| Loading/error/empty | Skeleton và spinner, vùng lỗi có retry, empty có hướng dẫn, không hiển thị “chưa có phác đồ/hạn chế” khi dữ liệu còn đang tải |
| Bảng/responsive | Header có `scope`, cột thao tác có tên truy cập, vùng cuộn có chứa các phần tử absolute; bảng hỗ trợ và kho/chuồng có thẻ dữ liệu trên mobile |
| Dashboard | Nội dung hướng dẫn và tác vụ ưu tiên cho 7 vai trò; Groom ưu tiên `careTasksToday`, số ngựa và thông báo từ API thật |
| Auth | Hiện/ẩn mật khẩu giữ giá trị và autofill; marker bắt buộc; đăng ký chia nhóm nhận diện/mật khẩu; lỗi validation focus về trường đầu tiên |
| Tìm kiếm/danh sách | Giữ filter/page trong URL cho ngựa, đăng ký, duyệt hồ sơ, nhân sự, audit, danh sách kế hoạch/buổi tập; search ngựa có submit/reset; search training khôi phục nội dung đã áp dụng |
| Hồ sơ đăng ký | Lỗi theo bước, chỉ rõ bước có lỗi, liên kết lỗi focus đúng field; giữ nháp thiếu thông tin; cảnh báo đóng tab khi có thay đổi chưa lưu |
| Duyệt hồ sơ | Phân biệt thay đổi hành chính chưa lưu; không cho quyết định duyệt/yêu cầu chỉnh sửa dựa trên dữ liệu chưa được lưu |
| Hồ sơ ngựa | Điều hướng tới nhận diện, sức khỏe, số đo, nhân sự, lịch sử; lưu trữ đặt riêng cuối trang và phải mở biểu mẫu |
| Huấn luyện | Tiến trình chuẩn bị/thực hiện/kết quả theo trạng thái thực; buổi bị bỏ qua không được vẽ như đã hoàn thành; phần bỏ qua thu gọn riêng |
| Y tế | Sửa filter phác đồ bằng enum `All/Active/Completed`; rút danh sách phác đồ từ 9 xuống 6 cột, chi tiết thuốc/hướng dẫn/tần suất có thể mở; sửa thời gian theo CLB |
| Modal y tế | Giữ focus/khóa cuộn nền, Escape/đóng xác nhận nếu đã chỉnh dữ liệu, trả focus về trigger; modal khám có lỗi tại chỗ; bổ sung semantics/focus cho modal xem chi tiết |
| Tiến độ điều trị | Lỗi tải công việc chăm sóc được hiển thị như thiếu dữ liệu, không giả thành tiến độ 0/0 |
| Chăm sóc | FE theo `CareService` hiện tại: Manager giao Feeding/Cleaning/Bathing/Grooming/WaterCheck; Vet giao Treatment/IceBath; Manager không tải lựa chọn phác đồ clinical |
| Support forms | Nút hành động có thể đặt tên đúng nghiệp vụ, thanh tác vụ, dirty state; mở/đóng có xác nhận; các form tạo kho/chuồng/sự cố/dự phòng thu gọn để ưu tiên danh sách |
| Kho | Phân biệt nhập/xuất và tồn dự kiến; preview không ghi stock; giữ contract receipt/approval và validation của server |
| Nhân sự | Form mời thu gọn, danh sách là điểm vào chính; giữ workload preview/confirmation và quyền sửa hồ sơ năng lực hiện hành |
| Website | Home/CMS dùng chung `WebsiteSections`, xem đúng hero/features với nội dung chưa lưu; ảnh hiện tại và ảnh mới; thông báo upload ghi ngay, không được hiểu nút hủy chữ là hoàn tác ảnh |
| Báo cáo | Phạm vi đã áp dụng, KPI có đơn vị và %, biểu đồ số buổi hoàn thành theo kỳ từ response hiện tại, bảng gốc vẫn có đủ dữ liệu |
| Trang lỗi | 403/404 có giao diện và đường quay về phù hợp phiên đăng nhập |

## Quyền và hợp đồng

- Quyền chăm sóc được đồng bộ với `HorseClub.BLL/Care/CareService.cs` và bản mô tả backend 23/10/2026. Các test FE07 cũ được cập nhật cùng ca kiểm payload Manager, không bỏ kiểm quyền Groom/Owner/HeadTrainer/Trainer.
- Không đổi clinical scope, không thêm quyền thực hiện buổi tập hoặc quyền sửa giáo án cho Manager. Backend vẫn xác nhận quyền, assignment, medical guard và trạng thái.
- Giữ partial draft, upload recovery, chống POST lặp/uncertain mutation, versioning và lịch sử.
- Tái khám/clearance giữ logic hiện tại của backend, bao gồm các mục liên quan được backend tự xử lý; đợt này không thiết kế lại policy clearance dựa vào tài liệu baseline cũ.
- Sửa datetime-local ở các form y tế theo UTC+7 kể cả khi máy người dùng ở múi giờ khác. Date-only không bị đổi ngày do chuyển qua timezone của máy.

## Kiểm chứng

Dependency được cài lại bằng `npm ci` theo `package-lock.json`; không cập nhật package.json hoặc lockfile. Đã đối soát phiên bản React 19.3.0, React DOM 19.3.0, Vite 8.3.2 và Axios 1.20.0 khớp lockfile.

- ESLint: đạt.
- Unit/SSR/contract tests: **368 đạt, 1 bỏ qua, 0 lỗi** (369 ca).
- Production build: đạt. Vite còn cảnh báo chunk JavaScript trên 500 kB; chưa thực hiện tách bundle trong đợt UI/UX này.
- Browser regression: **97 mục đạt, 0 lỗi** (82 lượt route/viewport và 15 kiểm tra tương tác/vai trò), chạy bản production preview trên loopback với API fixture, 41 route ở desktop 1440×900 và mobile 390×844, cộng các ca tương tác và 7 role dashboard. Kết quả chi tiết do script ghi ở `test-results/ui-ux/results.json`.
- `git diff --check`: đạt.

Browser suite kiểm lỗi JavaScript và tràn ngang toàn document, chụp ảnh từng route; các bảng dài được phép cuộn trong vùng riêng. Ca tương tác gồm filter phác đồ, payload giao việc thường ngày của Manager, nháp thiếu thông tin, lỗi wizard/focus, modal dirty/Escape/restore focus, preview CMS chưa lưu, quay lại danh sách giữ filter, 7 dashboard và hiện mật khẩu.

Timezone của browser test là America/Los_Angeles để kiểm tra cách giao diện hiển thị giờ CLB khi máy ở múi giờ khác. Các test đơn vị bổ sung kiểm ranh giới ngày UTC+7, date-only, parse datetime-local và mapping trường lỗi tới bước đăng ký.

## Chạy lại

```powershell
npm ci
npm run lint
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 5176 --strictPort
```

Ở terminal thứ hai, dùng Playwright đã cài và Chrome (hoặc `UI_UX_BROWSER=msedge`). Nếu Playwright không phải dependency local, biến `UI_UX_PLAYWRIGHT` trỏ tới `index.mjs` của package Playwright có sẵn. Không cần đưa đường dẫn riêng của máy vào source hoặc sửa lockfile.

```powershell
$env:UI_UX_BASE_URL = 'http://127.0.0.1:5176'
# Tùy môi trường: $env:UI_UX_PLAYWRIGHT = 'C:\...\playwright\index.mjs'
node tests/ui-ux.browser.mjs
```

`test-results/` và log không được commit. Script luôn chặn request ngoài origin loopback và trả API fixture trong bộ nhớ, kể cả các request ghi. Không dùng script này như bằng chứng kiểm backend thật.

## Giới hạn nghiệm thu

Chưa nghiệm thu với tài khoản thật của 7 vai trò, mạng/máy thật, dữ liệu lịch sử lớn hoặc integration backend đang deploy. Chưa khẳng định đạt đầy đủ accessibility audit hoặc mọi viewport/zoom chỉ từ kiểm tra 390/1440. Cần UAT trước khi phát hành production.

Các ý tưởng mở rộng được ghi là tùy chọn/API-dependent trong kế hoạch — như lịch calendar tổng hợp, endpoint hàng đợi riêng cho từng dashboard và chỉ số mới — chưa được thêm thành chức năng giả. Bản này hoàn thành việc cập nhật giao diện các route hiện có và các lỗi/luồng nêu ở bảng trên.


## Phụ lục: 41 route đã chạy trên production build

Kết quả chạy cuối: 97/97 đạt. Mỗi route dưới đây có ảnh desktop/mobile trong `test-results/ui-ux/` (đầu ra cục bộ, có thể tạo lại bằng browser suite). Các kiểm tra này không thay UAT/backend integration.

| Route kiểm tra | Vai trò fixture | 1440px | 390px |
|---|---|---|---|
| `/` | anonymous | Đạt | Đạt |
| `/login` | anonymous | Đạt | Đạt |
| `/register` | anonymous | Đạt | Đạt |
| `/forgot-password` | anonymous | Đạt | Đạt |
| `/verify-email` | anonymous | Đạt | Đạt |
| `/reset-password` | anonymous | Đạt | Đạt |
| `/accept-invitation` | anonymous | Đạt | Đạt |
| `/dashboard` | ClubManager | Đạt | Đạt |
| `/registrations` | HorseOwner | Đạt | Đạt |
| `/registrations/new` | HorseOwner | Đạt | Đạt |
| `/registrations/registration-1` | HorseOwner | Đạt | Đạt |
| `/reviews` | ClubManager | Đạt | Đạt |
| `/reviews/registration-1` | ClubManager | Đạt | Đạt |
| `/horses` | HorseOwner | Đạt | Đạt |
| `/horses/horse-1` | ClubManager | Đạt | Đạt |
| `/training/templates` | HeadTrainer | Đạt | Đạt |
| `/training/plans` | Trainer | Đạt | Đạt |
| `/training/plans/new` | Trainer | Đạt | Đạt |
| `/training/plans/plan-1` | Trainer | Đạt | Đạt |
| `/training/sessions` | WorkRider | Đạt | Đạt |
| `/training/plans/plan-1/sessions/new` | Trainer | Đạt | Đạt |
| `/training/sessions/session-1` | WorkRider | Đạt | Đạt |
| `/medical` | Veterinarian | Đạt | Đạt |
| `/medical/examination` | Veterinarian | Đạt | Đạt |
| `/medical/injury` | Veterinarian | Đạt | Đạt |
| `/medical/treatment` | Veterinarian | Đạt | Đạt |
| `/medical/restrictions` | Veterinarian | Đạt | Đạt |
| `/medical/follow-up` | Veterinarian | Đạt | Đạt |
| `/medical/preventive-care` | Veterinarian | Đạt | Đạt |
| `/care/tasks` | Groom | Đạt | Đạt |
| `/care/incidents` | Groom | Đạt | Đạt |
| `/care/stables` | ClubManager | Đạt | Đạt |
| `/inventory` | ClubManager | Đạt | Đạt |
| `/inventory/issue` | Groom | Đạt | Đạt |
| `/inventory/replenishments` | ClubManager | Đạt | Đạt |
| `/reports` | ClubManager | Đạt | Đạt |
| `/manager/staff` | ClubManager | Đạt | Đạt |
| `/manager/audit` | ClubManager | Đạt | Đạt |
| `/manager/website` | ClubManager | Đạt | Đạt |
| `/permission-denied` | HorseOwner | Đạt | Đạt |
| `/unknown-route` | anonymous | Đạt | Đạt |
