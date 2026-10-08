import { useState } from "react";
import { managerEditForm, validateManagerEdit } from "../../services/managerReviewService.js";

const fields = [["name", "Tên ngựa", "text", 200], ["registrationNumber", "Mã đăng ký bên ngoài", "text", 100],
    ["boardingStart", "Ngày bắt đầu gửi", "date"], ["boardingEnd", "Ngày kết thúc gửi", "date"]];

export default function ManagerEditForm({ record, busy, onSave, onDiscard }) {
    const [values, setValues] = useState(() => managerEditForm(record));
    const [errors, setErrors] = useState({});
    async function submit(event) {
        event.preventDefault();
        if (busy) return;
        const next = validateManagerEdit(values, record);
        setErrors(next);
        if (!Object.keys(next).length) await onSave(values);
    }
    return <form onSubmit={submit} noValidate className="hrcms-registration-card hrcms-manager-edit-form">
        <fieldset disabled={busy}>
            <legend>Chỉnh sửa thông tin quản lý</legend>
            <p className="hrcms-registration-card-description">Club Manager chỉ thay đổi các thông tin hành chính bên dưới. Ngày kết thúc đã lưu không thể xóa trong bước này.</p>
            <div className="hrcms-registration-fields">
                {fields.map(([name, label, type, maxLength]) => <div className="hrcms-registration-field" key={name}>
                    <label htmlFor={"manager-" + name}>{label}</label>
                    <input className="hrcms-registration-input" id={"manager-" + name} name={name} type={type} maxLength={maxLength}
                        value={values[name]} onChange={(event) => setValues({ ...values, [name]: event.target.value })}
                        aria-invalid={!!errors[name]} aria-describedby={errors[name] ? "manager-" + name + "-error" : undefined} />
                    {errors[name] && <p className="hrcms-registration-field-error" id={"manager-" + name + "-error"} role="alert">{errors[name]}</p>}
                </div>)}
            </div>
            <div className="hrcms-registration-actions">
                <button type="button" className="hrcms-registration-button hrcms-registration-button-outline" onClick={onDiscard}>Hủy chỉnh sửa</button>
                <button type="submit" className="hrcms-registration-button hrcms-registration-button-primary">Lưu thông tin quản lý</button>
            </div>
        </fieldset>
    </form>;
}
