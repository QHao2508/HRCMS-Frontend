# Flow 3 — giao diện làm việc của bác sĩ thú y

Ngày thực hiện: 11/10/2026. Base FE `70edb1e`, BE đối chiếu `8f6cbb7`. Nhánh bàn giao FE `khoa/fix-flow3`.

Tham khảo thị giác: PDF Existing của Khoa — nền kem, thẻ trắng, nâu HRCMS, tiêu đề serif, trạng thái có màu và thao tác theo hồ sơ. Các câu mô tả nghiệp vụ/placeholder trong PDF không thay thế contract đang chạy.

## Đã chỉnh

- Header phân hệ, badge quyền chuyên môn và tab có icon; dùng chung header/sidebar của hệ thống.
- Tổng quan có ba thẻ từ response scope thật: tổng theo bộ lọc, Monitoring trên trang, Injured/Isolated trên trang. Không suy đoán số Training Lock hoặc ngày khám chưa được API list trả.
- Tìm kiếm tên/số đăng ký và healthStatus gửi API trước paging; mỗi trang 20 ngựa. Lối tắt mở bệnh án/tái khám mang horseId đã URL-encode.
- Giữ ngựa đang chọn qua các tab y tế bằng URL; chọn ngựa khác cập nhật context. Load danh sách lựa chọn/hồ sơ qua toàn bộ trang API được cấp quyền, không cắt ở 100 dòng đầu.
- Thẻ bệnh án phân cấp rõ reason, diagnosis, findings, symptoms, notes; cỡ chữ đọc 15–16px, title 27–32px, input 48px.
- Popup khám/chấn thương/phác đồ/hạn chế hiện tên và số đăng ký ngựa. Nút đóng có tên truy cập; vùng lưu cố định trong popup để không mất thao tác khi cuộn.
- Ô tìm kiếm bỏ viền lồng, form nhiều dòng có khoảng cách, trạng thái và phần hạn chế phân biệt bằng nền/viền.
- Mobile: bảng tổng quan thành từng hồ sơ; tab và menu hệ thống cuộn ngang trong màn y tế; form một cột, không tràn document ở 390px.
- Khi rời trang khám, response danh sách về muộn không điều hướng lại sang hồ sơ cũ.
- Giữ payload clinical/correction/clearance và role guards hiện hành. Không sửa backend, schema, dữ liệu Azure hoặc cấu hình môi trường của app chính.

## Kiểm chứng

- FE lint, build và 214 tests đạt (thêm ca navigation giữ patient/encode ID).
- Browser kiểm tổng quan, mở đúng hồ sơ từ row, chọn patient bằng URL, tab điều trị/hạn chế/tái khám, form khám/chấn thương; popup khám và form tái khám ở 390x844.
- Tổng quan mobile: document 375px trong viewport 390px, input 16px, card rows 305px; phần bảng dài ở các module khác cuộn trong wrapper.
- Browser dùng API fixture trong bộ nhớ tại 127.0.0.1:5341 và Vite riêng 5174. Clinical data là minh họa; không gọi API ghi của backend Azure. Logo dùng public branding endpoint hiện có.
- Ảnh kiểm tra nằm trong backend `TestResults/flow3-design/`, không đưa vào Git. Bằng chứng UI này không thay cho clinical UAT với server thật.

## Bàn giao

Chạy frontend bình thường hoặc tải lại dev server hiện tại; vào Thú y với tài khoản Veterinarian đã được phân công ngựa. URL của app chính và settings được giữ nguyên. Số liệu thống kê ghi rõ scope/page; không coi count của trang là count toàn hệ thống. Kiểm thử đọc/ghi với tài khoản thật thực hiện theo checklist Flow 3 hiện hành.

## Bổ sung bàn giao ngày 12/10/2026

- Chấn thương: bỏ UUID dự phòng trong nhãn ngựa; thiếu số đăng ký được hiển thị rõ.
- Chăm sóc: chỉ chọn phác đồ chưa hoàn tất; thêm thông báo khi không có phác đồ hoạt động, liên kết tạo/xem phác đồ của đúng ngựa và nút tải lại. Nút lưu bị khóa khi việc điều trị chưa có lựa chọn hợp lệ.
- Sự cố: lưu báo cáo thành công tự mở chi tiết để người báo tải ảnh. Hiển thị lý do khi sự cố đã xử lý hoặc người đang xem không phải người báo.
- Header/menu hệ thống giữ vị trí khi cuộn; chiều cao header được đo để phù hợp desktop và mobile. Menu mobile cuộn ngang.
- Browser fixture kiểm chứng phác đồ đang hoạt động, tất cả đã hoàn tất, sự cố mới tự mở ảnh, sự cố đã xử lý và selector thiếu số đăng ký. Khi cuộn desktop, header ở 0px/menu ở 91px; mobile header ở 0px/menu ở 135px, không tràn ngang document.
- Truy vấn chỉ đọc Azure xác nhận ngựa người dùng đang chọn chưa có phác đồ. Không tạo phác đồ hoặc sửa bệnh án thật để làm đầy dropdown.
- Bản build còn cảnh báo bundle trên 500 kB của Vite; không cản trở build thành công.
