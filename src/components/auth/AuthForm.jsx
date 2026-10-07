import AuthButton from "./AuthButton.jsx";
import AuthLayout from "./AuthLayout.jsx";
import "../../style/auth.css";

export default function AuthForm({ title, description, headingDetail, form, onSubmit, submitLabel,
    pendingLabel, success, children, notice, extra, secondaryAction, footerActions,
    submitDisabled = false, className = "" }) {
    return (
        <AuthLayout footerActions={footerActions} contentSized>
            <section className={`hrcms-flow-card ${className}`.trim()} aria-labelledby="auth-flow-title">
                <div className="hrcms-flow-heading">
                    <h1 id="auth-flow-title">{title}</h1>
                    <p>{description}</p>
                    {headingDetail}
                </div>

                {form.error && <div className="hrcms-auth-alert hrcms-auth-alert-error" role="alert">{form.error}</div>}
                {!form.error && Object.values(form.errors).some(Boolean) && (
                    <div className="hrcms-auth-alert hrcms-auth-alert-error" role="alert">
                        Please check the highlighted fields.
                    </div>
                )}
                {success && (
                    <div className="hrcms-auth-alert hrcms-auth-alert-info" role="status">
                        <img src="/figma/auth/info.svg" alt="" />
                        <span>{success}</span>
                    </div>
                )}

                <form id="auth-flow-form" noValidate aria-busy={!!form.pending}
                    onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
                    <fieldset className="hrcms-flow-fieldset" disabled={!!form.pending}>
                        <div className="hrcms-flow-fields">{children}</div>
                        {notice}
                        {extra}
                        <div className="hrcms-flow-divider" aria-hidden="true">
                            <img src="/figma/auth/flow-divider.svg" alt="" />
                        </div>
                        <div className="hrcms-flow-actions">
                            {secondaryAction}
                            <AuthButton variant="hrcms" pending={!!form.pending}
                                pendingLabel={pendingLabel} disabled={submitDisabled}>
                                {submitLabel}
                            </AuthButton>
                        </div>
                    </fieldset>
                </form>
            </section>
        </AuthLayout>
    );
}
