import { useState } from "react";
import { revisionReasonError } from "../../services/managerReviewService.js";

export default function ReviewConfirmation({ approve, busy, onConfirm, onBack }) {
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");
    async function submit(event) {
        event.preventDefault();
        if (busy) return;
        const message = approve ? "" : revisionReasonError(reason);
        setError(message);
        if (!message) await onConfirm({ approve, reason: approve ? null : reason });
    }
    return <form onSubmit={submit} noValidate className="border rounded p-3 my-3" aria-label="Confirm review decision">
        <fieldset disabled={busy}>
            <legend className="h5">{approve ? "Confirm approval" : "Confirm request for revision"}</legend>
            {approve ? <p>This will approve the registration and create an official Horse. Preferred staff are not automatically assigned.</p>
                : <><p>The Owner will receive this reason and can edit and resubmit the registration.</p>
                    <label className="form-label" htmlFor="review-reason">Revision reason (required)</label>
                    <textarea id="review-reason" name="reason" className="form-control mb-2" maxLength={2000} rows={4} value={reason}
                        onChange={(event) => setReason(event.target.value)} aria-invalid={!!error} aria-describedby={error ? "review-reason-error" : undefined} />
                    {error && <p className="text-danger" id="review-reason-error" role="alert">{error}</p>}
                </>}
            <button className="btn btn-primary me-2" type="submit">{approve ? "Confirm approval" : "Confirm request for revision"}</button>
            <button className="btn btn-outline-secondary" type="button" onClick={onBack}>Back to review</button>
        </fieldset>
    </form>;
}
