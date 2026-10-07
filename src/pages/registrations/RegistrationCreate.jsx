import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import RegistrationForm from "../../components/registrations/RegistrationForm.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";
import { WizardSteps, RegistrationSummary } from "../../components/registrations/RegistrationWizard.jsx";
import { registrationForm, validateDraft } from "../../services/registrationValidation.js";
import { createRegistration } from "../../services/registrationService.js";
import { BackLink, PageHeading } from "../../components/WorkflowUI.jsx";
export default function RegistrationCreate() {
    const navigate = useNavigate();
    const [values,setValues] = useState(() => registrationForm());
    const [step,setStep] = useState(0);
    const [errors,setErrors] = useState({});
    const [error,setError] = useState(null);
    const [busy,setBusy] = useState(false);
    const lock = useRef(false);
    async function save(event) {
        event.preventDefault(); if (lock.current) return;
        const nextErrors = validateDraft(values); setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
        lock.current = true; setBusy(true); setError(null);
        try { const record = await createRegistration(values); navigate(`/registrations/${encodeURIComponent(record.id)}`, { replace:true }); }
        catch (failure) { setError(failure); }
        finally { lock.current = false; setBusy(false); }
    }
    return <section><BackLink to="/registrations">Yêu cầu đăng ký</BackLink><PageHeading title="Đăng ký ngựa mới" description="Bản nháp · Chủ sở hữu" />
        <WizardSteps step={step} onChange={setStep} disabled={busy} /><RegistrationError error={error} />
        {!!Object.keys(errors).length && <div className="alert alert-danger" role="alert">Kiểm tra thông tin đã nhập. Bạn có thể chuyển giữa các bước để sửa lỗi.</div>}
        <form onSubmit={save} noValidate><RegistrationForm values={values} errors={errors} disabled={busy} step={step} onChange={e => setValues({...values,[e.target.name]:e.target.value})} />
            {step === 4 && <RegistrationSummary record={values} />}
            {step < 2 && <div className="surface-card upload-zone"><h2>{step === 0 ? "Ảnh nhận diện ngựa" : "Giấy chứng nhận"}</h2><p className="muted-caption">Lưu bản nháp trước để tải file lên hồ sơ. Thông tin chưa hoàn chỉnh vẫn có thể lưu.</p></div>}
            <div className="wizard-actions">{step > 0 && <button className="btn btn-outline-primary back-action" type="button" disabled={busy} onClick={() => setStep(step-1)}>Quay lại</button>}<button className="btn btn-success" type="submit" disabled={busy}>{busy ? "Đang lưu..." : "Lưu bản nháp"}</button>{step < 4 && <button className="btn btn-primary" type="button" disabled={busy} onClick={() => setStep(step+1)}>Tiếp tục</button>}</div>
        </form>
    </section>;
}
