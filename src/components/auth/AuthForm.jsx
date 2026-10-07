import PublicLayout from "../../layouts/PublicLayout.jsx";
import AuthButton from "./AuthButton.jsx";

export default function AuthForm({ title, description, form, onSubmit, submitLabel, pendingLabel,
    success, children, footer, submitDisabled = false }) {
    return (
        <PublicLayout><main className="auth-page">
            <div className="auth-card">
                <h1>{title}</h1>
                <p>{description}</p>
                {form.error && <div className="alert alert-danger" role="alert">{form.error}</div>}
                {!form.error && Object.values(form.errors).some(Boolean) && (
                    <div className="alert alert-danger" role="alert">Please check the highlighted fields.</div>
                )}
                {success && <div className="alert alert-success" role="status">{success}</div>}
                <form noValidate aria-busy={!!form.pending} onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
                    <fieldset disabled={!!form.pending}>
                        {children}
                        <AuthButton pending={!!form.pending} pendingLabel={pendingLabel} disabled={submitDisabled}>
                            {submitLabel}
                        </AuthButton>
                    </fieldset>
                </form>
                <div className="mt-3">{footer}</div>
            </div>
        </main></PublicLayout>
    );
}
