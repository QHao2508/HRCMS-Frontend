import { useCallback, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { getRegistration } from "../../services/registrationService.js";
import { listAttachments } from "../../services/registrationAttachments.js";
import { canReview, saveManagerEdit, reviewRegistration, isUncertainReviewError } from "../../services/managerReviewService.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { REGISTRATION_STATUS } from "../../constants/registration.js";
import RegistrationSummary from "../../components/registrations/RegistrationSummary.jsx";
import RegistrationAttachments from "../../components/registrations/RegistrationAttachments.jsx";
import RegistrationStatus from "../../components/registrations/RegistrationStatus.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";
import ManagerEditForm from "../../components/registrations/ManagerEditForm.jsx";
import ReviewConfirmation from "../../components/registrations/ReviewConfirmation.jsx";
import "../../style/registration.css";

export function ApprovalResult({ horseId }) {
    if (!horseId) return null;
    return <div className="hrcms-manager-outcome">
        <div className="hrcms-registration-info" role="status">
            <img src="/figma/auth/info.svg" alt="" width="20" height="20" />
            <span>Hồ sơ ngựa chính thức đã được tạo hoặc kích hoạt.</span>
        </div>
        <p>Nhân sự đề xuất chưa được phân công chính thức.</p>
        <Link to={"/horses/" + encodeURIComponent(horseId)} className="hrcms-registration-button hrcms-registration-button-save">Mở Horse Profile {horseId}</Link>
    </div>;
}

export function RegistrationReviewContent({ initialRecord, attachments, reload }) {
    const { user } = useAuth();
    const managerName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName || "—";
    const [record, setRecord] = useState(initialRecord);
    const [horseId, setHorseId] = useState(null);
    const [mode, setMode] = useState(null);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState("");
    const [pending, setPending] = useState(false);
    const [uncertain, setUncertain] = useState(false);
    const lock = useRef(false);
    const [dialogTrigger, setDialogTrigger] = useState(null);
    function openDialog(nextMode, event) {
        setDialogTrigger(event.currentTarget);
        setError(null);
        setMode(nextMode);
    }
    const allowed = canReview(record.status) && !uncertain;
    async function run(action) {
        if (lock.current || !allowed) return;
        lock.current = true; setPending(true); setError(null); setNotice("");
        try { await action(); setMode(null); }
        catch (failure) {
            setError(failure);
            if (isUncertainReviewError(failure)) { setUncertain(true); setMode(null); }
        } finally { lock.current = false; setPending(false); }
    }
    async function save(values) {
        await run(async () => { setRecord(await saveManagerEdit(record.id, values)); setNotice("Đã lưu thông tin quản lý. Hồ sơ mới nhất được hiển thị bên dưới."); });
    }
    async function review(decision) {
        await run(async () => {
            const result = await reviewRegistration(record.id, decision);
            setRecord(result.registration); setHorseId(result.horseId);
            setNotice(decision.approve ? "Đăng ký đã được phê duyệt." : "Đã gửi yêu cầu bổ sung. Owner có thể chỉnh sửa và gửi lại.");
        });
    }
    const title = horseId ? "Đã phê duyệt đăng ký" : record.status === REGISTRATION_STATUS.RevisionRequired
        ? "Đã gửi yêu cầu bổ sung" : "Kiểm tra hồ sơ — " + (record.registrationNumber || record.id);
    const certificateName = attachments.find((item) => item.type === "Certificate")?.fileName;
    return <div className="hrcms-manager-review-content">
        <header className="hrcms-registration-heading">
            <h1>{title}</h1>
            <p>{record.name || "Ngựa chưa đặt tên"} · Owner: {record.ownerId || "—"}
                {record.createdAt ? " · Tạo " + record.createdAt.slice(0, 10) : ""}</p>
        </header>
        <div className="hrcms-manager-review-status"><RegistrationStatus status={record.status} /></div>
        {!((mode === "approve" || mode === "revision") && allowed) && <RegistrationError error={error} />}
        {notice && <p className="hrcms-registration-info" role="status">{notice}</p>}
        <ApprovalResult horseId={horseId} />
        {pending && <p className="hrcms-registration-pending" role="status">Đang lưu quyết định kiểm tra...</p>}
        {uncertain && <div className="hrcms-registration-review-reason" role="alert">
            <p>Cần kiểm tra trạng thái hiện tại trước khi thực hiện thao tác khác. Tải lại sẽ bỏ thay đổi chưa lưu và nội dung xác nhận.</p>
            <button type="button" className="hrcms-registration-button hrcms-registration-button-outline" onClick={reload}>Tải lại hồ sơ</button>
        </div>}
        {!canReview(record.status) && <p className="hrcms-manager-readonly">Hồ sơ này chỉ đọc trong luồng kiểm tra của Club Manager.</p>}
        <RegistrationSummary record={record}
            attachments={<RegistrationAttachments registrationId={record.id} attachments={attachments} editable={false} manager />}
            editControl={allowed && mode !== "edit" && <button type="button" className="hrcms-manager-edit-trigger" disabled={pending || !!mode}
                onClick={() => setMode("edit")}>Chỉnh sửa thông tin</button>}
            editForm={allowed && mode === "edit" && <ManagerEditForm record={record} busy={pending} onSave={save} onDiscard={() => setMode(null)} />} />
        <div className="hrcms-registration-actions hrcms-manager-review-actions" aria-label="Thao tác kiểm tra hồ sơ">
            <Link to="/management/registrations" className="hrcms-registration-button hrcms-registration-button-outline">Về danh sách</Link>
            {allowed && mode !== "edit" && <>
                <button type="button" className="hrcms-registration-button hrcms-registration-button-save" disabled={pending || !!mode}
                    onClick={(event) => openDialog("revision", event)}>Yêu cầu bổ sung</button>
                <button type="button" className="hrcms-registration-button hrcms-registration-button-primary" disabled={pending || !!mode}
                    onClick={(event) => openDialog("approve", event)}>Phê duyệt</button>
            </>}
        </div>
        {allowed && (mode === "approve" || mode === "revision") && <ReviewConfirmation key={mode} approve={mode === "approve"}
            busy={pending} requestError={error} returnFocus={dialogTrigger}
            onConfirm={review} onBack={() => setMode(null)} ownerId={record.ownerId}
            managerName={managerName} certificateName={certificateName} />}
    </div>;
}
export default function RegistrationReview() {
    const { id } = useParams();
    const load = useCallback(async () => {
        const [record, attachments] = await Promise.all([getRegistration(id), listAttachments(id)]);
        return { record, attachments };
    }, [id]);
    const resource = useRegistrationResource(load);
    return <section className="hrcms-registration-page hrcms-manager-review" aria-label="Kiểm tra hồ sơ đăng ký">
        {resource.loading && <p role="status">Đang tải hồ sơ kiểm tra...</p>}
        {resource.error && <div className="hrcms-manager-resource-error"><RegistrationError error={resource.error} />
            <button type="button" className="hrcms-registration-button hrcms-registration-button-outline" onClick={resource.reload}>Thử lại hồ sơ</button>
            <Link to="/management/registrations" className="hrcms-registration-button hrcms-registration-button-outline">Về danh sách</Link>
        </div>}
        {resource.data && <RegistrationReviewContent key={id} initialRecord={resource.data.record} attachments={resource.data.attachments} reload={resource.reload} />}
    </section>;
}
