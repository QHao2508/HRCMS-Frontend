import { useState } from "react";
import { TRAINING_INTENSITIES } from "../../constants/training.js";
import { templateForm, validateTemplate } from "../../services/trainingTemplateService.js";

export default function TrainingTemplateForm({ template, busy, onSave, onCancel }) {
    const [values, setValues] = useState(() => templateForm(template));
    const [errors, setErrors] = useState({});
    function change(name, value) { setValues({ ...values, [name]: value }); }
    async function submit(event) {
        event.preventDefault();
        if (busy) return;
        const next = validateTemplate(values);
        setErrors(next);
        if (!Object.keys(next).length) await onSave(values);
    }
    const fields = [
        ["name", "Template name", "text", 200],
        ["goal", "Training goal", "textarea", 4000],
        ["phase", "Training phase", "text", 4000],
        ["distanceMetres", "Typical distance (metres)", "number"],
        ["surface", "Surface", "text", 4000],
        ["frequencyPerWeek", "Recommended frequency per week", "number"],
        ["notes", "Notes (optional)", "textarea", 4000],
    ];
    return <form onSubmit={submit} noValidate className="border rounded p-3 mb-3">
        <fieldset disabled={busy}><legend className="h5">{template ? "Edit Training Template" : "Create Training Template"}</legend>
            <p>Templates are reusable references. Saving one does not create a Training Plan or generate Training Sessions.</p>
            {fields.slice(0, 4).map(([name, label, type, maxLength]) => <Field key={name} {...{ name, label, type, maxLength, values, errors, change }} />)}
            <div className="mb-3"><label className="form-label" htmlFor="template-intensity">Typical intensity</label>
                <select id="template-intensity" className="form-select" value={values.intensity} onChange={(event) => change("intensity", event.target.value)}>
                    {TRAINING_INTENSITIES.map((value) => <option value={value} key={value}>{value}</option>)}
                </select>{errors.intensity && <p className="text-danger">{errors.intensity}</p>}</div>
            {fields.slice(4).map(([name, label, type, maxLength]) => <Field key={name} {...{ name, label, type, maxLength, values, errors, change }} />)}
            <button className="btn btn-primary me-2" type="submit">{busy ? "Saving..." : "Save template"}</button>
            <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>Cancel</button>
        </fieldset>
    </form>;
}

function Field({ name, label, type, maxLength, values, errors, change }) {
    const props = { id: `template-${name}`, className: "form-control", value: values[name], maxLength,
        onChange: (event) => change(name, event.target.value), "aria-invalid": !!errors[name] };
    if (type === "number") {
        props.type = "number"; props.step = name === "frequencyPerWeek" ? "1" : "any";
        props.min = "1"; props.max = name === "frequencyPerWeek" ? "21" : "100000";
    }
    return <div className="mb-3"><label className="form-label" htmlFor={props.id}>{label}</label>
        {type === "textarea" ? <textarea {...props} /> : <input {...props} type={props.type || type} />}
        {errors[name] && <p className="text-danger" role="alert">{errors[name]}</p>}</div>;
}
