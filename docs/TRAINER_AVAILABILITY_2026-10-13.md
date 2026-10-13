# Lịch trống và chuyên môn — 13/10/2026

- Hồ sơ ngựa: xem khoảng trống của ngựa và trainer hiện tại theo loại bài tập/cường độ/quãng đường.
- Form tạo/sửa buổi tập: chọn ngày và thời lượng, xem ngựa/trainer/rider và khoảng trống chung, chọn giờ bắt đầu.
- Nhân sự (Manager): xác nhận chuyên môn, mức thành thạo, nhiều ca theo tuần và thời gian nghỉ. Ca kết thúc 00:00 là hết ngày; ca qua nửa đêm chia hai ngày.
- Phân công (HeadTrainer được giao ngựa): chọn loại chuyên môn; chỉ chọn được trainer phù hợp. Bảng hiển thị mức thành thạo và số ngựa đang phụ trách.
- Thư viện dữ liệu thật: 6 hồ sơ ngựa và 5 trainer HKJC, có URL nguồn, snapshot 13/10/2026 và trạng thái nghỉ đua. Các hồ sơ này là tham khảo quốc tế, không được tự coi là nhân sự/ngựa trong CLB.

BE mới cần migration 20261013044927_TrainerExpertiseAndAvailability trước khi dùng các màn mới. Hợp đồng gồm GET/PUT /api/staff/{id}/training-profile, GET /api/training/availability, GET /api/training/trainer-candidates, GET /api/training/reference-data và requiredTrainingType trong request phân công trainer.

Hồ sơ cũ thiếu ca/chuyên môn hoặc lịch thiếu thời lượng hiển thị chưa đủ dữ liệu; không tự giả định lịch rảnh. Lịch mới vẫn được kiểm lại ở BE khi lưu. Các công việc ngoài lịch huấn luyện và thời gian nghỉ chưa khai báo không được suy ra.

Kiểm thử: lint/build đạt, 224 FE tests pass. Browser dùng component thật với adapter trong bộ nhớ; xác nhận đổi thời lượng, chọn giờ, lưu profile, hiển thị nguồn và bố cục desktop/mobile. Chưa xác nhận UAT trên database vận hành; chưa áp schema Azure trong đợt này.

Tài liệu BE và SQL rollout: [HRCMS](https://github.com/QHao2508/HRCMS/tree/codex/trainer-availability/docs).
