import { useState } from "react";
import { TRAINING_INTENSITIES } from "../../constants/training.js";
import { validateSessionResult, validateSkipReason } from "../../services/trainingSessionModel.js";

export function StartSessionConfirmation({ session, busy, onConfirm, onCancel }) {
    return <section className="border rounded p-3 mb-3" aria-label="Start Training Session confirmation">
        <h2 className="h5">Start Training Session</h2>
        <p>Confirm starting session {session.id}, scheduled for <time dateTime={session.scheduledAt}>{session.scheduledAt}</time>.</p>
        <p>The backend checks the early-start window, active plan dates, rider and Horse conflicts, and current medical restrictions. The scheduled time will not be changed.</p>
        <button className="btn btn-primary me-2" disabled={busy} onClick={onConfirm}>Confirm start</button>
        <button className="btn btn-outline-secondary" disabled={busy} onClick={onCancel}>Cancel</button>
    </section>;
}

export function TrainingResultForm({ session, busy, onSave, onCancel }) {
    const [values, setValues] = useState({ distanceMetres: String(session.distanceMetres), timeSeconds: "", heartRate: "",
        intensity: session.intensity, feedback: "", abnormalObservation: false });
    const [errors, setErrors] = useState({});
    function change(name, value) { setValues({ ...values, [name]: value }); }
    function submit(event) {
        event.preventDefault();
        if (busy) return;
        const next = validateSessionResult(values);
        setErrors(next);
        if (!Object.keys(next).length) onSave(values);
    }
    return <form className="border rounded p-3 mb-3" onSubmit={submit} noValidate><fieldset disabled={busy}>
        <legend className="h5">Submit Training Session result</legend>
        <p>Session ID: {session.id}. Speed is calculated by the backend from the submitted distance and time.</p>
        <NumberField name="distanceMetres" label="Actual distance (metres)" value={values.distanceMetres} min="0" max="100000" step="any" onChange={change} />
        <NumberField name="timeSeconds" label="Elapsed time (seconds)" value={values.timeSeconds} min="0.001" max="86400" step="0.001" onChange={change} />
        <NumberField name="heartRate" label="Heart rate (optional)" value={values.heartRate} min="1" max="300" step="1" onChange={change} />
        <label className="form-label" htmlFor="result-intensity">Actual intensity</label>
        <select id="result-intensity" className="form-select mb-3" value={values.intensity} onChange={(event) => change("intensity", event.target.value)}>
            {TRAINING_INTENSITIES.map((intensity) => <option value={intensity} key={intensity}>{intensity}</option>)}
        </select>
        <label className="form-label" htmlFor="result-feedback">Feedback</label>
        <textarea id="result-feedback" className="form-control mb-3" maxLength={4000} value={values.feedback} onChange={(event) => change("feedback", event.target.value)} />
        <label className="form-check-label d-block mb-3"><input className="form-check-input me-2" type="checkbox" checked={values.abnormalObservation}
            onChange={(event) => change("abnormalObservation", event.target.checked)} />I observed an abnormal condition during this session.</label>
        <p className="text-body-secondary">An abnormal observation produces IssueReported. A new medical conflict detected by the backend may also produce IssueReported even when this box is clear.</p>
        {Object.entries(errors).map(([name, message]) => <p className="text-danger" role="alert" key={name}>{message}</p>)}
        <button className="btn btn-primary me-2" disabled={busy}>Submit result</button>
        <button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={onCancel}>Cancel</button>
    </fieldset></form>;
}

export function SkipSessionForm({ session, busy, onSave, onCancel }) {
    const [reason, setReason] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState("");
    function submit(event) {
        event.preventDefault();
        if (busy) return;
        const next = validateSkipReason(reason) || (!confirmed ? "Confirm that this session should be skipped." : "");
        setError(next);
        if (!next) onSave(reason);
    }
    return <form className="border rounded p-3 mb-3" onSubmit={submit} noValidate><fieldset disabled={busy}>
        <legend className="h5">Skip Training Session</legend>
        <p>Session ID: {session.id}. Skipping is a terminal state.</p>
        <label className="form-label" htmlFor="skip-reason">Reason</label>
        <textarea id="skip-reason" className="form-control mb-3" maxLength={2000} value={reason} onChange={(event) => { setReason(event.target.value); setError(""); }} />
        <label className="form-check-label d-block mb-3"><input className="form-check-input me-2" type="checkbox" checked={confirmed}
            onChange={(event) => { setConfirmed(event.target.checked); setError(""); }} />I confirm that this session should be marked Skipped.</label>
        {error && <p className="text-danger" role="alert">{error}</p>}
        <button className="btn btn-danger me-2" disabled={busy}>Confirm skip</button>
        <button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={onCancel}>Cancel</button>
    </fieldset></form>;
}

function NumberField({ name, label, value, onChange, ...input }) {
    return <div className="mb-3"><label className="form-label" htmlFor={`result-${name}`}>{label}</label>
        <input id={`result-${name}`} className="form-control" type="number" value={value} onChange={(event) => onChange(name, event.target.value)} {...input} /></div>;
}
