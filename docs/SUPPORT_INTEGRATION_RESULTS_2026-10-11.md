# Kiểm tra tích hợp các màn supporting — 11/10/2026

## Môi trường

Backend do người dùng start ở localhost:5299 (Debug); frontend chính localhost:5173 proxy tới 5299. Vite bind localhost nên 127.0.0.1:5173 không kết nối được; đây là địa chỉ bind, không phải lỗi API. Phiên FE cũ 5174 trỏ 5300 không dùng để nghiệm thu.

Database: Azure SQL HRCMS; upload sự cố qua Azure Blob. Dữ liệu ghi chỉ trên fixture có dấu [AZURE TEST 20261011] hoặc [AZURE TEST 20261011 UI]. Bật tạm đúng 7 tài khoản mẫu đã được tạo trước; tắt lại sau kiểm tra. Không thay đổi tài khoản/hồ sơ nghiệp vụ thật. BE/FE của người dùng được để nguyên hoạt động.

## Kết quả và bằng chứng

| Màn hình | Browser đã kiểm tra | API tự động |
|---|---|---|
| Care/feeding | Manager chọn ngựa và Groom được phân công, giao Cho ăn 1.25 kg; Groom hoàn thành, actual 1.25 kg hiển thị đúng | Create/record, own-task scope, IceBath text chỉ Vet/Groom, Owner/Manager nhận null |
| Kho | Tạo vật tư UI, nhập 3 kg, tồn và movement hiển thị đúng | Movement +2/-2, archive sau hết tồn, permission Owner 403 |
| Replenishment | Tạo request 2 kg và Manager approve; việc duyệt không tự nhập stock | Request/review, rejected và stock rule |
| Chuồng | Manager tạo stable/stall, xếp ngựa mẫu; Groom clean, row hiện Đã vệ sinh | Occupancy occupied/horseId, vacate trả false/null |
| Sự cố/ảnh | Groom report, reporter upload PNG; ảnh được fetch/hiển thị qua endpoint private; Vet resolve | Report/resolve đúng routed role và scope |
| Phòng ngừa | Vet schedule Deworming và complete; row có completedDate | Schedule/complete/summary/list |
| Nhân viên | Manager tắt/bật đúng WorkRider mẫu, xác nhận email; row inactive/active đúng | Security stamp hiện có được regression backend bao phủ; không claim browser test mọi token cũ |
| Reports | Manager và Vet tải báo cáo; chọn horse mẫu, groupBy Week; KPI và no-data table hiển thị, không lỗi console | API report/audit/notifications/website; role guards mới regression FE |

- Frontend regression: **208 passed, zero failed**. Tăng từ 200 với kiểm tra label ID tách biệt và role guards 7 route supporting.
- Live Azure workflow: **48 request thành công**, cộng các assertion state/privacy và hai kiểm tra Owner 403; zero failed. Log support-integration-api.txt (file scratch không đưa repo).
- Backend full regression: **145 passed, 1 skipped, zero failed, 146 total** trên database SQL Express riêng. Skip là fixture Azure upload riêng; upload sự cố đã kiểm thực tế qua browser nhưng không thay cho test skip đó.
- FE lint/build đạt; Vite vẫn cảnh báo bundle khoảng 749 kB. File TRX backend: TestResults/Integration20261011/support-integration.trx.
- Browser không có error console trong lượt kiểm tra cuối; DOM report không có duplicate ID.

## Lỗi đã sửa

1. Field dùng id cố định từ name gây trùng giữa filter và form kết quả/sibling form. Chuyển sang React useId, label htmlFor đúng input. Browser thao tác hai form cùng tên thành công; có regression mới.
2. Nhãn Lý do khám bị dùng nhầm cho movement kho. Đổi thành Lý do nhập / xuất.
3. Test menu cũ chưa cập nhật supporting routes. Cập nhật expected navigation theo allowlist, thêm test render cho từng role/route.
4. Đối chiếu OpenAPI runtime: occupied/horseId là field additive optional (occupied default false); chỉnh snapshot cho khớp DTO optional.

## Giới hạn còn cần UAT

Các happy path trên đạt, chưa đồng nghĩa toàn bộ task #24/#31–34 Done. Tiếp tục checklist PHASE_1_DEFERRED_TESTS_2026-10-11.md: nhiều trang >100, concurrent mutations, dữ liệu cross-scope đa owner, mất mạng/uncertain, keyboard/mobile đầy đủ, realtime hai phiên/reconnect, SMTP/reminder workers và staging/recovery. Không thử gửi email thật hoặc chạy destructive database suite trên Azure HRCMS.

Replenishment history của vật tư đã archive có thể hiển thị itemId do endpoint inventory không trả item archived; đây là hạn chế nhãn lịch sử, chưa làm sai tồn kho hay quyền. Cần bổ sung tên vật tư trong read projection ở đợt hoàn thiện UX nếu muốn giữ tên lịch sử.

Tài liệu SUPPORT_SCREENS_IMPLEMENTATION_2026-10-11.md ghi trạng thái trước UAT; báo cáo này bổ sung bằng chứng mới, không sửa trạng thái Google Sheets tự động.
