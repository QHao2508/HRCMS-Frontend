import { MSG, msg } from "../../messages/index.js";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RegistrationForm from "../../components/registrations/RegistrationForm.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";
import { WizardSteps, RegistrationSummary } from "../../components/registrations/RegistrationWizard.jsx";
import { registrationForm, validateDraft } from "../../services/registrationValidation.js";
import { saveDraftWithPhoto } from "../../services/registrationPhoto.js";
import { HorsePhotoInput } from "../../components/registrations/HorsePhotoInput.jsx";
import { BackLink, PageHeading } from "../../components/WorkflowUI.jsx";
/**
 * Giữ intake/ảnh chọn trong bộ nhớ, lưu bản nháp rồi upload; giữ ID khi upload lỗi và chặn tạo trùng khi response không chắc chắn.
 * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function RegistrationCreate() {
    const navigate = useNavigate();
    const [values,setValues] = useState(() => registrationForm());
    const [step,setStep] = useState(0);
    const [errors,setErrors] = useState({});
    const [error,setError] = useState(null);
    const [busy,setBusy] = useState(false);
    const lock = useRef(false);
    const [photo, setPhoto] = useState(null);
    const [savedDraftId, setSavedDraftId] = useState(null);
    const [uncertain, setUncertain] = useState(false);
    /**
     * Kiểm dữ liệu hiện có, lưu qua API và dùng ID/response thật để cập nhật form hoặc chuyển trang.
     * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
     * @param event Event UI; đọc target/currentTarget, chặn submit mặc định khi cần.
     */
    async function save(event) {
        event.preventDefault(); if (lock.current || uncertain) return;
        const nextErrors = validateDraft(values); setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
        lock.current = true; setBusy(true); setError(null);
        try { const record = await saveDraftWithPhoto({ registrationId: savedDraftId, values, file: photo, onSaved:
    /**
     * Giữ ID bản nháp ngay sau lần lưu để lỗi upload ảnh không làm mất liên kết hoặc tạo bản nháp trùng.
     * @param record Bản ghi/payload do server trả hoặc giá trị dùng dựng form; không tự phát minh ID/trạng thái.
     */
    record => setSavedDraftId(record.id) }); navigate(`/registrations/${encodeURIComponent(record.id)}`, { replace:true }); }
        catch (failure) { setError(failure); if (!failure.status || failure.status >= 500 || [403, 404, 409].includes(failure.status)) setUncertain(true); }
        finally { lock.current = false; setBusy(false); }
    }
    return <section><BackLink to="/registrations">{msg(MSG.YEU_CAU_DANG_KY)}</BackLink><PageHeading title={msg(MSG.DANG_KY_NGUA_MOI)} description={msg(MSG.BAN_NHAP_CHU_SO_HUU)} />
        <WizardSteps step={step} onChange={setStep} disabled={busy} /><RegistrationError error={error} />
        {!!Object.keys(errors).length && <div className="alert alert-danger" role="alert">{msg(MSG.KIEM_TRA_THONG_TIN_DA_NHAP_BAN_CO_THE_CHUYEN_GIUA_CAC_BUOC_DE_SUA_LOI)}</div>}
        {savedDraftId && <p className="alert alert-info">{msg(MSG.PHOTO_SAVED_DRAFT)}{' '}<Link to={`/registrations/${savedDraftId}`}>{msg(MSG.PHOTO_OPEN_SAVED_DRAFT)}</Link></p>}
        {uncertain && <p className="alert alert-warning" role="alert">{msg(MSG.PHOTO_UPLOAD_UNCERTAIN)}{' '}<Link to="/registrations">{msg(MSG.YEU_CAU_DANG_KY)}</Link></p>}
        <form onSubmit={save} noValidate><RegistrationForm values={values} errors={errors} disabled={busy} step={step} onChange={e => setValues({...values,[e.target.name]:e.target.value})} />
            {step === 4 && <RegistrationSummary record={values} />}
            <div hidden={step !== 0}><HorsePhotoInput file={photo} onChange={setPhoto} disabled={busy || uncertain} /></div>
            <div className="wizard-actions">{step > 0 && <button className="btn btn-outline-primary back-action" type="button" disabled={busy} onClick={() => setStep(step-1)}>{msg(MSG.QUAY_LAI)}</button>}<button className="btn btn-success" type="submit" disabled={busy || uncertain}>{busy ? msg(MSG.DANG_LUU) : photo ? msg(MSG.PHOTO_SAVE_DRAFT) : msg(MSG.LUU_BAN_NHAP)}</button>{step < 4 && <button className="btn btn-primary" type="button" disabled={busy} onClick={() => setStep(step+1)}>{msg(MSG.TIEP_TUC)}</button>}</div>
        </form>
    </section>;
}
