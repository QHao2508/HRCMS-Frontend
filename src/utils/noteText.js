import { MSG, msg } from '../messages/index.js';

// Backend ghi lý do bỏ qua vào cuối ghi chú bằng mẫu tiếng Anh cố định ("\nSkipped: {lý do}");
// khi ngựa ngừng hoạt động, lý do là mã "HorseArchived". Đổi sang tiếng Việt lúc hiển thị (áp dụng cả dữ liệu cũ).
const SKIPPED_LINE = /(^|\n)Skipped: ?(.*)/g;
const REASON_CODES = { HorseArchived: MSG.NOTE_HORSE_ARCHIVED };

/** Ghi chú buổi tập/công việc chăm sóc để hiển thị: dịch dòng "Skipped: …" do hệ thống thêm, giữ nguyên chữ người dùng nhập. */
export function noteText(notes) {
    if (!notes) return notes;
    return notes.replace(SKIPPED_LINE, (_, start, reason) => `${start}${msg(MSG.NOTE_SKIPPED_REASON)}${': '}${REASON_CODES[reason.trim()] ? msg(REASON_CODES[reason.trim()]) : reason}`).trim();
}
