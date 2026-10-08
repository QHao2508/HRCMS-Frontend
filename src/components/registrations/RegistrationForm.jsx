import { FORM_SECTIONS } from "../../services/registrationValidation.js";
import { PREFERENCES } from "../../constants/registration.js";
import { listPreferredStaff } from "../../services/registrationService.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";

const fields = Object.fromEntries(FORM_SECTIONS.flatMap((section) => section.fields.map((field) => [field.name, field])));
const labels = {
    name: "Tên ngựa", breed: "Giống ngựa", dateOfBirth: "Ngày sinh", gender: "Giới tính",
    sire: "Sire / Bố", dam: "Dam / Mẹ", registrationNumber: "Mã đăng ký bên ngoài (nếu có)",
    heightCm: "Chiều cao (cm)", weightKg: "Cân nặng (kg)", measurementDate: "Ngày đo",
    declaredHealth: "Tình trạng hiện tại theo quan sát", healthNotes: "Tiền sử / ghi chú sức khỏe",
    boardingStart: "Ngày bắt đầu", boardingEnd: "Ngày kết thúc",
};
const preferenceLabels = {
    preferredHeadTrainerId: "Head Trainer mong muốn",
    preferredGroomId: "Groom mong muốn",
    preferredVeterinarianId: "Veterinarian mong muốn",
};

export default function RegistrationForm({ values, onChange, errors = {}, disabled = false, step = null, ownerName = "" }) {
    const directory = useRegistrationResource(listPreferredStaff);
    const show = (index) => step === null || step === index;
    const showUploadHint = step !== null;

    function fieldInput(name, wide = false) {
        const field = fields[name];
        const error = errors[name];
        const props = {
            id: "registration-" + name, name, value: values[name] ?? "", onChange,
            className: "hrcms-registration-input", "aria-invalid": !!error,
            "aria-describedby": error ? name + "-error" : undefined,
        };
        let input;
        if (field.options) input = <select {...props}>
            <option value="">Chọn</option>
            {!field.options.includes(values[name]) && values[name] && <option value={values[name]}>Giá trị đã lưu không được hỗ trợ</option>}
            {field.options.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>;
        else if (field.type === "textarea") input = <textarea {...props} rows={3} maxLength={field.maxLength} placeholder="Nhập thông tin" />;
        else input = <input {...props} type={field.type || "text"} maxLength={field.maxLength}
            min={field.min} max={field.max} step={field.type === "number" ? "any" : undefined}
            placeholder={field.type === "date" ? undefined : "Nhập thông tin"} />;
        return <div className={"hrcms-registration-field" + (wide ? " hrcms-registration-field-wide" : "")} key={name}>
            <label htmlFor={props.id}>{labels[name]}</label>
            {input}
            {error && <p id={name + "-error"} className="hrcms-registration-field-error" role="alert">{error}</p>}
        </div>;
    }

    function uploadHint(label, detail) {
        return <div className="hrcms-registration-field hrcms-registration-field-wide">
            <span className="hrcms-registration-field-label">{label}</span>
            <div className="hrcms-registration-upload-hint">
                <img src="/figma/registration/upload-cloud.svg" alt="" width="24" height="24" />
                <strong>Lưu bản nháp để thêm tệp</strong>
                <small>{detail}</small>
            </div>
        </div>;
    }

    return <div className="hrcms-registration-form-sections">
        {show(0) && <fieldset disabled={disabled} className="hrcms-registration-card" id="registration-identity">
            <legend>Nhận diện và phả hệ</legend>
            <p className="hrcms-registration-card-description">Thông tin này giúp câu lạc bộ nhận diện ngựa và đối chiếu hồ sơ.</p>
            <div className="hrcms-registration-fields">
                {fieldInput("name")}{fieldInput("breed")}
                {fieldInput("dateOfBirth")}{fieldInput("gender")}
                {fieldInput("sire")}{fieldInput("dam")}
                {fieldInput("registrationNumber")}
                <div className="hrcms-registration-field">
                    <label htmlFor="registration-owner-name">Chủ sở hữu</label>
                    <input id="registration-owner-name" className="hrcms-registration-input" value={ownerName || "—"} readOnly />
                </div>
            </div>
            {showUploadHint && uploadHint("Ảnh nhận diện ngựa", "Ảnh toàn thân có thể tải lên sau khi bản nháp được lưu.")}
        </fieldset>}

        {show(1) && <>
            <section className="hrcms-registration-card" aria-labelledby="registration-documents-title" id="registration-documents">
                <h2 id="registration-documents-title">Giấy tờ của ngựa</h2>
                <p className="hrcms-registration-card-description">Có thể đính kèm nhiều tài liệu. Mỗi tệp có loại và thông tin phù hợp khi áp dụng.</p>
                {showUploadHint
                    ? uploadHint("Tài liệu đính kèm", "Giấy chứng nhận và tài liệu sức khỏe được thêm trên trang chi tiết sau khi lưu.")
                    : <p className="hrcms-registration-card-description">Tệp đã lưu và thao tác tải lên được hiển thị trong phần Tài liệu đính kèm bên dưới.</p>}
            </section>
            <fieldset disabled={disabled} className="hrcms-registration-card" id="registration-physical">
                <legend>Số đo thể chất</legend>
                <p className="hrcms-registration-card-description">Số đo khai báo ban đầu sẽ được lưu cùng hồ sơ đăng ký.</p>
                <div className="hrcms-registration-fields hrcms-registration-fields-three">
                    {fieldInput("heightCm")}{fieldInput("weightKg")}{fieldInput("measurementDate")}
                </div>
            </fieldset>
        </>}

        {show(2) && <>
            <div className="hrcms-registration-info" role="note">
                <img src="/figma/auth/info.svg" alt="" width="20" height="20" />
                <span>Khai báo sức khỏe ban đầu do chủ sở hữu cung cấp. Đánh giá chuyên môn thuộc Veterinarian.</span>
            </div>
            <fieldset disabled={disabled} className="hrcms-registration-card" id="registration-health">
                <legend>Thông tin Owner cung cấp</legend>
                <div className="hrcms-registration-fields">
                    {fieldInput("declaredHealth", true)}{fieldInput("healthNotes", true)}
                </div>
                {showUploadHint && uploadHint("Tài liệu sức khỏe hiện có", "Tài liệu do chủ sở hữu cung cấp có thể tải lên sau khi lưu bản nháp.")}
            </fieldset>
            <section className="hrcms-registration-card" aria-labelledby="registration-health-source-title">
                <h2 id="registration-health-source-title">Phân biệt nguồn thông tin</h2>
                <div className="hrcms-registration-facts">
                    <div><span>Khai báo của Owner</span><strong>{values.declaredHealth || "—"}</strong></div>
                    <div><span>Đánh giá của Veterinarian</span><strong>—</strong></div>
                </div>
                <p className="hrcms-registration-card-description">Khai báo của Owner và đánh giá y tế được hiển thị riêng.</p>
            </section>
        </>}

        {show(3) && <>
            <fieldset disabled={disabled} className="hrcms-registration-card" id="registration-staff">
                <legend>Đề xuất nhân sự</legend>
                <p className="hrcms-registration-card-description">Lựa chọn của bạn là đề xuất. Câu lạc bộ sẽ xác nhận nhân sự phụ trách chính thức.</p>
                {directory.loading && <p role="status">Đang tải danh sách nhân sự...</p>}
                {directory.error && <div role="alert" className="hrcms-registration-field-error">
                    Danh sách nhân sự chưa sẵn sàng. Các đề xuất đã lưu được giữ nguyên. <button type="button" onClick={directory.reload}>Thử lại</button>
                </div>}
                <div className="hrcms-registration-fields">
                    {PREFERENCES.map(({ field, role }) => {
                        const options = directory.data?.[role] || [];
                        const retained = values[field] && !options.some((person) => person.id === values[field]);
                        return <div className="hrcms-registration-field" key={field}>
                            <label htmlFor={field}>{preferenceLabels[field]}</label>
                            <select className="hrcms-registration-input" id={field} name={field} value={values[field]}
                                onChange={onChange} disabled={disabled || directory.loading || !!directory.error}>
                                <option value="">Không có đề xuất</option>
                                {retained && <option value={values[field]}>Đề xuất đã lưu (không còn trong danh sách)</option>}
                                {options.map((person) => <option value={person.id} key={person.id}>
                                    {[person.firstName, person.lastName].filter(Boolean).join(" ") || "Nhân sự"}
                                </option>)}
                            </select>
                        </div>;
                    })}
                </div>
                <p className="hrcms-registration-card-footnote">Trainer trực tiếp sẽ do Head Trainer phân công sau khi hồ sơ được duyệt.</p>
            </fieldset>
            <fieldset disabled={disabled} className="hrcms-registration-card" id="registration-boarding">
                <legend>Thời gian gửi dự kiến</legend>
                <div className="hrcms-registration-fields">{fieldInput("boardingStart")}{fieldInput("boardingEnd")}</div>
                <p className="hrcms-registration-card-footnote">Thời gian dự kiến được lưu riêng với thời điểm ngựa thực tế đến.</p>
            </fieldset>
        </>}

        {step === 4 && <section className="hrcms-registration-card" aria-labelledby="registration-review-title" id="registration-review">
            <h2 id="registration-review-title">Thông tin hồ sơ</h2>
            <div className="hrcms-registration-facts">
                <div><span>Nhận diện</span><strong>{values.name || "—"}</strong></div>
                <div><span>Phả hệ</span><strong>{[values.sire, values.dam].filter(Boolean).join(" · ") || "—"}</strong></div>
                <div><span>Thể chất</span><strong>{[values.heightCm && values.heightCm + " cm", values.weightKg && values.weightKg + " kg"].filter(Boolean).join(" · ") || "—"}</strong></div>
                <div><span>Thời gian gửi</span><strong>{values.boardingStart || "—"}</strong></div>
                <div><span>Owner khai báo sức khỏe</span><strong>{values.declaredHealth || "—"}</strong></div>
                <div><span>Tài liệu</span><strong>Thêm sau khi lưu bản nháp</strong></div>
            </div>
            <p className="hrcms-registration-card-footnote">Lưu bản nháp, sau đó tải ảnh ngựa và giấy chứng nhận trên trang chi tiết trước khi gửi.</p>
        </section>}
    </div>;
}
