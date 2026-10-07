import { useCallback, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getRegistration } from "../../services/registrationService.js";
import { listAttachments } from "../../services/registrationAttachments.js";
import { canReview, saveManagerEdit, reviewRegistration, isUncertainReviewError } from "../../services/managerReviewService.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import RegistrationSummary from "../../components/registrations/RegistrationSummary.jsx";
import RegistrationAttachments from "../../components/registrations/RegistrationAttachments.jsx";
import RegistrationStatus from "../../components/registrations/RegistrationStatus.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";
import ManagerEditForm from "../../components/registrations/ManagerEditForm.jsx";
import ReviewConfirmation from "../../components/registrations/ReviewConfirmation.jsx";

export function ApprovalResult({ horseId }) {
    if (!horseId) return null;
    return <div className="alert alert-success"><strong>Official Horse ID: {horseId}</strong><p>Staff preferences remain requests; no official assignments were made.</p>
        <Link to={`/horses/${encodeURIComponent(horseId)}`} className="btn btn-outline-success">View Horse profile</Link></div>;
}

export function RegistrationReviewContent({ initialRecord, attachments, reload }) {
    const [record, setRecord] = useState(initialRecord);
    const [horseId, setHorseId] = useState(null);
    const [mode, setMode] = useState(null);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState("");
    const [pending, setPending] = useState(false);
    const [uncertain, setUncertain] = useState(false);
    const lock = useRef(false);
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
        await run(async () => { setRecord(await saveManagerEdit(record.id, values)); setNotice("Review details saved. The latest registration is shown below."); });
    }
    async function review(decision) {
        await run(async () => {
            const result = await reviewRegistration(record.id, decision);
            setRecord(result.registration); setHorseId(result.horseId);
            setNotice(decision.approve ? "Registration approved. An official Horse has been created." : "Revision requested. The Owner can edit and resubmit.");
        });
    }
    return <>
        <div className="d-flex flex-wrap align-items-center gap-3 mt-3"><h1>{record.name || "Unnamed registration"}</h1><RegistrationStatus status={record.status} /></div>
        <p>Registration ID: {record.id}</p>
        {record.createdAt && <p>Created: {record.createdAt.slice(0, 10)}</p>}
        {record.reviewReason && <div className="alert alert-warning"><strong>Revision reason</strong><p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{record.reviewReason}</p></div>}
        <RegistrationError error={error} />
        {notice && <p className="alert alert-success" role="status">{notice}</p>}
        <ApprovalResult horseId={horseId} />
        {pending && <p role="status">Saving review action...</p>}
        {uncertain && <div className="alert alert-warning" role="alert">The current state must be checked before another action. Reloading discards unsaved edits and confirmation text. <button className="btn btn-outline-primary" onClick={reload}>Reload registration</button></div>}
        {!canReview(record.status) && <p>This registration is read-only for Manager review.</p>}
        {allowed && <section aria-label="Manager review actions" className="mb-3">
            {!mode && <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-outline-primary" disabled={pending} onClick={() => setMode("edit")}>Edit review details</button>
                <button className="btn btn-outline-warning" disabled={pending} onClick={() => setMode("revision")}>Request revision</button>
                <button className="btn btn-success" disabled={pending} onClick={() => setMode("approve")}>Approve registration</button>
            </div>}
            {mode === "edit" && <ManagerEditForm record={record} busy={pending} onSave={save} onDiscard={() => setMode(null)} />}
            {(mode === "approve" || mode === "revision") && <ReviewConfirmation key={mode} approve={mode === "approve"} busy={pending} onConfirm={review} onBack={() => setMode(null)} />}
        </section>}
        <RegistrationSummary record={record} />
        <RegistrationAttachments registrationId={record.id} attachments={attachments} editable={false} />
    </>;
}
export default function RegistrationReview() {
    const { id } = useParams();
    const load = useCallback(async () => {
        const [record, attachments] = await Promise.all([getRegistration(id), listAttachments(id)]);
        return { record, attachments };
    }, [id]);
    const resource = useRegistrationResource(load);
    return <section>
        <Link to="/management/registrations">Back to review queue</Link>
        {resource.loading && <p role="status">Loading registration review...</p>}
        {resource.error && <><RegistrationError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>Retry registration</button></>}
        {resource.data && <RegistrationReviewContent key={id} initialRecord={resource.data.record} attachments={resource.data.attachments} reload={resource.reload} />}
    </section>;
}
