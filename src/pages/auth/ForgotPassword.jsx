import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm.jsx";
import AuthInput from "../../components/auth/AuthInput.jsx";
import { useAuthForm } from "../../context/useAuthForm.js";
import { useAuthCooldown } from "../../context/useAuthCooldown.js";
import { forgotPassword } from "../../services/authService.js";
import { getNavigationEmail, validateEmail } from "../../services/authValidation.js";

export default function ForgotPassword() {
    const location = useLocation();
    const form = useAuthForm({ email: getNavigationEmail(location.state) }, validateEmail);
    const cooldown = useAuthCooldown("passwordReset");
    const [message, setMessage] = useState("");

    async function requestCode(values) {
        setMessage("");
        try {
            await forgotPassword(values);
            setMessage("If eligible, a reset code will be emailed.");
        } finally {
            cooldown.start();
        }
    }

    return (
        <AuthForm title="Forgot password" description="Enter your email to request a password reset code."
            form={form} onSubmit={() => { if (!cooldown.seconds) void form.submit(requestCode); }}
            submitLabel={cooldown.seconds ? `Request again in ${cooldown.seconds}s` : "Send reset code"}
            pendingLabel="Requesting code..." submitDisabled={cooldown.seconds > 0} success={message}
            footer={<><p><Link to="/reset-password" state={{ email: form.values.email.trim() }}>Already have a reset code?</Link></p><Link to="/login">Back to sign in</Link></>}>
            <AuthInput label="Email" {...form.field("email")} type="email" required autoComplete="email" />
        </AuthForm>
    );
}
