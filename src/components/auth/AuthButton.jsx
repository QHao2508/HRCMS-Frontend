export default function AuthButton({ pending, pendingLabel = "Submitting...", children, disabled = false }) {
    return (
        <button type="submit" className="btn btn-primary w-100" disabled={disabled || !!pending}>
            {pending ? pendingLabel : children}
        </button>
    );
}
