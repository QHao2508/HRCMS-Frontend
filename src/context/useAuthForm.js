import { useRef, useState } from "react";

export function useAuthForm(initialValues, validate) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [pending, setPending] = useState(null);
    const busy = useRef(false);

    function onChange(event) {
        const { name, value } = event.target;
        setValues((previous) => ({ ...previous, [name]: value }));
        setErrors((previous) => ({ ...previous, [name]: "" }));
        setError("");
    }

    async function submit(action, validator = validate, actionName = "submit") {
        if (busy.current) return;
        const nextErrors = validator(values);
        setErrors(nextErrors);
        setError("");
        if (Object.keys(nextErrors).length) return;
        busy.current = true;
        setPending(actionName);
        try {
            await action(values);
        } catch (failure) {
            setError(failure.message || "Unable to complete this request. Please try again.");
        } finally {
            busy.current = false;
            setPending(null);
        }
    }

    function field(name) {
        return { name, value: values[name], onChange, error: errors[name] };
    }

    return { values, errors, error, pending, field, submit };
}
