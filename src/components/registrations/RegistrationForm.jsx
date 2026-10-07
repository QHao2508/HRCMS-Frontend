import { FORM_SECTIONS } from "../../services/registrationValidation.js";
import { PREFERENCES } from "../../constants/registration.js";
import { listPreferredStaff } from "../../services/registrationService.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";

export default function RegistrationForm({ values, onChange, errors = {}, disabled = false }) {
    const directory = useRegistrationResource(listPreferredStaff);
    function fieldInput(field) {
        const props = { id: `registration-${field.name}`, name: field.name, value: values[field.name],
            onChange, className: `form-control${errors[field.name] ? " is-invalid" : ""}`,
            "aria-invalid": !!errors[field.name], "aria-describedby": errors[field.name] ? `${field.name}-error` : undefined };
        if (field.options) return <select {...props} className="form-select"><option value="">Not specified</option>
            {!field.options.includes(values[field.name]) && values[field.name] && <option value={values[field.name]}>Unsupported saved value</option>}
            {field.options.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>;
        if (field.type === "textarea") return <textarea {...props} rows={3} maxLength={field.maxLength} />;
        return <input {...props} type={field.type || "text"} maxLength={field.maxLength} min={field.min} max={field.max} step={field.type === "number" ? "any" : undefined} />;
    }
    return <>
        {FORM_SECTIONS.map((section) => <fieldset key={section.title} disabled={disabled} className="border rounded p-3 mb-3">
            <legend className="float-none w-auto fs-5 px-2">{section.title}</legend>
            {section.title === "Initial health declaration" && <p className="text-body-secondary">This is your initial declaration, not veterinary clearance.</p>}
            <div className="row g-3">{section.fields.map((field) => <div className="col-12 col-lg-6" key={field.name}>
                <label className="form-label" htmlFor={`registration-${field.name}`}>{field.label}</label>
                {fieldInput(field)}
                {errors[field.name] && <div id={`${field.name}-error`} className="text-danger">{errors[field.name]}</div>}
            </div>)}</div>
        </fieldset>)}
        <fieldset disabled={disabled} className="border rounded p-3 mb-3">
            <legend className="float-none w-auto fs-5 px-2">Preferred staff</legend>
            <p>Preferences are optional requests, not official assignments.</p>
            {directory.loading && <p role="status">Loading staff choices...</p>}
            {directory.error && <div role="alert">Staff choices are unavailable. Saved preferences are retained. <button type="button" className="btn btn-link" onClick={directory.reload}>Retry staff directory</button></div>}
            <div className="row g-3">{PREFERENCES.map(({ field, role, label }) => {
                const options = directory.data?.[role] || [];
                const retained = values[field] && !options.some((person) => person.id === values[field]);
                return <div className="col-12 col-lg-4" key={field}>
                    <label className="form-label" htmlFor={field}>{label}</label>
                    <select className="form-select" id={field} name={field} value={values[field]} onChange={onChange} disabled={directory.loading || !!directory.error}>
                        <option value="">No preference</option>
                        {retained && <option value={values[field]}>Saved preference (not in available choices)</option>}
                        {options.map((person) => <option value={person.id} key={person.id}>{[person.firstName, person.lastName].filter(Boolean).join(" ") || "Staff member"}</option>)}
                    </select>
                </div>;
            })}</div>
        </fieldset>
    </>;
}
