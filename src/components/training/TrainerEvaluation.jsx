import { useCallback, useRef, useState } from "react";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { emptyTrainerEvaluationForm, validateTrainerEvaluation } from "../../services/trainingSessionModel.js";
import { createSessionMutation, evaluateTrainingSession, getTrainingSession } from "../../services/trainingSessionService.js";
import TrainingSessionError from "./TrainingSessionError.jsx";

export function TrainerEvaluationForm({ busy, onSave, onCancel }) {
    const [values, setValues] = useState({ ...emptyTrainerEvaluationForm });
    const [errors, setErrors] = useState({});
    function change(event) {
        const { name, type, checked, value } = event.target;
        setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    }
    function submit(event) {
        event.preventDefault();
        const next = validateTrainerEvaluation(values);
        setErrors(next);
        if (!Object.keys(next).length) onSave(values);
    }
    return <form className="border rounded p-3 mt-3" onSubmit={submit} noValidate>
        <h3 className="h6">Trainer Evaluation</h3>
        <label className="form-label" htmlFor="evaluation-comment">Comment</label>
        <textarea className={`form-control ${errors.comment ? "is-invalid" : ""}`} id="evaluation-comment" name="comment" rows="4"
            maxLength="4000" value={values.comment} onChange={change} disabled={busy} required />
        {errors.comment && <div className="invalid-feedback">{errors.comment}</div>}
        <div className="form-check mt-3"><input className="form-check-input" id="evaluation-adjust" name="adjustFutureSessions" type="checkbox"
            checked={values.adjustFutureSessions} onChange={change} disabled={busy} />
            <label className="form-check-label" htmlFor="evaluation-adjust">Record that future sessions may need adjustment</label></div>
        <p className="form-text">This stores the Trainer's recommendation. The backend does not automatically change future sessions.</p>
        <button className="btn btn-primary me-2" disabled={busy} type="submit">Submit evaluation</button>
        <button className="btn btn-outline-secondary" disabled={busy} type="button" onClick={onCancel}>Close</button>
    </form>;
}

export function SessionReviewContent({ initialDetail, planDetail, user, canEvaluate, onClose, onEvaluated }) {
    const [detail, setDetail] = useState(initialDetail);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const mutation = useRef(createSessionMutation((operation) => operation()));
    async function save(values) {
        if (busy || error?.requiresReload || !canEvaluate) return;
        setBusy(true); setError(null);
        try {
            const refreshed = await mutation.current(() => evaluateTrainingSession(planDetail, detail, user, values));
            if (refreshed) { setDetail(refreshed); onEvaluated?.(); }
        } catch (failure) { setError(failure); }
        finally { setBusy(false); }
    }
    const { session, result, evaluation } = detail;
    return <section className="border rounded p-3 mb-3" aria-label="Training Session result and evaluation">
        <div className="d-flex justify-content-between gap-2"><div><h2 className="h5">Session result and evaluation</h2>
            <p className="mb-0">Session {session.id} - {session.status}</p></div>
            <button className="btn btn-outline-secondary" disabled={busy} onClick={onClose}>Close</button></div>
        {error && <><TrainingSessionError error={error} />{error.requiresReload && <p className="alert alert-warning mt-2">Reload this plan before attempting another evaluation.</p>}</>}
        {result ? <dl className="row mt-3 mb-0"><div className="col-md-4"><dt>Distance</dt><dd>{result.distanceMetres} m</dd></div>
            <div className="col-md-4"><dt>Time</dt><dd>{result.timeSeconds} seconds</dd></div><div className="col-md-4"><dt>Backend-calculated speed</dt><dd>{result.speedMetresPerSecond} m/s</dd></div>
            <div className="col-md-4"><dt>Heart rate</dt><dd>{result.heartRate ?? "Not recorded"}</dd></div><div className="col-md-4"><dt>Intensity</dt><dd>{result.intensity}</dd></div>
            <div className="col-md-4"><dt>Abnormal observation</dt><dd>{result.abnormalObservation ? "Yes" : "No"}</dd></div>
            <div className="col-12"><dt>WorkRider feedback</dt><dd>{result.feedback}</dd></div></dl>
            : <p className="alert alert-warning mt-3">No result is recorded for this session.</p>}
        {evaluation ? <div className="border-top pt-3 mt-3"><h3 className="h6">Recorded Trainer Evaluation</h3>
            <p>{evaluation.comment}</p><p className="mb-0">Future sessions may need adjustment: <strong>{evaluation.adjustFutureSessions ? "Yes" : "No"}</strong></p>
            <p className="text-body-secondary mb-0">Trainer ID: {evaluation.trainerId}</p></div>
            : canEvaluate && result && <TrainerEvaluationForm busy={busy || !!error?.requiresReload} onSave={save} onCancel={onClose} />}
        {!evaluation && !canEvaluate && <p className="text-body-secondary mt-3 mb-0">No Trainer Evaluation has been recorded.</p>}
    </section>;
}

export default function SessionReview({ session, planDetail, user, canEvaluate, onClose, onEvaluated }) {
    const load = useCallback(() => getTrainingSession(session.id), [session.id]);
    const resource = useRegistrationResource(load);
    if (resource.loading) return <section className="border rounded p-3 mb-3" role="status">Loading session result and evaluation...</section>;
    if (resource.error) return <section className="border rounded p-3 mb-3"><TrainingSessionError error={resource.error} />
        <button className="btn btn-outline-primary me-2" onClick={resource.reload}>Retry session detail</button>
        <button className="btn btn-outline-secondary" onClick={onClose}>Close</button></section>;
    return <SessionReviewContent key={`${resource.data.session.id}:${resource.data.evaluation?.id || "none"}`} initialDetail={resource.data}
        planDetail={planDetail} user={user} canEvaluate={canEvaluate} onClose={onClose} onEvaluated={onEvaluated} />;
}
