# HRCMS-Frontend

Repository frontend riêng cho hệ thống quản lý câu lạc bộ và huấn luyện ngựa đua HorseClub. Thiết kế đã hoàn thành trên Figma theo thông tin nhóm; mã frontend sẽ được push sau.

- Backend: [QHao2508/HRCMS](https://github.com/QHao2508/HRCMS), nhánh main.
- Thiết kế: [Figma HorseClub](https://www.figma.com/design/AKLYJd26mWHeG1W8V0ach5/Figma-basics--Copy-?node-id=1669-162202).
- Hướng dẫn API/database: [BACKEND_GUIDE.md](https://github.com/QHao2508/HRCMS/blob/main/docs/BACKEND_GUIDE.md).
- Phân công backend: [BACKEND_TASK_ASSIGNMENT.md](https://github.com/QHao2508/HRCMS/blob/main/docs/BACKEND_TASK_ASSIGNMENT.md).

## Phạm vi giao diện

Giao diện cho 7 vai trò: Horse Owner, Club Manager, Head Trainer, Trainer, Work Rider, Veterinarian và Groom. Các module gồm tài khoản, hồ sơ/phân công ngựa, huấn luyện, thú y, chăm sóc/chuồng, kho, thông báo và báo cáo.

Repo hiện có README và .gitignore Node; chưa chứa ứng dụng frontend hoặc package.json. Giữ stack và cấu trúc của mã frontend đang làm khi đưa lên; bổ sung lệnh cài/chạy từ package.json thực tế sau khi import.

## Đưa mã frontend lên repo

Clone repo này vào thư mục riêng với backend. Tạo nhánh feat/frontend-import, chép mã frontend hiện có vào thư mục đã clone, giữ thư mục .git của repo này. Không chép .git từ dự án khác, node_modules, dist hoặc file môi trường chứa secrets. Commit/push nhánh và tạo pull request vào main.

Dùng git pull để đồng bộ trước khi bắt đầu task; mỗi người làm nhánh riêng. Không force-push main để nhập mã.

## Kết nối với backend

Frontend → HTTP API → Backend → SQL Server.

1. Chạy backend theo README của repo HRCMS; SQL Server và connection string được cấu hình phía backend.
2. API local mặc định: http://localhost:5299; các endpoint nghiệp vụ dưới /api.
3. Kiểm backend tại http://localhost:5299/health. Import contract từ http://localhost:5299/openapi/v1.json khi backend chạy Development.
4. Đặt API base URL bằng cấu hình môi trường của frontend; dùng một API client chung. Nếu mã hiện có dùng Vite, có thể dùng VITE_API_BASE_URL. Quy ước base URL gồm hay không gồm /api phải thống nhất trong client.
5. Backend cấu hình Cors:Origins bằng origin frontend thực tế; mặc định Development có http://localhost:5173.
6. Đăng nhập lấy bearer token; gửi Authorization: Bearer <accessToken> cho API có quyền. Xử lý refresh/logout và lỗi 401/403 theo contract.

Frontend không lưu SQL connection string, password database hoặc SMTP secrets. Các biến môi trường được đưa vào bundle frontend đều có thể được người dùng xem. Chỉ commit .env.example chứa cấu hình mẫu không nhạy cảm.

## Quy tắc tích hợp

- Role/status/type theo enum của backend; metadata tại /api/metadata/enums yêu cầu đăng nhập.
- Dùng API client, enum và bộ message dùng chung; không hardcode dữ liệu nghiệp vụ trong component.
- List API có pagination items/page/pageSize/total; timestamp ISO 8601, date yyyy-MM-dd, đơn vị theo BACKEND_GUIDE.
- Có loading, empty, validation, permission và lỗi nghiệp vụ. Medical block trả HTTP 409 cần hiển thị thông báo đúng phạm vi; không bỏ qua guard phía backend.
- Upload dùng multipart theo contract. Không gửi trực tiếp đường dẫn file trên máy.
- Nếu màn hình Figma thiếu endpoint/field, tạo issue và phối hợp chủ module backend trước khi đổi contract.

## Bàn giao pull request

Ghi màn hình/module, endpoint tích hợp, cấu hình môi trường cần thêm, cách chạy/test và ảnh UI. Không đưa mật khẩu, OTP, thông tin cá nhân thật hoặc secrets vào commit.
