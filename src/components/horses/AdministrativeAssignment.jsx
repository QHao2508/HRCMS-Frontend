import { useCallback, useRef, useState } from "react";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { ADMIN_ASSIGNMENT_ROLES, activeForRole, assignmentToday, createAssignmentSubmission, listAssignmentCandidates, validateAssignment, createTrainerSubmission, listTrainerCandidates, validateTrainerAssignment } from "../../services/assignmentService.js";
import HorseError from "./HorseError.jsx";

export function AssignmentForm({ values, setValues, candidates, assignments, busy, onSubmit, trainerOnly = false }) {
    const [errors, setErrors] = useState({});
    const [confirmed, setConfirmed] = useState(false);
    const current = activeForRole(assignments, values.role);
    function change(name, value) {
        setConfirmed(false);
        setValues({ ...values, [name]: value, ...(name === "role" ? { staffId: "" } : {}) });
    }
    function submit(event) {
        event.preventDefault();
        if (busy) return;
        const next = (trainerOnly ? validateTrainerAssignment : validateAssignment)(values, assignments);
        if (candidates.loading || candidates.error || !candidates.data?.some((person) => person.id === values.staffId && person.role === values.role && person.active !== false)) next.staffId = "Choose an eligible staff member.";
        if (!confirmed) next.confirmation = "Confirm the assignment before submitting.";
        setErrors(next);
        if (!Object.keys(next).length) onSubmit(values);
    }
    return <form onSubmit={submit} noValidate className="border rounded p-3 mb-3">
        <fieldset disabled={busy}><legend className="h5">{trainerOnly ? "Assign Trainer" : "Assign official administrative staff"}</legend>
            <p>{trainerOnly ? "Only this Horse's actively assigned HeadTrainer can select its direct Trainer. Owner preferences do not grant assignment authority." : "Owner preferences are not official assignments. Trainer assignment is a separate HeadTrainer responsibility."}</p>
            {trainerOnly ? <p>Assignment role: Trainer</p> : <>
            <label className="form-label" htmlFor="assignment-role">Role</label>
            <select id="assignment-role" className="form-select mb-3" value={values.role} onChange={(event) => change("role", event.target.value)}>
                {ADMIN_ASSIGNMENT_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            </>}
            {current.length ? <div className="alert alert-warning">Current active {values.role}: {current.map((item) => `${item.staffId} (since ${item.startDate})`).join(", ")}. This assignment will replace the current active assignment for this role and preserve its history.</div> : <p>No current active {values.role} assignment.</p>}
            {candidates.loading ? <p role="status">Loading staff candidates...</p> : candidates.error ? <><HorseError error={candidates.error} /><button type="button" className="btn btn-outline-secondary" onClick={candidates.reload}>Retry staff candidates</button></> : <>
                <label className="form-label" htmlFor="assignment-staff">Staff member</label>
                <select id="assignment-staff" className="form-select mb-3" value={values.staffId} onChange={(event) => change("staffId", event.target.value)}>
                    <option value="">Choose staff</option>
                    {(candidates.data || []).filter((person) => person.role === values.role && person.active !== false).map((person) => <option key={person.id} value={person.id}>{`${person.firstName || ""} ${person.lastName || ""}`.trim() || person.id} ({person.id})</option>)}
                </select>
                {!candidates.data?.length && <p>No eligible staff returned for this role.</p>}
            </>}
            <label className="form-label" htmlFor="assignment-start">Start date</label>
            <input id="assignment-start" className="form-control mb-3" type="date" max={assignmentToday()} value={values.startDate} onChange={(event) => change("startDate", event.target.value)} />
            <label className="form-label" htmlFor="assignment-notes">Notes (optional, up to 2000 characters)</label>
            <textarea id="assignment-notes" className="form-control mb-3" maxLength={2000} value={values.notes} onChange={(event) => change("notes", event.target.value)} />
            <label className="form-check-label d-block mb-3"><input className="form-check-input me-2" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                {current.length ? "I confirm replacing the current active assignment for this role." : "I confirm creating this official assignment."}</label>
            {Object.entries(errors).map(([name, message]) => <p role="alert" className="text-danger" key={name}>{message}</p>)}
            <button className="btn btn-primary" disabled={busy || candidates.loading || !!candidates.error} type="submit">{busy ? "Saving assignment..." : trainerOnly ? (current.length ? "Replace Trainer" : "Assign Trainer") : "Save official assignment"}</button>
        </fieldset>
    </form>;
}
export function AssignmentPanel({ data, onUpdated, onReload, trainerOnly = false }) {
    const [values, setValues] = useState({ role: trainerOnly ? "Trainer" : "HeadTrainer", staffId: "", startDate: assignmentToday(), notes: "" });
    const load = useCallback(() => trainerOnly ? listTrainerCandidates() : listAssignmentCandidates(values.role), [values.role, trainerOnly]);
    const candidates = useRegistrationResource(load);
    const submit = useRef(trainerOnly ? createTrainerSubmission() : createAssignmentSubmission());
    const saving = useRef(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);
    async function save(form) {
        if (saving.current || error?.requiresReload) return;
        saving.current = true;
        setBusy(true); setError(null); setSaved(false);
        try {
            const detail = await submit.current(data.horse.id, form);
            if (detail) { onUpdated(detail); setSaved(true); setValues({ ...form, staffId: "", notes: "" }); }
        } catch (failure) { setError(failure); }
        finally { saving.current = false; setBusy(false); }
    }
    return <section aria-label={trainerOnly ? "Trainer assignment" : "Administrative assignment"}>
        {saved && <p role="status" className="alert alert-success">Assignment saved. Official assignments and history have been refreshed.</p>}
        {error && <HorseError error={error.status === 404 ? { message: "The Horse or selected staff member could not be found." } : error.status === 409 ? { message: "The assignment conflicts with the current Horse state. Reload before continuing." } : error} />}
        {error?.requiresReload && <div className="alert alert-warning">The assignment result or current access must be checked before another submission. Reload the Horse profile; do not repeat the request blindly.
            <button className="btn btn-outline-primary ms-2" onClick={onReload}>Reload Horse profile</button></div>}
        <AssignmentForm key={saved ? "saved" : "editing"} trainerOnly={trainerOnly} values={values} setValues={setValues} candidates={candidates} assignments={data.assignments} busy={busy || !!error?.requiresReload} onSubmit={save} />
    </section>;
}
export default function AdministrativeAssignment({ actorRole, ...props }) {
    if (actorRole !== "ClubManager" || !props.data?.horse || props.data.horse.archived) return null;
    return <AssignmentPanel {...props} trainerOnly={false} />;
}
