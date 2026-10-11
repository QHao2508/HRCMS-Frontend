# Kiểm thử Azure SQL và Việt hóa — 11/10/2026

Đã chạy backend main d5c71bf với Azure SQL `hrcms.database.windows.net/HRCMS` và Azure Blob theo cấu hình hiện có. Backend ở `http://localhost:5300`, frontend ở `http://127.0.0.1:5174`, proxy tới cổng 5300. Health trả 200 và việc ghi/đọc hồ sơ mẫu xác nhận kết nối database thực tế.

Theo lựa chọn của người dùng, chỉ tạo dữ liệu mẫu trong HRCMS hiện tại, có dấu `[AZURE TEST 20261011]`. Các lần chạy kiểm tra để lại hồ sơ mẫu để đối chiếu. Không thay đổi hồ sơ nghiệp vụ có sẵn. Bảy tài khoản thử có hậu tố `@azure20261011.hrcms.example.test` đã được vô hiệu hóa sau kiểm thử; đăng nhập bằng tài khoản thật để tiếp tục dùng giao diện. Tác vụ nền được tắt trong tiến trình kiểm thử.

## Kết quả

| Phạm vi | Kết quả |
| --- | --- |
| Frontend regression | 200 test đạt, 0 lỗi |
| Lint, production build, diff check | Đạt; còn cảnh báo bundle khoảng 715 kB |
| Đăng nhập 7 vai trò, metadata, dashboard, danh sách ngựa, refresh/logout | Đạt trên Azure |
| Đăng ký, sửa/hủy nháp, tải ảnh/chứng nhận, submit/approve, phân công | Đạt; upload/download qua Azure Blob |
| Giáo án, kế hoạch, buổi tập, bắt đầu, kết quả, đánh giá, lịch sử | Đạt |
| Khám, điều chỉnh, chấn thương, hạn chế, điều trị, tái khám từng phần | Đạt; thời điểm khám gốc được giữ chính xác |
| Chăm sóc phòng ngừa, giao/hoàn thành cho ăn, báo/giải quyết sự cố | Đạt |
| Tạo chuồng/ô, xếp ngựa, vệ sinh, trả ô | Đạt |
| Vật tư, nhập/xuất, yêu cầu bổ sung/từ chối, lưu trữ sau khi hết tồn | Đạt |
| Báo cáo, nhật ký, thông báo, website công khai, logo | Đạt |
| Chủ ngựa bị từ chối ghi vật tư và bệnh án | Đạt, trả 403 với thông báo tiếng Việt |
| Trình duyệt | Điều chỉnh bệnh án trên Azure thành công, thông báo tiếng Việt; nhãn và giá trị enum giữ đúng hợp đồng API |

Hai bộ live test đạt: bộ đăng ký–huấn luyện và bộ mở rộng (42 request thành công, cộng kiểm tra phân quyền). File `tests/live/azure-workflows.test.mjs` chỉ chạy khi có biến `HRCMS_AZURE_FIXTURE_FILE`, kiểm tra dấu dữ liệu mẫu trước khi ghi. Cần chuẩn bị lại tài khoản thử để chạy lại vì chúng đã bị vô hiệu hóa.

## Việt hóa

Đã dịch nhãn, hướng dẫn, trạng thái tải/lưu, lỗi nhập liệu và thông báo thành công trong các trang thú y. Loại chấn thương, mức độ và trạng thái hiển thị tiếng Việt, giữ nguyên mã enum gửi API. Bổ sung 35 bản dịch lỗi nghiệp vụ của chăm sóc, sự cố, vật tư và thú y. Thông báo lưu trong database vẫn được dịch qua bộ ánh xạ hiện có khi hiển thị.

## Giới hạn kiểm chứng

Không chạy nguyên bộ 146 backend test trên HRCMS hiện tại: fixture của bộ đó cần tạo/xóa database riêng cho từng ca, khác lựa chọn kiểm thử trên dữ liệu mẫu của người dùng. Kết quả backend 145 đạt/1 bỏ qua ở lần trước là trên SQL Express, không được tính thành kết quả Azure. SMTP/gửi email thật, background workers, kiểm thử tải và toàn bộ tổ hợp nghiệp vụ không nằm trong lần chạy này. Nội dung website toàn cục chỉ được đọc để giữ nguyên nội dung hiện tại.
