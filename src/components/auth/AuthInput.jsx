/**
 * Nối label, input/textarea, trợ giúp và lỗi bằng ID/ARIA; nhận props từ hook form để giữ trường controlled.
 * @param options0 Đối tượng destructuring: { label, name, error, help, multiline = false, ...props }. Các props/callback lấy từ caller.
 */
export default function AuthInput({ label, name, error, help, multiline = false, ...props }) {
    const id = `auth-${name}`;
    const Input = multiline ? "textarea" : "input";
    const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

    return (
        <div className="mb-3">
            <label className="form-label" htmlFor={id}>{label}</label>
            <Input {...props} id={id} name={name} className={`form-control${error ? " is-invalid" : ""}`}
                aria-invalid={!!error} aria-describedby={describedBy} />
            {help && <div className="form-text" id={`${id}-help`}>{help}</div>}
            {error && <div className="invalid-feedback" id={`${id}-error`}>{error}</div>}
        </div>
    );
}
