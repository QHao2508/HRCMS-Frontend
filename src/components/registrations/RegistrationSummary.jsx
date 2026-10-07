import { FORM_SECTIONS } from "../../services/registrationValidation.js";
import { PREFERENCES } from "../../constants/registration.js";

export default function RegistrationSummary({ record }) {
    return <>
        {FORM_SECTIONS.map(({ title, fields }) => <section className="border rounded p-3 mb-3" key={title}>
            <h2 className="h5">{title}</h2>
            {title === "Initial health declaration" && <p>This is the Owner's declaration, not official medical clearance.</p>}
            <dl className="row mb-0">{fields.map(({ name, label }) => <div className="col-12 col-lg-6" key={name}>
                <dt>{label}</dt><dd style={{ whiteSpace: "pre-wrap" }}>{record[name] == null || record[name] === "" ? "Not provided" : String(record[name])}</dd>
            </div>)}</dl>
        </section>)}
        <section className="border rounded p-3 mb-3"><h2 className="h5">Owner and preferred staff</h2>
            <p>Preferences are requests, not official assignments. Approval does not assign staff.</p>
            <dl><dt>Owner ID</dt><dd>{record.ownerId || "Not provided"}</dd>
                {PREFERENCES.map(({ field, label }) => <div key={field}><dt>{label} ID</dt><dd>{record[field] || "No preference"}</dd></div>)}
            </dl>
        </section>
    </>;
}
