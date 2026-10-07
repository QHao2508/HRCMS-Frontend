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
        await run("Saving", async () => { acceptRecord(await updateRegistration(record.id, values)); setNotice("Registration saved."); });
    }
    async function submit() {
        if (dirty || missing.length) return;
        const nextErrors = validateDraft(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        await run("Submitting", async () => {
            acceptRecord(await submitRegistration(record.id));
            setNotice("Submission completed. The current status is shown above.");
        });
    }
    async function cancel() {
        if (!confirmCancel) return;
        await run("Cancelling", async () => {
            acceptRecord(await cancelRegistration(record.id)); setConfirmCancel(false); setNotice("Registration cancelled.");
        });
    }
    async function upload(values) {
        return run("Uploading", async () => {
            await uploadAttachment(record.id, values);
            // Refresh metadata before enabling submission; never invent an attachment.
            try { setAttachments(await listAttachments(record.id)); }
            catch (failure) { setStale(true); throw failure; }
            setNotice("Attachment uploaded.");
        });
    }
    return <>
        <div className="d-flex flex-wrap align-items-center gap-3"><h1>{record.name || "Unnamed registration"}</h1><RegistrationStatus status={record.status} /></div>
        <p className="text-body-secondary">Registration ID: {record.id}</p>
        {record.reviewReason && <div className="alert alert-warning"><strong>Revision reason</strong><p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{record.reviewReason}</p></div>}
        {!canEditRegistration(record.status) && <p>This registration is read-only.</p>}
        <RegistrationError error={error} />
        {notice && <p className="alert alert-success" role="status">{notice}</p>}
        {pending && <p role="status">{pending}...</p>}
        {stale && <div className="alert alert-warning">Refresh the registration before another action. Unsaved form changes will be discarded. <button className="btn btn-outline-primary" onClick={reload}>Reload registration</button></div>}
        <form onSubmit={save} noValidate>
            <RegistrationForm values={values} errors={errors} disabled={!editable || !!pending}
                onChange={(event) => { setValues({ ...values, [event.target.name]: event.target.value }); setNotice(""); }} />
            {editable && <button className="btn btn-primary" type="submit" disabled={!!pending}>Save changes</button>}
        </form>
        <RegistrationAttachments registrationId={record.id} attachments={attachments} editable={editable} busy={!!pending} onUpload={upload} />
        {editable && <section aria-labelledby="registration-actions">
            <h2 id="registration-actions" className="h5">Registration actions</h2>
            {dirty && <p role="status">Save your changes before submitting.</p>}
            {!!missing.length && <div><p>Before submitting, complete the saved registration with:</p><ul>{missing.map((label) => <li key={label}>{label}</li>)}</ul></div>}
            <div className="d-flex flex-wrap gap-2">
                <button type="button" className="btn btn-success" disabled={!!pending || dirty || !!missing.length} onClick={submit}>
                    {record.status === REGISTRATION_STATUS.RevisionRequired ? "Resubmit registration" : "Submit registration"}
                </button>
                <button type="button" className="btn btn-outline-danger" disabled={!!pending} onClick={() => setConfirmCancel(true)}>Cancel registration</button>
            </div>
            {confirmCancel && <div className="alert alert-warning mt-3" role="alert">
                <p>Cancel this registration? It will become read-only. Unsaved changes will be discarded.</p>
                <button type="button" className="btn btn-danger me-2" disabled={!!pending} onClick={cancel}>Confirm cancellation</button>
                <button type="button" className="btn btn-secondary" disabled={!!pending} onClick={() => setConfirmCancel(false)}>Keep registration</button>
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
        <Link to="/registrations">Back to registrations</Link>
        {resource.loading && <p role="status">Loading registration...</p>}
        {resource.error && <><RegistrationError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>Retry</button></>}
        {resource.data && <RegistrationDetailContent key={id} initialRecord={resource.data.record} initialAttachments={resource.data.attachments} reload={resource.reload} />}
    </section>;
}
