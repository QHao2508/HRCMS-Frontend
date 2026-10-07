# Thông điệp và enum frontend

- `src/messages/vi.js`: nội dung hiển thị tiếng Việt.
- `src/messages/messageKeys.js`: enum khóa thông điệp, đóng băng bằng Object.freeze.
- `src/messages/index.js`: hàm msg và định dạng tham số; React tự escape khi hiển thị.
- `src/messages/backendErrors.js`: ánh xạ lỗi nghiệp vụ API sang thông điệp tiếng Việt; lỗi chưa biết dùng thông điệp theo HTTP status.
- `src/constants/roles.js`, `registration.js`, `training.js`: enum theo hợp đồng backend.
- `src/constants/enumLabels.js`: nhãn hiển thị của enum. Giá trị gửi API giữ nguyên.

Ví dụ: `msg(MSG.SESSION_TITLE, { horse: horse.name, type: getEnumLabel(session.trainingType) })`.

Khi thêm nội dung mới, thêm khóa vào MSG và câu tiếng Việt vào VI; không đặt câu hiển thị trực tiếp trong JSX. Khi thêm enum, bổ sung nhãn trong ENUM_MESSAGE_KEYS. Tên người dùng, tên ngựa, ghi chú, mục tiêu và các nội dung người dùng nhập giữ nguyên. Đường dẫn, tên trường JSON, CSS và định dạng ngày gửi API là giá trị kỹ thuật.

Chạy `npm run lint`, `npm test`, `npm run build`. Lint chặn nhãn/JSX hiển thị hardcoded; kiểm thử kiểm tra thiếu khóa, tham số, nhãn enum và lỗi API.
