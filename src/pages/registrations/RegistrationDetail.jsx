import { MSG, msg } from "../../messages/index.js";
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

/**
 * Điều phối sửa nháp, upload, gửi/hủy và trạng thái stale; chỉ dùng response/reload thật để đổi trạng thái.
 * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { initialRecord, initialAttachments, reload }. Các props/callback lấy từ caller.
 */
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
    /**
     * Khóa lượt thao tác đang chạy, gọi hàm ghi rồi reload/callback; ghi nhận thành công hoặc lỗi và yêu cầu đối soát khi kết quả chưa chắc chắn.
     * @param name Tên/key đầu vào theo mục đích hàm; xem kiểu và điều kiện kiểm trong thân hàm.
     * @param action Giá trị action truyền vào run; tham chiếu phần thân để xem cách dùng.
     */
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
    /**
     * Đồng bộ record và giá trị form từ response đã lưu để reset dirty/version đúng với server.
     * @param updated Giá trị updated truyền vào acceptRecord; tham chiếu phần thân để xem cách dùng.
     */
    function acceptRecord(updated) { setRecord(updated); setValues(registrationForm(updated)); }
    /**
     * Kiểm dữ liệu hiện có, lưu qua API và dùng ID/response thật để cập nhật form hoặc chuyển trang.
     * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     * @param event Event UI; đọc target/currentTarget, chặn submit mặc định khi cần.
     */
    async function save(event) {
        event.preventDefault();
        const nextErrors = validateDraft(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        await run(msg(MSG.DANG_XU_LY), async () => { acceptRecord(await updateRegistration(record.id, values)); setNotice(msg(MSG.DA_LUU_HO_SO)); });
    }
    /**
     * Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.
     * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     */
    async function submit() {
        if (dirty || missing.length) return;
        const nextErrors = validateDraft(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        await run(msg(MSG.DANG_XU_LY), async () => {
            acceptRecord(await submitRegistration(record.id));
            setStep(4);
            setNotice(msg(MSG.YEU_CAU_DA_DUOC_GUI_VUI_LONG_CHO_BAN_QUAN_LY_KIEM_TRA_HO_SO));
        });
    }
    /**
     * Chỉ gửi hủy sau xác nhận, dùng response thật và giữ lỗi khi request không thành công.
     * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     */
    async function cancel() {
        if (!confirmCancel) return;
        await run(msg(MSG.DANG_XU_LY), async () => {
            acceptRecord(await cancelRegistration(record.id)); setConfirmCancel(false); setNotice(msg(MSG.DA_HUY_HO_SO));
        });
    }
    /**
     * Kiểm file và trạng thái thao tác, gọi upload API rồi tải lại metadata để UI chỉ hiển thị tệp đã lưu.
     * Có request ghi; pending/lock và trạng thái không chắc chắn bảo vệ việc thử lại.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     * @param values Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API.
     */
    async function upload(values) {
        return run(msg(MSG.DANG_XU_LY), async () => {
            await uploadAttachment(record.id, values);
            // Refresh metadata before enabling submission; never invent an attachment.
            try { setAttachments(await listAttachments(record.id)); }
            catch (failure) { setStale(true); throw failure; }
            setNotice(msg(MSG.DA_TAI_FILE_LEN));
        });
    }
    return <>
        <div className="d-flex flex-wrap align-items-center gap-3"><h1>{record.name || msg(MSG.HO_SO_CHUA_CO_TEN)}</h1><RegistrationStatus status={record.status} /></div>
        <p className="text-body-secondary">{msg(MSG.MA_HO_SO)}{' '}{record.id}</p>
        {record.reviewReason && <div className="alert alert-warning"><strong>{msg(MSG.LY_DO_YEU_CAU_CHINH_SUA)}</strong><p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{record.reviewReason}</p></div>}
        {!canEditRegistration(record.status) && <p>{msg(MSG.HO_SO_NAY_CHI_DUOC_XEM)}</p>}
        <RegistrationError error={error} />
        {notice && <p className="alert alert-success" role="status">{notice}</p>}
        {pending && <p role="status">{pending}{msg(MSG.SYMBOL_7)}</p>}
        {stale && <div className="alert alert-warning">{msg(MSG.HAY_TAI_LAI_HO_SO_TRUOC_THAO_TAC_TIEP_THEO_THAY_DOI_CHUA_LUU_SE_BI_BO)}{' '}<button className="btn btn-outline-primary" onClick={reload}>{msg(MSG.TAI_LAI_HO_SO)}</button></div>}
        {editable && <WizardSteps step={step} onChange={setStep} disabled={!!pending} />}
        {!canEditRegistration(record.status) && <><section className="surface-card"><h2>{record.status === REGISTRATION_STATUS.PendingReview ? msg(MSG.YEU_CAU_DA_DUOC_GUI) : msg(MSG.THEO_DOI_YEU_CAU)}</h2><RegistrationStatus status={record.status} /><p className="mt-3">{record.status === REGISTRATION_STATUS.PendingReview ? msg(MSG.HO_SO_DANG_CHO_BAN_QUAN_LY_KIEM_TRA_THONG_TIN_VA_FILE_DINH_KEM_DA_DUOC_G) : record.status === REGISTRATION_STATUS.Approved ? msg(MSG.HO_SO_DA_DUOC_PHE_DUYET_NGUA_DA_XUAT_HIEN_TRONG_MUC_NGUA_CUA_TOI) : msg(MSG.BAN_CO_THE_XEM_LAI_THONG_TIN_HO_SO_BEN_DUOI)}</p></section><RegistrationSummary record={record} /></>}
        <form onSubmit={save} noValidate hidden={!editable}>
            <RegistrationForm values={values} errors={errors} disabled={!editable || !!pending} step={editable ? step : undefined}
                onChange={(event) => { setValues({ ...values, [event.target.name]: event.target.value }); setNotice(""); }} />
            {editable && <div className="wizard-actions">{step > 0 && <button type="button" className="btn btn-outline-primary back-action" disabled={!!pending} onClick={() => setStep(step - 1)}>{msg(MSG.QUAY_LAI)}</button>}<button className="btn btn-success" type="submit" disabled={!!pending}>{msg(MSG.LUU_BAN_NHAP)}</button>{step < 4 && <button type="button" className="btn btn-primary" disabled={!!pending} onClick={() => setStep(step + 1)}>{msg(MSG.TIEP_TUC)}</button>}</div>}
        </form>
        <div hidden={editable && step !== 0 && step !== 1 && step !== 4}><RegistrationAttachments registrationId={record.id} attachments={attachments} editable={editable} busy={!!pending} onUpload={upload} /></div>
        {editable && step === 4 && <RegistrationSummary record={values} />}
        {editable && <section hidden={step !== 4} className="surface-card" aria-labelledby="registration-actions">
            <h2 id="registration-actions" className="h5">{msg(MSG.KIEM_TRA_VA_GUI_HO_SO)}</h2>
            {dirty && <p role="status">{msg(MSG.LUU_THAY_DOI_TRUOC_KHI_GUI_HO_SO)}</p>}
            {!!missing.length && <div><p>{msg(MSG.TRUOC_KHI_GUI_HAY_BO_SUNG_VAO_HO_SO_DA_LUU)}</p><ul>{missing.map((label) => <li key={label}>{label}</li>)}</ul></div>}
            <div className="d-flex flex-wrap gap-2">
                <button type="button" className="btn btn-success" disabled={!!pending || dirty || !!missing.length} onClick={submit}>
                    {record.status === REGISTRATION_STATUS.RevisionRequired ? msg(MSG.GUI_LAI_HO_SO) : msg(MSG.GUI_HO_SO)}
                </button>
                <button type="button" className="btn btn-outline-danger" disabled={!!pending} onClick={() => setConfirmCancel(true)}>{msg(MSG.HUY_HO_SO)}</button>
            </div>
            {confirmCancel && <div className="alert alert-warning mt-3" role="alert">
                <p>{msg(MSG.HUY_HO_SO_NAY_HO_SO_SE_CHI_DUOC_XEM_THAY_DOI_CHUA_LUU_SE_BI_BO)}</p>
                <button type="button" className="btn btn-danger me-2" disabled={!!pending} onClick={cancel}>{msg(MSG.XAC_NHAN_HUY)}</button>
                <button type="button" className="btn btn-secondary" disabled={!!pending} onClick={() => setConfirmCancel(false)}>{msg(MSG.GIU_HO_SO)}</button>
            </div>}
        </section>}
    </>;
}
/**
 * Tải hồ sơ cùng attachments theo ID và render phần nội dung tương ứng.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function RegistrationDetail() {
    const { id } = useParams();
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(async () => {
        const [record, attachments] = await Promise.all([getRegistration(id), listAttachments(id)]);
        return { record, attachments };
    }, [id]);
    const resource = useRegistrationResource(load);
    return <section>
        <Link to="/registrations">{msg(MSG.QUAY_LAI_YEU_CAU_DANG_KY)}</Link>
        {resource.loading && <p role="status">{msg(MSG.DANG_TAI_HO_SO)}</p>}
        {resource.error && <><RegistrationError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>{msg(MSG.THU_LAI)}</button></>}
        {resource.data && <RegistrationDetailContent key={id} initialRecord={resource.data.record} initialAttachments={resource.data.attachments} reload={resource.reload} />}
    </section>;
}
