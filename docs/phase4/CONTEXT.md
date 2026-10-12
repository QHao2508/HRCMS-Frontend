# HRCMS Phase 4.1 — audit context

- Ngày audit: 12/10/2026 (Asia/Saigon).
- Frontend: [QHao2508/HRCMS-Frontend](https://github.com/QHao2508/HRCMS-Frontend), workspace `D:\School\SWP\Code\FE\HRCMS-Frontend-Phase2`, branch `feat/hrcms-auth-f01-f02-bao`, HEAD và baseline `0daf8b962791781aaba2595d3efa9431b4da47da`. Working tree sạch trước audit.
- Backend chỉ đọc: [QHao2508/HRCMS](https://github.com/QHao2508/HRCMS), checkout sẵn `D:\School\SWP\Code\BE\HRCMS`, branch `khoa/BE02`, commit `27618360c7cf6167fa328c22e2708d3e6fc4d677` (06/10/2026). Remote-tracking `origin/main` trong checkout là `82f9600aff357d4b7fb7159dc142fa2845392df2` (07/10/2026). Đây là **snapshot cũ**, không chứng minh contract của bản Backend đang triển khai. GitHub README chỉ xác nhận kiến trúc và phạm vi ở mức tổng quát.
- Phase 4.2: đã đọc Backend remote `main` qua GitHub connector tại commit [`8f6cbb7aced00e6eaae0d4a3edf3d133c877291b`](https://github.com/QHao2508/HRCMS/commit/8f6cbb7aced00e6eaae0d4a3edf3d133c877291b) (11/10/2026), **không fetch/checkout/sửa Backend**. Các kết luận Phase 4.1 dựa trên snapshot 06/10 phải được đối chiếu lại với commit này theo từng task.
- Nguồn task: `C:\Users\84941\Downloads\HRCMS_Project_Tracking (1).xlsx`, sheet `Total Project Tracking`, hàng 18–21, 30–31, 34. Cột E là mô tả; cột I là update/details. Workbook **không có cột acceptance criteria riêng**; các điều kiện nghiệm thu dưới đây chỉ là phần được viết rõ trong E/I, không tự thêm yêu cầu.
- Figma tham chiếu: [file HRCMS](https://www.figma.com/design/9YyXkWnlyH7JP1Cw5BymHX/Figma-basics?node-id=1669-162202). Đã kiểm metadata: AUTH-01–05, ADMIN-01–02, F01-01–05 và F03.01–05. Không thấy section/page F04 care trong metadata được đọc. Figma là bằng chứng bố cục, không thay thế acceptance criteria trong Excel hay kiểm tra hành vi.

## Quy tắc và giới hạn

- Chỉ audit 7 task của Bảo: #13, #14, #15, #16, #25, #26, #29. Giữ nguyên code Phase 2/3; không sửa Backend, source Frontend, Excel; không commit, push, PR hay merge.
- Chỉ tạo `docs/phase4/CONTEXT.md`, `TASK_MATRIX.md`, `PROGRESS.md`; dừng sau audit để người dùng phê duyệt bước triển khai.
- `DONE`: có bằng chứng đáp ứng toàn bộ điều kiện và kiểm chứng; `PARTIAL`: có UI nhưng còn thiếu/gap; `NOT_STARTED`: chưa có triển khai; `BLOCKED`: phụ thuộc contract/quyền chưa tương thích; `NEEDS_VERIFICATION`: có triển khai và chưa thấy gap quyết định, nhưng thiếu UAT hoặc bằng chứng bản Backend hiện hành.
- Phase 4.2 thêm `UAT_PENDING`: code/source và targeted tests đạt nhưng chưa có kiểm thử thực tế. Không đánh dấu `DONE` từ build/unit tests.
- Cột H của Tracking là trạng thái tại lúc cập nhật workbook, **không phải** kết luận audit này. Không có UAT browser/staging hoặc chạy API ghi trong lần audit.
