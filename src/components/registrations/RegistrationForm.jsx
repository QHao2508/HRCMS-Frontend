import { REGISTRATION_SECTION } from "../../constants/registration.js";
import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg } from "../../messages/index.js";
import { FORM_SECTIONS } from "../../services/registrationValidation.js";
import { PREFERENCES } from "../../constants/registration.js";
import { listPreferredStaff } from "../../services/registrationService.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { useAuth } from "../../context/useAuth.js";
import { FIELD_LABELS, SECTION_STEPS } from "../../constants/registrationWizard.js";
const sectionTitles = { [REGISTRATION_SECTION.Identity]: msg(MSG.NHAN_DIEN_VA_PHA_HE), [REGISTRATION_SECTION.Pedigree]: msg(MSG.PHA_HE), [REGISTRATION_SECTION.Physical]: msg(MSG.THONG_TIN_THE_CHAT), [REGISTRATION_SECTION.Health]: msg(MSG.KHAI_BAO_SUC_KHOE_BAN_DAU), [REGISTRATION_SECTION.Boarding]: msg(MSG.THOI_GIAN_LUU_TRU) };
/**
 * Render các section intake theo wizard, lựa chọn nhân sự và lỗi theo field; giữ đề xuất khác với phân công chính thức.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { values, onChange, errors = {}, disabled = false, step }. Các props/callback lấy từ caller.
 */
export default function RegistrationForm({ values, onChange, errors = {}, disabled = false, step }) {
    const directory = useRegistrationResource(listPreferredStaff);
    const { user } = useAuth();
    /**
     * Chọn select/textarea/input theo metadata field, nối ID và lỗi ARIA, giữ value enum nguyên bản.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     * @param field Giá trị field truyền vào input; tham chiếu phần thân để xem cách dùng.
     */
    function input(field) {
        const props = { id: `registration-${field.name}`, name: field.name, value: values[field.name], onChange, className: `form-control${errors[field.name] ? " is-invalid" : ""}`, "aria-invalid": !!errors[field.name], "aria-describedby": errors[field.name] ? `${field.name}-error` : undefined };
        if (field.options) return <select {...props} className="form-select"><option value="">{msg(MSG.CHON_GIOI_TINH)}</option>{!field.options.includes(values[field.name]) && values[field.name] && <option value={values[field.name]}>{msg(MSG.GIA_TRI_DA_LUU_KHONG_DUOC_HO_TRO)}</option>}{field.options.map(value => <option key={value} value={value}>{getEnumLabel(value)}</option>)}</select>;
        if (field.type === "textarea") return <textarea {...props} rows={3} maxLength={field.maxLength} />;
        return <input {...props} onInput={field.type === "date" ? onChange : undefined} type={field.type || "text"} maxLength={field.maxLength} min={field.min} max={field.max} step={field.type === "number" ? "any" : undefined} placeholder={field.type === "date" ? undefined : msg(MSG.NHAP_THONG_TIN)} />;
    }
    const sections = step === 0 ? [{ title: REGISTRATION_SECTION.Identity, fields: ["name","breed","dateOfBirth","gender","sire","dam","registrationNumber"].map(name => FORM_SECTIONS.flatMap(s => s.fields).find(f => f.name === name)) }] : FORM_SECTIONS;
    return <>
        {sections.map(section => <fieldset key={section.title} disabled={disabled} className="form-card" hidden={step !== undefined && SECTION_STEPS[section.title] !== step}>
            <legend>{sectionTitles[section.title]}</legend>
            {section.title === REGISTRATION_SECTION.Health && <p className="card-description">{msg(MSG.THONG_TIN_DO_CHU_SO_HUU_KHAI_BAO_KHONG_THAY_THE_KET_LUAN_HOAC_CLEARANCE)}</p>}
            <div className="row g-3">{section.fields.map(field => <div className={field.type === "textarea" ? "col-12" : "col-12 col-lg-6"} key={field.name}><label className="form-label" htmlFor={`registration-${field.name}`}>{FIELD_LABELS[field.name] || field.label}</label>{input(field)}{errors[field.name] && <div id={`${field.name}-error`} className="text-danger">{errors[field.name]}</div>}</div>)}</div>
            {section.title === REGISTRATION_SECTION.Identity && <div className="mt-3"><label className="form-label" htmlFor="registration-owner">{msg(MSG.CHU_SO_HUU)}</label><input id="registration-owner" className="form-control" readOnly value={[user?.firstName,user?.lastName].filter(Boolean).join(" ") || user?.userName || msg(MSG.TAI_KHOAN_DANG_DANG_NHAP)} /></div>}
        </fieldset>)}
        <fieldset disabled={disabled} className="form-card" hidden={step !== undefined && step !== 3}>
            <legend>{msg(MSG.NHAN_SU_DE_XUAT)}</legend><p className="card-description">{msg(MSG.LUA_CHON_UU_TIEN_LA_DE_XUAT_KHONG_PHAI_PHAN_CONG_CHINH_THUC)}</p>
            {directory.loading && <p role="status">{msg(MSG.DANG_TAI_NHAN_SU)}</p>}
            {directory.error && <div role="alert">{msg(MSG.CHUA_TAI_DUOC_DANH_SACH_CAC_LUA_CHON_DA_LUU_VAN_DUOC_GIU)}<button type="button" className="btn btn-link" onClick={directory.reload}>{msg(MSG.THU_LAI)}</button></div>}
            <div className="row g-3">{PREFERENCES.map(({ field, role }) => {
                const options = directory.data?.[role] || [];
                const retained = values[field] && !options.some(person => person.id === values[field]);
                return <div className="col-12 col-lg-4" key={field}><label className="form-label" htmlFor={field}>{FIELD_LABELS[field]}</label><select className="form-select" id={field} name={field} value={values[field]} onChange={onChange} disabled={directory.loading || !!directory.error}><option value="">{msg(MSG.KHONG_DE_XUAT)}</option>{retained && <option value={values[field]}>{msg(MSG.LUA_CHON_DA_LUU_KHONG_CON_TRONG_DANH_SACH)}</option>}{options.map(person => <option value={person.id} key={person.id}>{[person.firstName,person.lastName].filter(Boolean).join(" ") || msg(MSG.NHAN_VIEN)}</option>)}</select></div>;
            })}</div>
        </fieldset>
    </>;
}
