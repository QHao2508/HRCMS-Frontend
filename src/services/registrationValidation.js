import { REGISTRATION_SECTION } from "../constants/registration.js";
import { ATTACHMENT_TYPE } from "../constants/registration.js";
import { MSG, msg } from "../messages/index.js";
import { HORSE_GENDERS, INTAKE_LIMITS, PREFERENCES } from "../constants/registration.js";

export const FORM_SECTIONS = [
    { title: REGISTRATION_SECTION.Identity, fields: [
        { name: "name", label: msg(MSG.TEN_NGUA), maxLength: 200 },
        { name: "dateOfBirth", label: msg(MSG.NGAY_SINH), type: "date" },
        { name: "gender", label: msg(MSG.GENDER), options: HORSE_GENDERS },
        { name: "breed", label: msg(MSG.BREED), maxLength: 100 },
        { name: "registrationNumber", label: msg(MSG.MA_DANG_KY), maxLength: 100 },
    ] },
    { title: REGISTRATION_SECTION.Pedigree, fields: [
        { name: "sire", label: msg(MSG.SIRE), maxLength: 200 }, { name: "dam", label: msg(MSG.DAM), maxLength: 200 },
    ] },
    { title: REGISTRATION_SECTION.Physical, fields: [
        { name: "heightCm", label: msg(MSG.HEIGHT), type: "number", min: INTAKE_LIMITS.minHeight, max: INTAKE_LIMITS.maxHeight },
        { name: "weightKg", label: msg(MSG.WEIGHT), type: "number", min: INTAKE_LIMITS.minWeight, max: INTAKE_LIMITS.maxWeight },
        { name: "measurementDate", label: msg(MSG.NGAY_DO), type: "date" },
    ] },
    { title: REGISTRATION_SECTION.Health, fields: [
        { name: "declaredHealth", label: msg(MSG.KHAI_BAO_SUC_KHOE), type: "textarea", maxLength: 1000 },
        { name: "healthNotes", label: msg(MSG.GHI_CHU_SUC_KHOE), type: "textarea", maxLength: 2000 },
    ] },
    { title: REGISTRATION_SECTION.Boarding, fields: [
        { name: "boardingStart", label: msg(MSG.NGAY_BAT_DAU_LUU_TRU), type: "date" },
        { name: "boardingEnd", label: msg(MSG.NGAY_KET_THUC_LUU_TRU), type: "date" },
    ] },
];
const fields = FORM_SECTIONS.flatMap((section) => section.fields);
export const EDITABLE_FIELDS = Object.freeze([...fields.map(({ name }) => name), ...PREFERENCES.map(({ field }) => field)]);

/**
 * Chuyển các trường intake được phép sửa thành chuỗi controlled, thay null bằng chuỗi rỗng.
 * @param record Bản ghi/payload do server trả hoặc giá trị dùng dựng form; không tự phát minh ID/trạng thái.
 */
export function registrationForm(record = {}) {
    return Object.fromEntries(EDITABLE_FIELDS.map((name) => [name, record[name] == null ? "" : String(record[name])]));
}
/**
 * Gửi đủ trường owner PUT, đổi rỗng thành null và chỉ đổi height/weight sang number; tránh gửi field quản lý hoặc role.
 * @param form Giá trị form controlled, chưa được coi là dữ liệu đã lưu ở server.
 */
export function registrationPayload(form) {
    // Owner PUT is a replacement. Every editable key is always present.
    return Object.fromEntries(EDITABLE_FIELDS.map((name) => {
        const value = String(form[name] ?? "").trim();
        return [name, value === "" ? null : ["heightCm", "weightKg"].includes(name) ? Number(value) : value];
    }));
}
/**
 * Kiểm ngày ISO có thật, không chấp nhận ngày bị JavaScript tự điều chỉnh như ngày 30 tháng 2.
 * @param value Giá trị value truyền vào validDate; tham chiếu phần thân để xem cách dùng.
 */
export function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "0001-01-01") return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
/**
 * Cho phép bản nháp chưa đủ thông tin nhưng kiểm dữ liệu đã nhập, giới hạn thể chất và thứ tự/ngày hợp lệ.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param form Giá trị form controlled, chưa được coi là dữ liệu đã lưu ở server.
 * @param today Ngày nghiệp vụ dùng kiểm form; truyền được trong kiểm thử để cố định ranh giới.
 */
export function validateDraft(form, today = new Intl.DateTimeFormat("sv-SE", { timeZone: INTAKE_LIMITS.timeZone }).format(new Date())) {
    const errors = {};
    const values = registrationPayload(form);
    for (const field of fields) {
        const value = values[field.name];
        if (value === null) continue; // Partial drafts are valid.
        if (field.maxLength && value.length > field.maxLength) errors[field.name] = msg(MSG.USE_AT_MOST_CHARACTERS, { p0: field.maxLength });
        if (field.type === "number" && (!Number.isFinite(value) || value < field.min || value > field.max)) errors[field.name] = msg(MSG.ENTER_A_NUMBER_FROM_TO, { p0: field.min, p1: field.max });
        if (field.type === "date" && (!validDate(value) || value === "0001-01-01")) errors[field.name] = msg(MSG.ENTER_A_VALID_DATE);
    }
    if (values.gender && !HORSE_GENDERS.includes(values.gender)) errors.gender = msg(MSG.CHOOSE_A_SUPPORTED_GENDER);
    if (values.dateOfBirth > today) errors.dateOfBirth = msg(MSG.DATE_OF_BIRTH_CANNOT_BE_IN_THE_FUTURE);
    if (values.measurementDate && (values.measurementDate > today || (values.dateOfBirth && values.measurementDate < values.dateOfBirth))) errors.measurementDate = msg(MSG.MEASUREMENT_DATE_MUST_BE_BETWEEN_BIRTH_AND_TODAY);
    if (values.boardingStart && values.boardingEnd && values.boardingEnd < values.boardingStart) errors.boardingEnd = msg(MSG.BOARDING_END_CANNOT_PRECEDE_BOARDING_START);
    return errors;
}
/**
 * Liệt kê trường bắt buộc còn thiếu và yêu cầu đúng HorsePhoto/Certificate trước khi gửi hồ sơ.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param record Bản ghi/payload do server trả hoặc giá trị dùng dựng form; không tự phát minh ID/trạng thái.
 * @param attachments Giá trị attachments truyền vào submissionMissing; tham chiếu phần thân để xem cách dùng.
 */
export function submissionMissing(record, attachments) {
    const required = ["name", "sire", "dam", "dateOfBirth", "gender", "breed", "heightCm", "weightKg", "measurementDate", "declaredHealth", "boardingStart"];
    const missing = required.filter((name) => record[name] == null || String(record[name]).trim() === "")
        .map((name) => fields.find((field) => field.name === name).label);
    if (!attachments.some((item) => item.type === ATTACHMENT_TYPE.HorsePhoto)) missing.push(msg(MSG.HORSE_PHOTO_ATTACHMENT));
    if (!attachments.some((item) => item.type === ATTACHMENT_TYPE.Certificate)) missing.push(msg(MSG.CERTIFICATE_ATTACHMENT));
    return missing;
}
