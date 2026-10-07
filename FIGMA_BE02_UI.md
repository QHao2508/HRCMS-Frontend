# Giao diện Figma và tích hợp BE02

Ngày kiểm chứng: 07/10/2026. Nguồn thiết kế: https://www.figma.com/design/9YyXkWnlyH7JP1Cw5BymHX/Figma-basics?node-id=1669-162202.

## Phần đã triển khai

- Style chung theo bố cục đã đọc từ Figma: nền kem, card trắng, nút nâu/xanh lá, header HRCMS, footer ở trang đăng nhập; responsive sidebar/form/table.
- Login tiếng Việt, thông báo tài khoản nhân viên, giữ login/me/refresh/logout cũ.
- Owner đăng ký theo 5 bước: Nhận diện; Giấy tờ & thể chất; Sức khỏe; Nhân sự & thời gian; Kiểm tra & gửi. Draft vẫn cho thiếu dữ liệu. Lưu lần đầu để có ID trước upload. Date inputs nhận input/change để ngày nhập qua bàn phím/paste không bị mất khi lưu.
- Owner đọc hồ sơ và file theo quyền, gửi/resubmit/cancel, hiển thị lý do revision và màn hình chờ duyệt.
- Manager danh sách/chi tiết hồ sơ, xem và tải attachments, sửa 4 trường quản lý, yêu cầu revision có lý do hoặc approve; dùng horseId trong response để mở hồ sơ ngựa.
- Horse list/profile, ảnh được bảo vệ bằng token, measurement ban đầu, lịch sử phân công. Manager phân HeadTrainer/Groom/Vet; HeadTrainer đang assigned mới chọn Trainer.
- HeadTrainer tạo/sửa/archive Template; Trainer tạo/sửa/status Plan và tạo/sửa session, chọn Rider tùy chọn. Session không Rider là Planned.
- Rider chỉ thấy dữ liệu được backend cấp, start và nhập Result. Tốc độ lấy từ Result backend, không tự tính/lưu ở client. Trainer evaluate một lần; adjustFutureSessions là boolean và chỉ ghi nhận đề nghị, không tự sửa lịch.
- Plan session pagination, history pagination; history đọc cả snapshot cũ và outcome mới, trình bày dữ liệu nghiệp vụ thay JSON/ID kỹ thuật.
- Dashboard đọc /api/dashboard với số liệu trong phạm vi, không tạo KPI giả.

API service ở src/services, trạng thái/role giữ enum backend, route guard ở src/routes; không sửa backend hoặc bỏ kiểm quyền để phục vụ UI. GET dùng resource có cleanup để tránh response cũ ghi đè. Mutation không tự retry POST; lỗi không rõ kết quả/403/404/409/5xx yêu cầu reload trước thao tác tiếp theo.

## Chạy và kiểm tra

Backend từ D:\SWP391\HRCMS\HRCMS: dotnet run --project Horse_BackEnd --launch-profile http.
Frontend: .env.local có VITE_API_BASE_URL=http://localhost:5299; npm run dev -- --port 5173 --strictPort.
Kiểm tra cuối: npm run lint đạt (0 lỗi), npm test **150/150 pass**, npm run build thành công. Không đổi dependency hoặc API backend.

Tài khoản demo: be02.owner@example.test, be02.manager@example.test, be02.headtrainer@example.test, be02.trainer@example.test, be02.rider@example.test; mật khẩu local theo thiết lập demo của Khoa.

## Kiểm chứng live trên HRCMS

Đã thực hiện bằng UI với 5 tài khoản demo: Owner tạo/lưu Draft; chuyển bước giữ thông tin; upload HorsePhoto và Certificate; Submit; Manager request revision; Owner sửa/resubmit; Manager approve; Manager phân HeadTrainer; HeadTrainer phân Trainer/tạo Template; Trainer tạo Plan 07–14/10, session Planned, giao Rider; Rider Start/Result; Trainer Evaluation với đề nghị điều chỉnh; đọc history có đủ các mốc và Outcome. Ngày đã được xác nhận giữ đúng sau lưu và tải lại. Result 1000m/90s trả 11.111m/s. Kiểm tra layout Training ở 375px không tràn ngang toàn trang.

Dữ liệu mới được giữ để Khoa xem lại: registration 9f15309f-d8ae-423f-9d64-bfdb8c56c11c; horse 650f47cf-9ba1-4e58-90f1-9c74832be156; plan 967045d8-b403-4e26-8e86-01d52323ce00; session 9c15704b-ec22-4956-81f1-781bfb2b7ba6. Tên ngựa: Kiểm thử UI Figma 07-10. File kiểm thử là bản sao ảnh demo có sẵn, Certificate dùng PNG hợp lệ theo contract.

## Giới hạn cần review

Màu/font/khoảng cách hiện được dựng theo quan sát canvas; chưa lấy được design token/font gốc qua Dev Mode, chưa nghiệm thu pixel chính xác. Các màn hình account lifecycle ngoài Login vẫn giữ nội dung chức năng cũ với style dùng chung. Chưa triển khai module medical/care/inventory/reports chi tiết. Không làm chức năng xóa/thay attachment khi backend chưa có API. Chưa kiểm live toàn bộ ca lỗi/concurrency/medical-lock hoặc phân trang hàng trăm record trên UI; unit tests kiểm contract, pagination và role guards, backend có suite riêng. Lệnh download được gọi và không có lỗi UI; browser automation không thu được event download, nên cần kiểm file tải về bằng trình duyệt người dùng. Chưa commit/push frontend.
