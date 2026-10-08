import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { getUserDisplayName } from "../../utils/userDisplay.js";
import RegistrationForm from "../../components/registrations/RegistrationForm.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";
import { registrationForm, validateDraft } from "../../services/registrationValidation.js";
import { createRegistration } from "../../services/registrationService.js";
import "../../style/registration.css";

const steps = [
    { label: "1. Nhận diện", title: "Đăng ký ngựa mới" },
    { label: "2. Giấy tờ & thể chất", title: "Giấy tờ và thông tin thể chất" },
    { label: "3. Sức khỏe", title: "Khai báo sức khỏe ban đầu" },
    { label: "4. Nhân sự & thời gian", title: "Nhân sự mong muốn và thời gian gửi" },
    { label: "5. Kiểm tra & gửi", title: "Kiểm tra trước khi gửi" },
];
const fieldStep = {
    name: 0, breed: 0, dateOfBirth: 0, gender: 0, sire: 0, dam: 0, registrationNumber: 0,
    heightCm: 1, weightKg: 1, measurementDate: 1,
    declaredHealth: 2, healthNotes: 2,
    boardingStart: 3, boardingEnd: 3,
};
// These responses definitively reject creation. Timeouts, missing responses and
// server failures cannot establish whether the draft was already saved.
const definitiveCreateFailures = new Set([400, 401, 403, 404, 409, 413, 415, 422, 429]);

export default function RegistrationCreate() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const ownerName = getUserDisplayName(user);
    const [values, setValues] = useState(() => registrationForm());
    const [errors, setErrors] = useState({});
    const [validationNotice, setValidationNotice] = useState("");
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [uncertain, setUncertain] = useState(false);
    const [step, setStep] = useState(0);
    const lock = useRef(false);
    async function save(event) {
        event.preventDefault();
        if (lock.current) return;
        const nextErrors = validateDraft(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            setStep(fieldStep[Object.keys(nextErrors)[0]] ?? 0);
            setValidationNotice("Vui lòng sửa các trường được đánh dấu trước khi lưu.");
            return;
        }
        setValidationNotice("");
        lock.current = true; setBusy(true); setError(null);
        let uncertainOutcome = false;
        try {
            const record = await createRegistration(values);
            navigate("/registrations/" + encodeURIComponent(record.id), { replace: true });
        } catch (failure) {
            setError(failure);
            uncertainOutcome = !definitiveCreateFailures.has(failure.status);
            if (uncertainOutcome) setUncertain(true);
        } finally {
            // Retain the synchronous lock until this form is left. Frontend
            // protection cannot replace backend idempotency across new forms.
            if (!uncertainOutcome) lock.current = false;
            setBusy(false);
        }
    }
    const blocked = busy || uncertain;
    return <section className="hrcms-registration-page hrcms-registration-create" aria-labelledby="registration-create-title">
        <header className="hrcms-registration-heading">
            <h1 id="registration-create-title">{steps[step].title}</h1>
            <p>{values.name || "—"} · Bản nháp · Chủ sở hữu: {ownerName}</p>
        </header>
        <nav className="hrcms-registration-steps" aria-label="Các bước đăng ký">
            <ol>{steps.map((item, index) => <li key={item.label}>
                <button type="button" className={index === step ? "active" : ""} aria-current={index === step ? "step" : undefined}
                    onClick={() => setStep(index)} disabled={blocked}>{item.label}</button>
            </li>)}</ol>
        </nav>
        <RegistrationError error={error} />
        {uncertain && <div className="hrcms-registration-review-reason" role="alert">
            <p>Chưa xác nhận được kết quả lưu. Bản nháp có thể đã được lưu trên máy chủ. Để tránh tạo trùng, hãy kiểm tra danh sách đăng ký trước khi tạo bản nháp khác.</p>
            <Link to="/registrations" className="hrcms-registration-button hrcms-registration-button-outline">Kiểm tra danh sách đăng ký</Link>
        </div>}
        {validationNotice && <p className="hrcms-registration-validation-notice" role="alert">{validationNotice}</p>}
        {busy && <p role="status" className="hrcms-registration-pending">Đang lưu bản nháp...</p>}
        <form onSubmit={save} noValidate>
            <RegistrationForm values={values} errors={errors} disabled={blocked} step={step} ownerName={ownerName}
                onChange={(event) => { setValues({ ...values, [event.target.name]: event.target.value }); setValidationNotice(""); }} />
            <div className="hrcms-registration-actions">
                {step === 0 ? <Link to="/registrations" className="hrcms-registration-button hrcms-registration-button-outline">Hủy</Link>
                    : <button type="button" className="hrcms-registration-button hrcms-registration-button-outline"
                        disabled={blocked} onClick={() => setStep(step - 1)}>Quay lại</button>}
                <button type="submit" className="hrcms-registration-button hrcms-registration-button-save" disabled={blocked}>
                    {busy ? "Đang lưu..." : "Lưu bản nháp"}
                </button>
                {step < steps.length - 1 && <button type="button" className="hrcms-registration-button hrcms-registration-button-primary"
                    disabled={blocked} onClick={() => setStep(step + 1)}>Tiếp tục</button>}
            </div>
        </form>
    </section>;
}
