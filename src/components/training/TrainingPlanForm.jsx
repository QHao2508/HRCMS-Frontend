import { useState } from "react";
import { planForm, validatePlan } from "../../services/trainingPlanService.js";

export default function TrainingPlanForm({ plan, horses = [], templates = [], busy, onSave, onCancel }) {
    const [values, setValues] = useState(() => planForm(plan));
    const [errors, setErrors] = useState({});
    const editing = !!plan;
    function change(name, value) { setValues({ ...values, [name]: value }); }
    async function submit(event) {
        event.preventDefault();
        if (busy) return;
        const complete = editing ? { ...values, horseId: plan.horseId, templateId: plan.templateId } : values;
        const next = validatePlan(complete);
        if (!editing && !horses.some((horse) => horse.id === values.horseId)) next.horseId = "Choose an assigned Horse.";
        if (!editing && !templates.some((template) => template.id === values.templateId && template.archived === false))
            next.templateId = "Choose an active Training Template.";
        setErrors(next);
        if (!Object.keys(next).length) await onSave(complete);
    }
    return <form onSubmit={submit} noValidate className="border rounded p-3 mb-3">
        <fieldset disabled={busy}><legend className="h5">{editing ? "Edit Training Plan" : "Create Training Plan"}</legend>
            <p>A Training Template is a reference. Creating this plan does not generate Training Sessions.</p>
            {editing ? <dl className="row"><dt className="col-sm-3">Horse ID</dt><dd className="col-sm-9">{plan.horseId}</dd>
                <dt className="col-sm-3">Template ID</dt><dd className="col-sm-9">{plan.templateId}</dd></dl> : <>
                <Choice name="horseId" label="Horse" value={values.horseId} error={errors.horseId} onChange={change}
                    options={horses.map((horse) => ({ value: horse.id, label: `${horse.name || "Unnamed Horse"} (${horse.id})` }))} empty="Choose an assigned Horse" />
                <Choice name="templateId" label="Training Template" value={values.templateId} error={errors.templateId} onChange={change}
                    options={templates.filter((template) => template.archived === false).map((template) => ({ value: template.id, label: `${template.name} (${template.id})` }))} empty="Choose an active template" />
            </>}
            <Field name="goal" label="Training goal" type="textarea" value={values.goal} error={errors.goal} onChange={change} />
            <Field name="phase" label="Training phase" value={values.phase} error={errors.phase} onChange={change} />
            <Field name="startDate" label="Start date" type="date" value={values.startDate} error={errors.startDate} onChange={change} />
            <Field name="endDate" label="End date" type="date" value={values.endDate} error={errors.endDate} onChange={change} />
            <Field name="notes" label="Notes (optional)" type="textarea" value={values.notes} error={errors.notes} onChange={change} />
            {editing && <p className="text-body-secondary">Horse and template cannot be changed. The backend will reject dates that exclude any existing session.</p>}
            <button className="btn btn-primary me-2" type="submit">{busy ? "Saving..." : "Save Training Plan"}</button>
            <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>Cancel</button>
        </fieldset>
    </form>;
}

function Choice({ name, label, value, error, onChange, options, empty }) {
    return <div className="mb-3"><label className="form-label" htmlFor={`plan-${name}`}>{label}</label>
        <select id={`plan-${name}`} className="form-select" value={value} onChange={(event) => onChange(name, event.target.value)}>
            <option value="">{empty}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>{error && <p className="text-danger" role="alert">{error}</p>}</div>;
}

function Field({ name, label, type = "text", value, error, onChange }) {
    const props = { id: `plan-${name}`, className: "form-control", value, maxLength: ["goal", "phase", "notes"].includes(name) ? 4000 : undefined,
        onChange: (event) => onChange(name, event.target.value), "aria-invalid": !!error };
    return <div className="mb-3"><label className="form-label" htmlFor={props.id}>{label}</label>
        {type === "textarea" ? <textarea {...props} /> : <input {...props} type={type} />}
        {error && <p className="text-danger" role="alert">{error}</p>}</div>;
}
