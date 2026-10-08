import { useCallback, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { getUserDisplayName } from "../../utils/userDisplay.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { getRegistration, updateRegistration, submitRegistration, cancelRegistration } from "../../services/registrationService.js";
import { listAttachments, uploadAttachment } from "../../services/registrationAttachments.js";
import { registrationForm, registrationPayload, submissionMissing, validateDraft } from "../../services/registrationValidation.js";
import { canEditRegistration, REGISTRATION_STATUS } from "../../constants/registration.js";
import RegistrationForm from "../../components/registrations/RegistrationForm.jsx";
import RegistrationStatus from "../../components/registrations/RegistrationStatus.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";
import RegistrationAttachments from "../../components/registrations/RegistrationAttachments.jsx";
import "../../style/registration.css";

export function RegistrationDetailContent({ initialRecord, initialAttachments, reload }) {
    const { user } = useAuth();
    const ownerName = getUserDisplayName(user);
    const [record, setRecord] = useState(initialRecord);
    const [attachments, setAttachments] = useState(initialAttachments);
    const [values, setValues] = useState(() => registrationForm(initialRecord));
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState("");
    const [pending, setPending] = useState("");
    const [stale, setStale] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
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
        await run("Saving", async () => { acceptRecord(await updateRegistration(record.id, values)); setNotice("Đã lưu thay đổi của hồ sơ."); });
    }
    async function submit() {
        if (dirty || missing.length) return;
        const nextErrors = validateDraft(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        await run("Submitting", async () => {
            acceptRecord(await submitRegistration(record.id));
            setNotice("Đã gửi đăng ký. Trạng thái hiện tại được hiển thị bên trên.");
        });
    }
    async function cancel() {
        if (!confirmCancel) return;
        await run("Cancelling", async () => {
            acceptRecord(await cancelRegistration(record.id)); setConfirmCancel(false); setNotice("Đã hủy yêu cầu đăng ký.");
        });
    }
    async function upload(values) {
        return run("Uploading", async () => {
            await uploadAttachment(record.id, values);
            // Refresh metadata before enabling submission; never invent an attachment.
            try { setAttachments(await listAttachments(record.id)); }
            catch (failure) { setStale(true); throw failure; }
            setNotice("Đã tải tệp lên.");
        });
    }
    const submitted = record.status === REGISTRATION_STATUS.PendingReview;
    const title = submitted ? "Yêu cầu đã được gửi" : record.status === REGISTRATION_STATUS.Approved
        ? "Yêu cầu đã được duyệt" : record.status === REGISTRATION_STATUS.RevisionRequired
            ? "Yêu cầu cần bổ sung" : "Chi tiết đăng ký ngựa";
    const nextStep = submitted ? "Chờ phản hồi kiểm tra hồ sơ" : record.status === REGISTRATION_STATUS.Approved
        ? "Xem hồ sơ ngựa sau khi được tạo" : record.status === REGISTRATION_STATUS.RevisionRequired
            ? "Cập nhật hồ sơ rồi gửi lại" : record.status === REGISTRATION_STATUS.Draft
                ? "Hoàn thiện hồ sơ và gửi đăng ký" : "—";
    const pendingLabel = { Saving: "Đang lưu", Submitting: "Đang gửi", Cancelling: "Đang hủy", Uploading: "Đang tải tệp" }[pending];
    const detailBody = <>
        <form id="registration-detail-form" onSubmit={save} noValidate>
            <RegistrationForm values={values} errors={errors} disabled={!editable || !!pending} ownerName={ownerName}
                onChange={(event) => { setValues({ ...values, [event.target.name]: event.target.value }); setNotice(""); }} />
        </form>
        <RegistrationAttachments registrationId={record.id} attachments={attachments} editable={editable}
            busy={!!pending} onUpload={upload} owner />
    </>;
    return <div className="hrcms-registration-detail-content">
        <header className="hrcms-registration-heading">
            <h1>{title}</h1>
            <p>{record.registrationNumber || record.id} · {record.name || "Ngựa chưa đặt tên"}</p>
        </header>
        {submitted && <div className="hrcms-registration-info" role="status">
            <img src="/figma/auth/info.svg" alt="" width="20" height="20" />
            <span>Hồ sơ đang chờ Club Manager kiểm tra.</span>
        </div>}
        {record.reviewReason && <div className="hrcms-registration-review-reason" role="status">
            <strong>Lý do cần bổ sung</strong><p>{record.reviewReason}</p>
        </div>}
        <section className="hrcms-registration-card hrcms-registration-tracking" aria-labelledby="registration-tracking-title">
            <h2 id="registration-tracking-title">Theo dõi yêu cầu</h2>
            <RegistrationStatus status={record.status} />
            <div className="hrcms-registration-facts">
                <div><span>Chủ sở hữu</span><strong>{ownerName}</strong></div>
                <div><span>Mã yêu cầu</span><strong>{record.id}</strong></div>
                <div><span>Bước tiếp theo</span><strong>{nextStep}</strong></div>
            </div>
        </section>
        {submitted && <p className="hrcms-registration-detail-note">Horse Profile chỉ được tạo sau duyệt. Club Manager kiểm tra hồ sơ.</p>}
        {record.status === REGISTRATION_STATUS.Approved && record.horseId && <p className="hrcms-registration-detail-note">
            <Link to={"/horses/" + encodeURIComponent(record.horseId)}>Xem hồ sơ ngựa đã được duyệt</Link>
        </p>}
        <RegistrationError error={error} />
        {notice && <p className="hrcms-registration-info" role="status">{notice}</p>}
        {pending && <p className="hrcms-registration-pending" role="status">{pendingLabel}...</p>}
        {stale && <div className="hrcms-registration-review-reason" role="alert">
            <p>Tải lại yêu cầu trước khi thực hiện thao tác khác. Thay đổi chưa lưu sẽ bị bỏ.</p>
            <button type="button" className="hrcms-registration-button hrcms-registration-button-outline" onClick={reload}>Tải lại yêu cầu</button>
        </div>}
        <div className="hrcms-registration-actions hrcms-registration-list-action">
            <Link to="/registrations" className="hrcms-registration-button hrcms-registration-button-outline">Về danh sách</Link>
        </div>
        {editable ? detailBody : <details className="hrcms-registration-detail-more">
            <summary>Xem thông tin hồ sơ và tài liệu</summary>
            <p>Hồ sơ này chỉ đọc.</p>
            {detailBody}
        </details>}
        {editable && <section aria-labelledby="registration-actions" className="hrcms-registration-card hrcms-registration-completion">
            <h2 id="registration-actions">Kiểm tra và gửi</h2>
            {dirty && <p role="status">Lưu thay đổi trước khi gửi đăng ký.</p>}
            {!!missing.length && <div className="hrcms-registration-missing"><p>Trước khi gửi, hãy hoàn thiện hồ sơ đã lưu:</p>
                <ul>{missing.map((label) => <li key={label}>{label}</li>)}</ul></div>}
            <div className="hrcms-registration-actions">
                <button type="button" className="hrcms-registration-button hrcms-registration-button-danger" disabled={!!pending}
                    onClick={() => setConfirmCancel(true)}>Hủy đăng ký</button>
                <button type="submit" form="registration-detail-form" className="hrcms-registration-button hrcms-registration-button-save"
                    disabled={!!pending}>Lưu thay đổi</button>
                <button type="button" className="hrcms-registration-button hrcms-registration-button-primary"
                    disabled={!!pending || dirty || !!missing.length} onClick={submit}>
                    {record.status === REGISTRATION_STATUS.RevisionRequired ? "Gửi lại đăng ký" : "Gửi đăng ký"}
                </button>
            </div>
            {confirmCancel && <div className="hrcms-registration-review-reason" role="alert">
                <p>Hủy yêu cầu này? Hồ sơ sẽ chuyển sang chỉ đọc. Thay đổi chưa lưu sẽ bị bỏ.</p>
                <div className="hrcms-registration-actions">
                    <button type="button" className="hrcms-registration-button hrcms-registration-button-danger-filled"
                        disabled={!!pending} onClick={cancel}>Xác nhận hủy</button>
                    <button type="button" className="hrcms-registration-button hrcms-registration-button-outline"
                        disabled={!!pending} onClick={() => setConfirmCancel(false)}>Giữ yêu cầu</button>
                </div>
            </div>}
        </section>}
    </div>;
}
export default function RegistrationDetail() {
    const { id } = useParams();
    const load = useCallback(async () => {
        const [record, attachments] = await Promise.all([getRegistration(id), listAttachments(id)]);
        return { record, attachments };
    }, [id]);
    const resource = useRegistrationResource(load);
    return <section className="hrcms-registration-page" aria-label="Chi tiết đăng ký ngựa">
        {resource.loading && <p role="status">Đang tải yêu cầu đăng ký...</p>}
        {resource.error && <><RegistrationError error={resource.error} /><button type="button"
            className="hrcms-registration-button hrcms-registration-button-outline" onClick={resource.reload}>Thử lại</button></>}
        {resource.data && <RegistrationDetailContent key={id} initialRecord={resource.data.record} initialAttachments={resource.data.attachments} reload={resource.reload} />}
    </section>;
}
