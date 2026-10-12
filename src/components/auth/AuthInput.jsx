/**
 * Nối label, input/textarea, trợ giúp và lỗi bằng ID/ARIA; nhận props từ hook form để giữ trường controlled.
 * @param options0 Đối tượng destructuring: { label, name, error, help, multiline = false, ...props }. Các props/callback lấy từ caller.
 */
export default function AuthInput({ label, name, error, help, requiredIndicator = false, multiline = false, ...props }) {
    const id = `auth-${name}`;
    const Input = multiline ? "textarea" : "input";
    const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

    const otp = !multiline && name === "code" && props.maxLength === 6;
    return (
        <div className="mb-3">
            <label className="form-label" htmlFor={id}>{label}{requiredIndicator && <span className="auth-required-marker" aria-hidden="true" />}</label>
            {otp ? <div className="otp-entry">
                <Input {...props} id={id} name={name} className={`form-control${error ? " is-invalid" : ""}`}
                    aria-invalid={!!error} aria-describedby={describedBy} />
                {Array.from({ length: 6 }, (_, index) => <span key={index} aria-hidden="true" className={index === (props.value?.length || 0) ? "otp-active" : ""}>{props.value?.[index] || ""}</span>)}
            </div> : <Input {...props} id={id} name={name} className={`form-control${error ? " is-invalid" : ""}`}
                aria-invalid={!!error} aria-describedby={describedBy} />}
            {help && <div className="form-text" id={`${id}-help`}>{help}</div>}
            {error && <div className={`invalid-feedback${otp ? " d-block" : ""}`} id={`${id}-error`} role="alert">{error}</div>}
        </div>
    );
}
