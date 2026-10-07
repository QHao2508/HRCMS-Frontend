import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm.jsx";
import AuthInput from "../../components/auth/AuthInput.jsx";
import { useAuthForm } from "../../context/useAuthForm.js";
import { useAuthCooldown } from "../../context/useAuthCooldown.js";
import { resendVerification, verifyEmail } from "../../services/authService.js";
import { getNavigationEmail, validateEmail, validateVerification } from "../../services/authValidation.js";

export default function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();
    const form = useAuthForm({ email: getNavigationEmail(location.state), code: "" }, validateVerification);
    const cooldown = useAuthCooldown("verification");
    const [message, setMessage] = useState(location.state?.registered
        ? "Your account was created. Check your email for a verification code." : "");

    async function verify(values) {
        setMessage("");
        await verifyEmail(values);
        navigate("/login", { replace: true, state: { email: values.email.trim(), authNotice: "email-verified" } });
    }

    function resend() {
        if (cooldown.seconds > 0) return;
        void form.submit(async (values) => {
            setMessage("");
            try {
                await resendVerification(values);
                setMessage("If eligible, a code will be emailed.");
            } finally {
                cooldown.start();
            }
        }, validateEmail, "resend");
    }

    return (
        <AuthForm title="Verify your email" description="Enter your email and the six-digit code from your verification email."
            form={form} onSubmit={() => form.submit(verify)} submitLabel="Verify email"
            pendingLabel={form.pending === "resend" ? "Requesting code..." : "Verifying..."} success={message}
            footer={<Link to="/login">Back to sign in</Link>}>
            <AuthInput label="Email" {...form.field("email")} type="email" required autoComplete="email" />
            <AuthInput label="Verification code" {...form.field("code")} required inputMode="numeric"
                autoComplete="one-time-code" maxLength={6} />
            <button type="button" className="btn btn-outline-secondary mb-3" onClick={resend}
                disabled={!!form.pending || cooldown.seconds > 0}>
                {cooldown.seconds > 0 ? `Resend available in ${cooldown.seconds}s` : "Resend verification code"}
            </button>
        </AuthForm>
    );
}
