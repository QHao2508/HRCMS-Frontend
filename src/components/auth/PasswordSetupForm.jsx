import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthForm from "./AuthForm.jsx";
import AuthInput from "./AuthInput.jsx";
import { useAuthForm } from "../../context/useAuthForm.js";
import { acceptInvitation, resetPassword } from "../../services/authService.js";
import { AUTH_POLICY, getNavigationEmail, passwordHelp, validatePasswordSetup } from "../../services/authValidation.js";

export default function PasswordSetupForm({ invitation = false }) {
    const location = useLocation();
    const navigate = useNavigate();
    const form = useAuthForm({ email: getNavigationEmail(location.state), code: "", password: "", confirmPassword: "" }, validatePasswordSetup);

    async function submit(values) {
        if (invitation) await acceptInvitation(values);
        else await resetPassword(values);
        navigate("/login", {
            replace: true,
            state: { email: values.email.trim(), authNotice: invitation ? "invitation-accepted" : "password-reset" },
        });
    }

    return (
        <AuthForm title={invitation ? "Accept staff invitation" : "Reset password"}
            description={invitation
                ? "Use the invitation sent by club management to set your password."
                : "Enter the reset code from your email and choose a new password."}
            form={form} onSubmit={() => form.submit(submit)} submitLabel={invitation ? "Set password" : "Reset password"}
            pendingLabel="Saving password..."
            footer={<>{invitation ? <p>Need an invitation or a replacement code? Contact club management.</p>
                : <p><Link to="/forgot-password" state={{ email: form.values.email.trim() }}>Request a new reset code</Link></p>}
                <Link to="/login">Back to sign in</Link></>}>
            <AuthInput label="Email" {...form.field("email")} type="email" required autoComplete="email" />
            <AuthInput label={invitation ? "Invitation code" : "Reset code"} {...form.field("code")}
                required maxLength={4000} autoComplete="off" spellCheck={false} autoCapitalize="none" />
            <AuthInput label="New password" {...form.field("password")} type="password" required
                maxLength={AUTH_POLICY.passwordMaxLength} autoComplete="new-password" help={passwordHelp} />
            <AuthInput label="Confirm password" {...form.field("confirmPassword")} type="password" required
                maxLength={AUTH_POLICY.passwordMaxLength} autoComplete="new-password" />
        </AuthForm>
    );
}
