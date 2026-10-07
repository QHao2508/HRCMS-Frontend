import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm.jsx";
import AuthInput from "../../components/auth/AuthInput.jsx";
import { useAuthForm } from "../../context/useAuthForm.js";
import { startAuthCooldown } from "../../context/useAuthCooldown.js";
import { register } from "../../services/authService.js";
import { AUTH_POLICY, passwordHelp, validateRegistration } from "../../services/authValidation.js";

export default function Register() {
    const navigate = useNavigate();
    const form = useAuthForm({
        firstName: "", lastName: "", userName: "", email: "", phone: "", address: "",
        nationalId: "", password: "", confirmPassword: "",
    }, validateRegistration);

    async function submit(values) {
        const account = await register(values);
        startAuthCooldown("verification");
        navigate("/verify-email", {
            replace: true,
            state: { email: account?.email || values.email.trim(), registered: true },
        });
    }

    return (
        <AuthForm title="Create a Horse Owner account" description="Register your account, then verify your email before signing in."
            form={form} onSubmit={() => form.submit(submit)} submitLabel="Create account" pendingLabel="Creating account..."
            footer={<><Link to="/login">Back to sign in</Link><p className="mt-2">Staff accounts are created by club management. <Link to="/accept-invitation">Accept a staff invitation</Link></p></>}>
            <AuthInput label="First name" {...form.field("firstName")} required maxLength={100} autoComplete="given-name" />
            <AuthInput label="Last name" {...form.field("lastName")} required maxLength={100} autoComplete="family-name" />
            <AuthInput label="Username" {...form.field("userName")} required minLength={3} maxLength={80} autoComplete="username" />
            <AuthInput label="Email" {...form.field("email")} type="email" required maxLength={254} autoComplete="email" />
            <AuthInput label="Phone" {...form.field("phone")} type="tel" required maxLength={30} autoComplete="tel" />
            <AuthInput label="Address" {...form.field("address")} multiline rows={2} required maxLength={500} autoComplete="street-address" />
            <AuthInput label={`National ID${AUTH_POLICY.requireNationalId ? "" : " (optional)"}`} {...form.field("nationalId")}
                required={AUTH_POLICY.requireNationalId} inputMode="numeric" maxLength={AUTH_POLICY.nationalIdDigits}
                autoComplete="off" help={`If supplied, enter exactly ${AUTH_POLICY.nationalIdDigits} digits.`} />
            <AuthInput label="Password" {...form.field("password")} type="password" required
                maxLength={AUTH_POLICY.passwordMaxLength} autoComplete="new-password" help={passwordHelp} />
            <AuthInput label="Confirm password" {...form.field("confirmPassword")} type="password" required
                maxLength={AUTH_POLICY.passwordMaxLength} autoComplete="new-password" />
        </AuthForm>
    );
}
