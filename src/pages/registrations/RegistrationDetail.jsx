import { WizardSteps, RegistrationSummary } from "../../components/registrations/RegistrationWizard.jsx";
import { useCallback, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { getRegistration, updateRegistration, submitRegistration, cancelRegistration } from "../../services/registrationService.js";
import { listAttachments, uploadAttachment } from "../../services/registrationAttachments.js";
import { registrationForm, registrationPayload, submissionMissing, validateDraft } from "../../services/registrationValidation.js";
import { canEditRegistration, REGISTRATION_STATUS } from "../../constants/registration.js";
import RegistrationForm from "../../components/registrations/RegistrationForm.jsx";
import RegistrationStatus from "../../components/registrations/RegistrationStatus.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";
import RegistrationAttachments from "../../components/registrations/RegistrationAttachments.jsx";

export function RegistrationDetailContent({ initialRecord, initialAttachments, reload }) {
    const [record, setRecord] = useState(initialRecord);
    const [attachments, setAttachments] = useState(initialAttachments);
    const [values, setValues] = useState(() => registrationForm(initialRecord));
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState("");
    const [pending, setPending] = useState("");
    const [stale, setStale] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [step, setStep] = useState(canEditRegistration(initialRecord.status) ? 0 : 4);
    const lock = useRef(false);
    const editable = canEditRegistration(record.status) && !stale;
    const dirty = JSON.stringify(registrationPayload(values)) !== JSON.stringify(registrationPayload(record));
    const missing = submissionMissing(record, attachments);
    async function run(name, action) {
        if (lock.current || !editable) return false;
        lock.current = true; setPending(name); setError(null); setNotice("");
        try { await action(); return true; }
        catch (failure) {
            setError(failure);
            // A mutation may have succeeded before its response/reload failed.
            // Re-fetch before permitting another action; never blindly retry a POST.
            if ([403, 404, 409].includes(failure.status) || !failure.status || failure.status >= 500) setStale(true);
            return false;
        } finally { lock.current = false; setPending(""); }
    }
    function acceptRecord(updated) { setRecord(updated); setValues(registrationForm(updated)); }
    async function save(event) {
        event.preventDefault();
        const nextErrors = validateDraft(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        await run("Saving", async () => { acceptRecord(await updateRegistration(record.id, values)); setNotice("Đã lưu hồ sơ."); });
    }
    async function submit() {
        if (dirty || missing.length) return;
        const nextErrors = validateDraft(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        await run("Submitting", async () => {
            acceptRecord(await submitRegistration(record.id));
            setStep(4);
            setNotice("Yêu cầu đã được gửi. Vui lòng chờ ban quản lý kiểm tra hồ sơ.");
        });
    }
    async function cancel() {
        if (!confirmCancel) return;
        await run("Cancelling", async () => {
            acceptRecord(await cancelRegistration(record.id)); setConfirmCancel(false); setNotice("Đã hủy hồ sơ.");
        });
    }
    async function upload(values) {
        return run("Uploading", async () => {
            await uploadAttachment(record.id, values);
            // Refresh metadata before enabling submission; never invent an attachment.
            try { setAttachments(await listAttachments(record.id)); }
            catch (failure) { setStale(true); throw failure; }
            setNotice("Đã tải file lên.");
        });
    }
    return <>
        <div className="d-flex flex-wrap align-items-center gap-3"><h1>{record.name || "Hồ sơ chưa có tên"}</h1><RegistrationStatus status={record.status} /></div>
        <p className="text-body-secondary">Mã hồ sơ: {record.id}</p>
        {record.reviewReason && <div className="alert alert-warning"><strong>Lý do yêu cầu chỉnh sửa</strong><p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{record.reviewReason}</p></div>}
        {!canEditRegistration(record.status) && <p>Hồ sơ này chỉ được xem.</p>}
        <RegistrationError error={error} />
        {notice && <p className="alert alert-success" role="status">{notice}</p>}
        {pending && <p role="status">{pending}...</p>}
        {stale && <div className="alert alert-warning">Hãy tải lại hồ sơ trước thao tác tiếp theo. Thay đổi chưa lưu sẽ bị bỏ. <button className="btn btn-outline-primary" onClick={reload}>Tải lại hồ sơ</button></div>}
        {editable && <WizardSteps step={step} onChange={setStep} disabled={!!pending} />}
        {!canEditRegistration(record.status) && <><section className="surface-card"><h2>{record.status === "PendingReview" ? "Yêu cầu đã được gửi" : "Theo dõi yêu cầu"}</h2><RegistrationStatus status={record.status} /><p className="mt-3">{record.status === "PendingReview" ? "Hồ sơ đang chờ ban quản lý kiểm tra. Thông tin và file đính kèm đã được giữ lại." : record.status === "Approved" ? "Hồ sơ đã được phê duyệt. Ngựa đã xuất hiện trong mục Ngựa của tôi." : "Bạn có thể xem lại thông tin hồ sơ bên dưới."}</p></section><RegistrationSummary record={record} /></>}
        <form onSubmit={save} noValidate hidden={!editable}>
            <RegistrationForm values={values} errors={errors} disabled={!editable || !!pending} step={editable ? step : undefined}
                onChange={(event) => { setValues({ ...values, [event.target.name]: event.target.value }); setNotice(""); }} />
            {editable && <div className="wizard-actions">{step > 0 && <button type="button" className="btn btn-outline-primary back-action" disabled={!!pending} onClick={() => setStep(step - 1)}>Quay lại</button>}<button className="btn btn-success" type="submit" disabled={!!pending}>Lưu bản nháp</button>{step < 4 && <button type="button" className="btn btn-primary" disabled={!!pending} onClick={() => setStep(step + 1)}>Tiếp tục</button>}</div>}
        </form>
        <div hidden={editable && step !== 0 && step !== 1 && step !== 4}><RegistrationAttachments registrationId={record.id} attachments={attachments} editable={editable} busy={!!pending} onUpload={upload} /></div>
        {editable && step === 4 && <RegistrationSummary record={values} />}
        {editable && <section hidden={step !== 4} className="surface-card" aria-labelledby="registration-actions">
            <h2 id="registration-actions" className="h5">Kiểm tra và gửi hồ sơ</h2>
            {dirty && <p role="status">Lưu thay đổi trước khi gửi hồ sơ.</p>}
            {!!missing.length && <div><p>Trước khi gửi, hãy bổ sung vào hồ sơ đã lưu:</p><ul>{missing.map((label) => <li key={label}>{label}</li>)}</ul></div>}
            <div className="d-flex flex-wrap gap-2">
                <button type="button" className="btn btn-success" disabled={!!pending || dirty || !!missing.length} onClick={submit}>
                    {record.status === REGISTRATION_STATUS.RevisionRequired ? "Gửi lại hồ sơ" : "Gửi hồ sơ"}
                </button>
                <button type="button" className="btn btn-outline-danger" disabled={!!pending} onClick={() => setConfirmCancel(true)}>Hủy hồ sơ</button>
            </div>
            {confirmCancel && <div className="alert alert-warning mt-3" role="alert">
                <p>Hủy hồ sơ này? Hồ sơ sẽ chỉ được xem, thay đổi chưa lưu sẽ bị bỏ.</p>
                <button type="button" className="btn btn-danger me-2" disabled={!!pending} onClick={cancel}>Xác nhận hủy</button>
                <button type="button" className="btn btn-secondary" disabled={!!pending} onClick={() => setConfirmCancel(false)}>Giữ hồ sơ</button>
            </div>}
        </section>}
    </>;
}
export default function RegistrationDetail() {
    const { id } = useParams();
    const load = useCallback(async () => {
        const [record, attachments] = await Promise.all([getRegistration(id), listAttachments(id)]);
        return { record, attachments };
    }, [id]);
    const resource = useRegistrationResource(load);
    return <section>
        <Link to="/registrations">Quay lại yêu cầu đăng ký</Link>
        {resource.loading && <p role="status">Đang tải hồ sơ...</p>}
        {resource.error && <><RegistrationError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>Thử lại</button></>}
        {resource.data && <RegistrationDetailContent key={id} initialRecord={resource.data.record} initialAttachments={resource.data.attachments} reload={resource.reload} />}
    </section>;
}
