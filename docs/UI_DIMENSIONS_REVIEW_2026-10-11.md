# Chuẩn hóa kích thước FE — 11/10/2026

- Dùng chung khung app-content, tiêu đề 32px (28px mobile), nội dung 14–16px, input 48px và nút tối thiểu 44px.
- Y tế: bỏ cỡ chữ 6–11px, dùng Manrope; bỏ sidebar lồng làm hẹp màn; menu phụ dạng tab; chuẩn hóa card, bảng, modal, phân trang.
- Responsive: sidebar chính chuyển thành hàng cuộn ở <=768px; KPI y tế 4/2/1 cột; toolbar và selector không ép chiều rộng mobile.
- Các trang quản lý hỗ trợ tiếp tục dùng WorkflowUI/SupportUI và CSS chung. Trang chủ/auth giữ bố cục theo mục đích riêng.

Kiểm tra: build và lint đạt; 208 test FE đạt. Login đo ở 390x844 và 1440x900 không tràn ngang, input 48px/16px. CSS đã đồng bộ sang thư mục frontend người dùng chạy tại localhost:5173.

Cần kiểm tra tiếp khi Azure hoạt động: hình ảnh thực tế từng màn y tế, bảng dài, popup thăm khám/chấn thương/điều trị và màn sau đăng nhập ở desktop/mobile. Azure gặp timeout post-login; chưa mở được tài khoản mẫu trong lượt này, chưa ghi dữ liệu mẫu mới. Không đánh dấu các ca kiểm tra này đã đạt.
