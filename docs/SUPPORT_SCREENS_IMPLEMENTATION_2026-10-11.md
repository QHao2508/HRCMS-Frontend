# Màn hình supporting — triển khai, chưa UAT

Theo yêu cầu người dùng, chưa chạy test nghiệp vụ hoặc ghi dữ liệu thử trong lần triển khai này. Chỉ kiểm lint/build và đọc/review source. Không kế thừa số 200 test cũ thành kết quả của code mới.

| Task | Route FE | Đã triển khai |
|---|---|---|
| #25 | /medical/preventive-care | Chọn ngựa trong scope, lịch phòng ngừa có phân trang; Vet schedule/complete, role khác readonly summary |
| #26 | /care/tasks | Filter ngựa/trạng thái/ngày, phân trang; Manager giao care thường, Vet Treatment/IceBath; Groom chỉ ghi task mình; approved/actual portion, instructions và notes |
| #27 | /inventory | Item/low-stock, thêm item, movement nhập/xuất, lịch sử phân trang, archive xác nhận bằng tên |
| #27 | /inventory/replenishments | Request cho Manager/Groom; review Pending chỉ Manager; thông báo review không tự tăng tồn |
| #28 | /care/incidents | Report theo ngựa, list/paging, routed role resolve; reporter upload PNG/JPEG, đọc ảnh qua endpoint xác thực và download |
| #28 | /care/stables | Stable/stall create, occupancy và ngựa đúng scope, occupy/vacate có xác nhận, cleaning đúng vai trò |
| #29 | /manager/staff | Bổ sung active/inactive cho staff; xác nhận bằng email; không đổi Manager/Owner |
| #30 | /reports | Bộ lọc ngựa/ngày/groupBy, KPI/series/training/care; bảng phân trang phía FE, clinical chỉ Vet; no-data/error/limit đúng API |

Tất cả route mới dùng AppLayout/SystemHeader và role guards hiện có, API/session client dùng chung, thông báo tiếng Việt. Services không tự replay write khi 401. Resource bỏ response cũ khi đổi scope/selection; mutation pending/uncertain dùng khóa hiện có.

Backend bổ sung StallSummaryResponse.occupied/horseId (horseId chỉ trong scope), không migration. Privacy care che instructions/notes Treatment/IceBath cho Owner/Manager; Groom chỉ task mình. Cần backend mới tương thích trước dùng stable page, không chạy với binary cũ. Các note xác nhận cleaning/resolve trong UI là xác nhận thao tác, không phải trường ghi mới vào database.

## Checklist cần người dùng chạy sau

- [ ] Chạy toàn bộ checklist backend docs/PHASE_1_DEFERRED_TESTS_2026-10-11.md trên commit cuối.
- [ ] Role/route guards các màn hình mới; request trực tiếp ngoài horse/task/photo scope bị từ chối.
- [ ] Preventive schedule/complete, future/duplicate, readonly non-Vet, >100 records và đổi ngựa khi request chậm.
- [ ] Care type theo role; Groom dropdown chỉ active assigned; Treatment dropdown chưa completed và cùng ngựa; feeding portion, transitions/final/double submit, ngày Việt Nam.
- [ ] Owner/Manager không nhận clinical instructions/notes của Treatment và IceBath qua response thật; Groom chỉ task mình.
- [ ] Kho movement âm/dương/0/concurrent, low-stock, archive còn stock; approve/reject Pending không cộng stock, repeated review 409.
- [ ] Incidents reporter/routed role/scope, ảnh MIME/cỡ/private, resolved không upload, blob URL được thu hồi khi rời chi tiết.
- [ ] Stalls occupied/horseId đúng current occupancy; Groom không biết horse ngoài scope; Manager vacant clean; occupy/vacate/conflict và reassignment/archive.
- [ ] Reports không mất dòng do paging, filters giữ timezone, 413/range errors, no-data; clinical chỉ Vet và raw response không lộ thông tin trái quyền.
- [ ] Staff inactive đổi SecurityStamp/thu hồi token, active lại, không thao tác Manager/Owner; confirmation email không khớp bị chặn.
- [ ] Network/401/403/404/409/500, uncertain mutation không retry mù; realtime cập nhật và mobile/keyboard/empty states.

Chưa đánh dấu Done trong bảng Google Sheets. #24 privacy audit/report/KPI và nghiệm thu #31–34 vẫn cần review/UAT riêng; thêm màn hình không thay cho kiểm chứng đầy đủ các hạng mục đó.

Azure SQL timeout khi khởi động backend mới trong lần này; các màn hình mới chưa được kiểm tra tích hợp trên Azure. Lint/build FE và build BE đạt; Vite còn cảnh báo bundle lớn khoảng 749 kB. Khi test phải chạy đúng backend mới để occupied/horseId tồn tại trong response.
