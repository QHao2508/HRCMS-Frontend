import { useEffect, useRef, useState } from "react";
import { revisionReasonError } from "../../services/managerReviewService.js";
import RegistrationError from "./RegistrationError.jsx";

export default function ReviewConfirmation({ approve, busy, requestError, returnFocus, onConfirm, onBack, ownerId, managerName, certificateName }) {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    const dialog = useRef(null);
    useEffect(() => {
        const element = dialog.current;
        const previous = returnFocus || document.activeElement;
        const priorOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        (element?.querySelector("textarea:not(:disabled), button:not(:disabled)") || element)?.focus();
        return () => {
            document.body.style.overflow = priorOverflow;
            requestAnimationFrame(() => {
                if (!element?.isConnected && previous?.isConnected && !previous.disabled) previous.focus();
            });
        };
    }, [returnFocus]);
    useEffect(() => {
        if (busy) dialog.current?.focus();
        else if (document.activeElement === dialog.current) dialog.current?.querySelector("textarea:not(:disabled), button:not(:disabled)")?.focus();
    }, [busy]);
    function keyDown(event) {
        if (event.key === "Escape" && !busy) { event.preventDefault(); onBack(); return; }
        if (event.key !== "Tab") return;
        if (busy) { event.preventDefault(); dialog.current.focus(); return; }
        const controls = [...dialog.current.querySelectorAll("button:not(:disabled), textarea:not(:disabled)")];
        if (!controls.length) { event.preventDefault(); dialog.current.focus(); return; }
        const first = controls[0], last = controls[controls.length - 1];
        if (document.activeElement === dialog.current || !dialog.current.contains(document.activeElement)) {
            event.preventDefault(); (event.shiftKey ? last : first).focus(); return;
        }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    async function submit(event) {
        event.preventDefault();
        if (busy) return;
        const message = approve ? "" : revisionReasonError(reason);
        setError(message);
        if (!message) await onConfirm({ approve, reason: approve ? null : reason });
    }
    return <div className="hrcms-manager-dialog-backdrop">
        <form ref={dialog} onSubmit={submit} onKeyDown={keyDown} noValidate role="dialog" aria-modal="true"
            aria-labelledby="review-confirmation-title" aria-describedby="review-confirmation-description"
            tabIndex={-1} className="hrcms-manager-dialog">
            <div className="hrcms-registration-card">
                <h2 id="review-confirmation-title">{approve ? "Phê duyệt hồ sơ đăng ký?" : "Nội dung gửi cho Owner"}</h2>
                <RegistrationError error={requestError} />
                <fieldset disabled={busy}>
                {approve ? <>
                    <dl className="hrcms-manager-facts">
                        <div><dt>Chủ sở hữu</dt><dd>{ownerId || "—"}</dd></div>
                        <div><dt>Người phê duyệt</dt><dd>{managerName || "—"}</dd></div>
                        <div><dt>Giấy đăng ký đã bổ sung</dt><dd>{certificateName || "—"}</dd></div>
                    </dl>
                    <p id="review-confirmation-description" className="hrcms-manager-dialog-emphasis">Sau khi xác nhận, hệ thống tạo hoặc kích hoạt Horse Profile chính thức.</p>
                    <p className="hrcms-registration-card-description">Phê duyệt tạo hồ sơ ngựa chính thức. Nhân sự đề xuất không được tự động phân công.</p>
                </> : <>
                    <p id="review-confirmation-description" className="hrcms-registration-card-description">Bắt buộc nêu lý do cụ thể để Owner sửa đúng hồ sơ. Yêu cầu bổ sung không phải từ chối.</p>
                    <div className="hrcms-registration-field">
                        <label htmlFor="review-reason">Lý do yêu cầu bổ sung *</label>
                        <textarea id="review-reason" name="reason" className="hrcms-registration-input" maxLength={2000} rows={4}
                            value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }}
                            aria-invalid={!!error} aria-describedby={error ? "review-reason-error" : undefined} placeholder="Nhập thông tin" />
                        {error && <p className="hrcms-registration-field-error" id="review-reason-error" role="alert">{error}</p>}
                    </div>
                    <dl className="hrcms-manager-facts">
                        <div><dt>Người nhận</dt><dd>{ownerId || "—"}</dd></div>
                        <div><dt>Người gửi</dt><dd>{managerName || "—"}</dd></div>
                    </dl>
                </>}
                <div className="hrcms-registration-actions">
                    <button className="hrcms-registration-button hrcms-registration-button-outline" type="button" onClick={onBack}>
                        {approve ? "Quay lại kiểm tra" : "Hủy"}</button>
                    <button className="hrcms-registration-button hrcms-registration-button-primary" type="submit">
                        {busy ? "Đang gửi..." : approve ? "Xác nhận phê duyệt" : "Xác nhận gửi yêu cầu"}</button>
                </div>
                </fieldset>
            </div>
        </form>
    </div>;
}
