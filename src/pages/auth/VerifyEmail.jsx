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
        ? "Tài khoản đã được tạo. Hãy kiểm tra email để lấy mã xác thực." : "");

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
                setMessage("Nếu tài khoản đủ điều kiện, mã xác thực sẽ được gửi qua email.");
            } finally {
                cooldown.start();
            }
        }, validateEmail, "resend");
    }

    return (
        <AuthForm title="Xác Thực Email" description="Mã OTP đã gửi đến email đăng ký:"
            headingDetail={<div className="hrcms-flow-email">
                <AuthInput variant="hrcms" label="Email" {...form.field("email")}
                    form="auth-flow-form" type="email" required autoComplete="email" disabled={!!form.pending}
                    placeholder="Email của bạn" />
            </div>}
            form={form} onSubmit={() => form.submit(verify)} submitLabel="Xác Nhận & Kích Hoạt"
            pendingLabel={form.pending === "resend" ? "Đang gửi mã..." : "Đang xác thực..."} success={message}
            secondaryAction={<Link to="/login" className="hrcms-auth-secondary-button">Hủy Bỏ</Link>}
            extra={<div className="hrcms-flow-resend">
                <p>Bạn chưa nhận được mã xác thực?</p>
                <button type="button" className="hrcms-flow-outlined-button" onClick={resend}
                    disabled={!!form.pending || cooldown.seconds > 0}>
                    {cooldown.seconds > 0 ? `Gửi lại sau ${cooldown.seconds}s` : "Gửi Lại Mã OTP"}
                </button>
            </div>}>
            <div className="hrcms-otp-field">
                <label htmlFor="auth-code" className="hrcms-visually-hidden">Mã xác thực gồm sáu chữ số</label>
                <div className="hrcms-otp-entry">
                    <input {...form.field("code")} id="auth-code" type="text" required
                        inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                        aria-invalid={!!form.errors.code}
                        aria-describedby={form.errors.code ? "auth-code-error" : undefined} />
                    {Array.from({ length: 6 }, (_, index) => (
                        <span key={index} className={index === Math.min(form.values.code.length, 5) ? "hrcms-otp-active" : ""}
                            aria-hidden="true">{form.values.code[index] || ""}</span>
                    ))}
                </div>
                {form.errors.code && <div className="hrcms-auth-error" id="auth-code-error">{form.errors.code}</div>}
            </div>
        </AuthForm>
    );
}
