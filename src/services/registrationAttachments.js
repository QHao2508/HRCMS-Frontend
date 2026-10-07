import { ATTACHMENT_TYPE } from "../constants/registration.js";
import { MSG, msg } from "../messages/index.js";
import api from "./api.js";
import { ATTACHMENT_TYPES, INTAKE_LIMITS } from "../constants/registration.js";
import { validDate } from "./registrationValidation.js";

/**
 * Tạo đường dẫn API với ID được encodeURIComponent để dữ liệu không chèn vào URL.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
const path = (id) => `/api/registrations/${encodeURIComponent(id)}/attachments`;
/**
 * Đọc danh sách có lọc/phân trang tệp đính kèm qua API client; giữ giá trị enum/payload theo hợp đồng backend.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 */
export async function listAttachments(id) { return (await api.get(path(id))).data; }
/**
 * Kiểm loại tệp, đuôi, dung lượng, số tệp và ngày chứng nhận; backend kiểm thêm chữ ký nội dung.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { file, type, certificateNumber = "", issueDate = "", expiryDate = "" }. Các props/callback lấy từ caller.
 * @param count Giá trị count truyền vào validateAttachment; tham chiếu phần thân để xem cách dùng.
 */
export function validateAttachment({ file, type, certificateNumber = "", issueDate = "", expiryDate = "" }, count = 0) {
    if (!ATTACHMENT_TYPES.includes(type)) return msg(MSG.CHOOSE_A_SUPPORTED_INTAKE_ATTACHMENT_TYPE);
    if (!file || file.size === 0) return msg(MSG.CHOOSE_A_NON_EMPTY_FILE);
    if (file.size > INTAKE_LIMITS.maxFileBytes) return msg(MSG.FILE_SIZE_LIMIT, { size: INTAKE_LIMITS.maxFileBytes / 1048576 });
    if (count >= INTAKE_LIMITS.maxAttachments) return msg(MSG.FILE_COUNT_LIMIT, { count: INTAKE_LIMITS.maxAttachments });
    if (file.name.length > 200) return msg(MSG.THE_FILENAME_MUST_BE_AT_MOST_200_CHARACTERS);
    if (!(type === ATTACHMENT_TYPE.HorsePhoto ? /\.(png|jpe?g)$/i : /\.(png|jpe?g|pdf)$/i).test(file.name)) return type === ATTACHMENT_TYPE.HorsePhoto ? msg(MSG.HORSE_PHOTOS_MUST_BE_PNG_OR_JPEG) : msg(MSG.CHOOSE_A_PNG_JPEG_OR_PDF_FILE);
    if (type === ATTACHMENT_TYPE.Certificate) {
        if (certificateNumber.length > 100) return msg(MSG.CERTIFICATE_NUMBER_MUST_BE_AT_MOST_100_CHARACTERS);
        if ((issueDate && !validDate(issueDate)) || (expiryDate && !validDate(expiryDate))) return msg(MSG.ENTER_VALID_CERTIFICATE_DATES);
        if (issueDate && expiryDate && expiryDate < issueDate) return msg(MSG.EXPIRY_DATE_CANNOT_PRECEDE_ISSUE_DATE);
    }
    return "";
}
/**
 * Tạo multipart chỉ chứa file/type và metadata chứng nhận khi đúng loại; không tự đặt boundary.
 * @param values Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API.
 */
export function attachmentFormData(values) {
    const form = new FormData();
    form.append("file", values.file);
    form.append("type", values.type);
    if (values.type === ATTACHMENT_TYPE.Certificate) {
        for (const name of ["certificateNumber", "issueDate", "expiryDate"]) {
            if (values[name]?.trim()) form.append(name, values[name].trim());
        }
    }
    return form;
}
/**
 * POST FormData qua API có authentication; browser tạo Content-Type/boundary của multipart.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param values Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API.
 */
export async function uploadAttachment(id, values) {
    return (await api.post(path(id), attachmentFormData(values))).data;
}
/**
 * Tải blob qua API kiểm quyền thay vì dùng URL Azure private/SAS trong UI.
 * @param id ID đối tượng được thao tác; quyền/phạm vi được kiểm trước khi đọc hoặc ghi.
 * @param attachmentId Giá trị attachmentId truyền vào fetchAttachment; tham chiếu phần thân để xem cách dùng.
 */
export async function fetchAttachment(id, attachmentId) {
    return (await api.get(`${path(id)}/${encodeURIComponent(attachmentId)}`, { responseType: "blob" })).data;
}
