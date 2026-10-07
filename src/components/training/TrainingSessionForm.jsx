import { useState } from "react";
import { TRAINING_INTENSITIES, TRAINING_TYPES } from "../../constants/training.js";
import { sessionForm, sessionMedicalBlocks, validateSession } from "../../services/trainingSessionModel.js";

export default function TrainingSessionForm({ detail, session, candidates, busy, onSave, onCancel }) {
    const [values, setValues] = useState(() => sessionForm(session));
    const [errors, setErrors] = useState({});
    const blocks = sessionMedicalBlocks(detail.horseDetail, detail.restrictions, values);
    function change(name, value) { setValues({ ...values, [name]: value }); }
    async function submit(event) {
        event.preventDefault();
        if (busy || candidates.loading || candidates.error) return;
        const next = validateSession(values);
        const selected = values.riderId ? candidates.data?.find((person) => person.id === values.riderId && person.role === "WorkRider") : null;
        if (values.riderId && !selected) next.riderId = "Choose an eligible active WorkRider.";
        if (blocks.length) next.medical = "This session is blocked by the current health status or an applicable medical restriction.";
        setErrors(next);
        if (!Object.keys(next).length) await onSave(values, selected);
    }
    return <form onSubmit={submit} noValidate className="border rounded p-3 mb-3">
        <fieldset disabled={busy}><legend className="h5">{session ? "Edit Training Session" : "Create Training Session"}</legend>
            {session && <p>Horse ID: {session.horseId}<br />Plan ID: {session.planId}. These identities cannot be changed.</p>}
            <label className="form-label" htmlFor="session-scheduled">Scheduled date and time</label>
            <input id="session-scheduled" className="form-control mb-3" type="datetime-local" step="1" value={values.scheduledAt} onChange={(event) => change("scheduledAt", event.target.value)} />
            <p className="text-body-secondary">The selected browser-local time is sent as its exact ISO instant. The backend applies the club timezone, plan dates, scheduling grace, and exact timestamp conflicts.</p>
            <Choice name="trainingType" label="Training type" value={values.trainingType} values={TRAINING_TYPES} onChange={change} />
            <label className="form-label" htmlFor="session-distance">Distance (metres)</label>
            <input id="session-distance" className="form-control mb-3" type="number" min="1" max="100000" step="any" value={values.distanceMetres} onChange={(event) => change("distanceMetres", event.target.value)} />
            <Choice name="intensity" label="Intensity" value={values.intensity} values={TRAINING_INTENSITIES} onChange={change} />
            <Field name="surface" label="Surface" value={values.surface} onChange={change} />
            <Field name="target" label="Target" value={values.target} onChange={change} />
            <Field name="notes" label="Notes (optional)" value={values.notes} onChange={change} textarea />
            {candidates.loading ? <p role="status">Loading WorkRider candidates...</p> : candidates.error ? <p role="alert" className="text-danger">Unable to load eligible WorkRiders.</p> : <>
                <label className="form-label" htmlFor="session-rider">WorkRider (optional)</label>
                <select id="session-rider" className="form-select mb-3" value={values.riderId} onChange={(event) => change("riderId", event.target.value)}>
                    <option value="">Leave unassigned</option>
                    {(candidates.data || []).filter((person) => person.role === "WorkRider").map((person) => <option value={person.id} key={person.id}>{displayPerson(person)}</option>)}
                </select>
            </>}
            {blocks.length > 0 && <div className="alert alert-danger" aria-label="Medical session blocks"><strong>Session blocked</strong>
                <ul className="mb-0">{blocks.map((block, index) => <li key={`${block.code}-${block.restriction?.id || index}`}>{block.message}</li>)}</ul>
                <p className="mb-0">There is no medical override. Change the session to comply or ask authorized medical staff to manage the source record.</p>
            </div>}
            {Object.entries(errors).map(([name, message]) => <p className="text-danger" role="alert" key={name}>{message}</p>)}
            <button className="btn btn-primary me-2" type="submit" disabled={busy || candidates.loading || !!candidates.error || blocks.length > 0}>{busy ? "Saving..." : "Save Training Session"}</button>
            <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>Cancel</button>
        </fieldset>
    </form>;
}

export function RiderAssignmentForm({ session, candidates, busy, onSave, onCancel }) {
    const [riderId, setRiderId] = useState("");
    const [error, setError] = useState("");
    function submit(event) {
        event.preventDefault();
        if (busy || candidates.loading || candidates.error) return;
        const rider = candidates.data?.find((person) => person.id === riderId && person.role === "WorkRider");
        if (!rider) { setError("Choose an eligible active WorkRider."); return; }
        onSave(rider);
    }
    return <form className="border rounded p-3 mb-3" onSubmit={submit} noValidate><fieldset disabled={busy}>
        <legend className="h5">{session.riderId ? "Change assigned WorkRider" : "Assign WorkRider"}</legend>
        <p>Session ID: {session.id}. Assignment keeps every other session field unchanged.</p>
        {candidates.loading ? <p role="status">Loading WorkRider candidates...</p> : candidates.error ? <p role="alert" className="text-danger">Unable to load eligible WorkRiders.</p> : <>
            <label className="form-label" htmlFor="assign-session-rider">WorkRider</label>
            <select id="assign-session-rider" className="form-select mb-3" value={riderId} onChange={(event) => { setRiderId(event.target.value); setError(""); }}>
                <option value="">Choose WorkRider</option>{(candidates.data || []).filter((person) => person.role === "WorkRider").map((person) => <option value={person.id} key={person.id}>{displayPerson(person)}</option>)}
            </select>
        </>}
        {error && <p role="alert" className="text-danger">{error}</p>}
        <button className="btn btn-primary me-2" disabled={busy || candidates.loading || !!candidates.error}>Confirm rider assignment</button>
        <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>Cancel</button>
    </fieldset></form>;
}

function displayPerson(person) { return `${person.firstName || ""} ${person.lastName || ""}`.trim() || person.id; }
function Choice({ name, label, value, values, onChange }) {
    return <div className="mb-3"><label className="form-label" htmlFor={`session-${name}`}>{label}</label>
        <select id={`session-${name}`} className="form-select" value={value} onChange={(event) => onChange(name, event.target.value)}>
            <option value="">Choose {label.toLowerCase()}</option>{values.map((item) => <option key={item} value={item}>{item}</option>)}
        </select></div>;
}
function Field({ name, label, value, onChange, textarea = false }) {
    const props = { id: `session-${name}`, className: "form-control", maxLength: 4000, value, onChange: (event) => onChange(name, event.target.value) };
    return <div className="mb-3"><label className="form-label" htmlFor={props.id}>{label}</label>{textarea ? <textarea {...props} /> : <input {...props} />}</div>;
}
