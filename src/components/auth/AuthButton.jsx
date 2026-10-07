export default function AuthButton({ pending, pendingLabel = "Submitting...", children, disabled = false,
    variant = "legacy" }) {
    return (
        <button type="submit" className={variant === "hrcms" ? "hrcms-auth-primary-button" : "btn btn-primary w-100"}
            disabled={disabled || !!pending}>
            {pending ? pendingLabel : children}
        </button>
    );
}
