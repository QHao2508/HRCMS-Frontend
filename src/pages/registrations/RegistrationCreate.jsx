import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RegistrationForm from "../../components/registrations/RegistrationForm.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";
import { registrationForm, validateDraft } from "../../services/registrationValidation.js";
import { createRegistration } from "../../services/registrationService.js";

export default function RegistrationCreate() {
    const navigate = useNavigate();
    const [values, setValues] = useState(() => registrationForm());
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const lock = useRef(false);
    async function save(event) {
        event.preventDefault();
        if (lock.current) return;
        const nextErrors = validateDraft(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        lock.current = true; setBusy(true); setError(null);
        try {
            const record = await createRegistration(values);
            navigate(`/registrations/${encodeURIComponent(record.id)}`, { replace: true });
        } catch (failure) { setError(failure); }
        finally { lock.current = false; setBusy(false); }
    }
    return <section>
        <Link to="/registrations">Back to registrations</Link><h1 className="mt-3">Create horse registration</h1>
        <p>You can save a partial draft and complete it later. Save first to add attachments.</p>
        <RegistrationError error={error} />
        <form onSubmit={save} noValidate>
            <RegistrationForm values={values} errors={errors} disabled={busy} onChange={(event) => setValues({ ...values, [event.target.name]: event.target.value })} />
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Save draft"}</button>
        </form>
    </section>;
}
