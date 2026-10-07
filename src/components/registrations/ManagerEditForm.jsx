import { useState } from "react";
import { managerEditForm, validateManagerEdit } from "../../services/managerReviewService.js";

export default function ManagerEditForm({ record, busy, onSave, onDiscard }) {
    const [values, setValues] = useState(() => managerEditForm(record));
    const [errors, setErrors] = useState({});
    async function submit(event) {
        event.preventDefault();
        if (busy) return;
        const next = validateManagerEdit(values, record);
        setErrors(next);
        if (!Object.keys(next).length) await onSave(values);
    }
    return <form onSubmit={submit} noValidate className="border rounded p-3 mb-3">
        <fieldset disabled={busy}><legend className="h5">Edit review details</legend>
            <p>Only administrative details can be changed. A saved boarding end date cannot be cleared in this workflow.</p>
            {[["name", "Horse name", "text", 200], ["registrationNumber", "Registration number", "text", 100],
                ["boardingStart", "Boarding start", "date"], ["boardingEnd", "Boarding end", "date"]].map(([name, label, type, maxLength]) => <div className="mb-3" key={name}>
                <label className="form-label" htmlFor={`manager-${name}`}>{label}</label>
                <input className="form-control" id={`manager-${name}`} name={name} type={type} maxLength={maxLength} value={values[name]}
                    onChange={(event) => setValues({ ...values, [name]: event.target.value })}
                    aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `manager-${name}-error` : undefined} />
                {errors[name] && <p className="text-danger" id={`manager-${name}-error`}>{errors[name]}</p>}
            </div>)}
            <button type="submit" className="btn btn-primary me-2">Save review details</button>
            <button type="button" className="btn btn-outline-secondary" onClick={onDiscard}>Discard edit</button>
        </fieldset>
    </form>;
}
