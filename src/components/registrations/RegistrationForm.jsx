import { FORM_SECTIONS } from "../../services/registrationValidation.js";
import { PREFERENCES } from "../../constants/registration.js";
import { listPreferredStaff } from "../../services/registrationService.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { useAuth } from "../../context/useAuth.js";
import { FIELD_LABELS, SECTION_STEPS } from "../../constants/registrationWizard.js";
const sectionTitles = { "Horse information": "Nhận diện và phả hệ", Pedigree: "Phả hệ", "Physical information": "Thông tin thể chất", "Initial health declaration": "Khai báo sức khỏe ban đầu", "Boarding period": "Thời gian lưu trú" };
const genderLabels = { Male: "Đực", Female: "Cái", Gelding: "Đực đã thiến" };
export default function RegistrationForm({ values, onChange, errors = {}, disabled = false, step }) {
    const directory = useRegistrationResource(listPreferredStaff);
    const { user } = useAuth();
    function input(field) {
        const props = { id: `registration-${field.name}`, name: field.name, value: values[field.name], onChange, className: `form-control${errors[field.name] ? " is-invalid" : ""}`, "aria-invalid": !!errors[field.name], "aria-describedby": errors[field.name] ? `${field.name}-error` : undefined };
        if (field.options) return <select {...props} className="form-select"><option value="">Chọn giới tính</option>{!field.options.includes(values[field.name]) && values[field.name] && <option value={values[field.name]}>Giá trị đã lưu không được hỗ trợ</option>}{field.options.map(value => <option key={value} value={value}>{genderLabels[value] || value}</option>)}</select>;
        if (field.type === "textarea") return <textarea {...props} rows={3} maxLength={field.maxLength} />;
        return <input {...props} onInput={field.type === "date" ? onChange : undefined} type={field.type || "text"} maxLength={field.maxLength} min={field.min} max={field.max} step={field.type === "number" ? "any" : undefined} placeholder={field.type === "date" ? undefined : "Nhập thông tin"} />;
    }
    const sections = step === 0 ? [{ title: "Horse information", fields: ["name","breed","dateOfBirth","gender","sire","dam","registrationNumber"].map(name => FORM_SECTIONS.flatMap(s => s.fields).find(f => f.name === name)) }] : FORM_SECTIONS;
    return <>
        {sections.map(section => <fieldset key={section.title} disabled={disabled} className="form-card" hidden={step !== undefined && SECTION_STEPS[section.title] !== step}>
            <legend>{sectionTitles[section.title]}</legend>
            {section.title === "Initial health declaration" && <p className="card-description">Thông tin do chủ sở hữu khai báo; không thay thế kết luận hoặc clearance của bác sĩ thú y.</p>}
            <div className="row g-3">{section.fields.map(field => <div className={field.type === "textarea" ? "col-12" : "col-12 col-lg-6"} key={field.name}><label className="form-label" htmlFor={`registration-${field.name}`}>{FIELD_LABELS[field.name] || field.label}</label>{input(field)}{errors[field.name] && <div id={`${field.name}-error`} className="text-danger">{errors[field.name]}</div>}</div>)}</div>
            {section.title === "Horse information" && <div className="mt-3"><label className="form-label" htmlFor="registration-owner">Chủ sở hữu</label><input id="registration-owner" className="form-control" readOnly value={[user?.firstName,user?.lastName].filter(Boolean).join(" ") || user?.userName || "Tài khoản đang đăng nhập"} /></div>}
        </fieldset>)}
        <fieldset disabled={disabled} className="form-card" hidden={step !== undefined && step !== 3}>
            <legend>Nhân sự đề xuất</legend><p className="card-description">Lựa chọn ưu tiên là đề xuất, không phải phân công chính thức.</p>
            {directory.loading && <p role="status">Đang tải nhân sự...</p>}
            {directory.error && <div role="alert">Chưa tải được danh sách. Các lựa chọn đã lưu vẫn được giữ.<button type="button" className="btn btn-link" onClick={directory.reload}>Thử lại</button></div>}
            <div className="row g-3">{PREFERENCES.map(({ field, role }) => {
                const options = directory.data?.[role] || [];
                const retained = values[field] && !options.some(person => person.id === values[field]);
                return <div className="col-12 col-lg-4" key={field}><label className="form-label" htmlFor={field}>{FIELD_LABELS[field]}</label><select className="form-select" id={field} name={field} value={values[field]} onChange={onChange} disabled={directory.loading || !!directory.error}><option value="">Không đề xuất</option>{retained && <option value={values[field]}>Lựa chọn đã lưu (không còn trong danh sách)</option>}{options.map(person => <option value={person.id} key={person.id}>{[person.firstName,person.lastName].filter(Boolean).join(" ") || "Nhân viên"}</option>)}</select></div>;
            })}</div>
        </fieldset>
    </>;
}
