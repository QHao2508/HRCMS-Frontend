export default function AuthInput({ label, name, error, help, multiline = false, variant = "legacy", ...props }) {
    const id = `auth-${name}`;
    const Input = multiline ? "textarea" : "input";
    const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
    const hrcms = variant === "hrcms";

    return (
        <div className={hrcms ? "hrcms-auth-field" : "mb-3"}>
            <label className={hrcms ? undefined : "form-label"} htmlFor={id}>{label}</label>
            <Input {...props} id={id} name={name}
                className={hrcms ? (error ? "hrcms-auth-control-invalid" : undefined) : `form-control${error ? " is-invalid" : ""}`}
                aria-invalid={!!error} aria-describedby={describedBy} />
            {help && <div className={hrcms ? "hrcms-auth-help" : "form-text"} id={`${id}-help`}>{help}</div>}
            {error && <div className={hrcms ? "hrcms-auth-error" : "invalid-feedback"} id={`${id}-error`}>{error}</div>}
        </div>
    );
}
