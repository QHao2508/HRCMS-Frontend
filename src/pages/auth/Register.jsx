import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import AuthButton from "../../components/auth/AuthButton.jsx";
import AuthInput from "../../components/auth/AuthInput.jsx";
import { useAuthForm } from "../../context/useAuthForm.js";
import { startAuthCooldown } from "../../context/useAuthCooldown.js";
import { register } from "../../services/authService.js";
import { AUTH_POLICY, passwordHelp, validateRegistration } from "../../services/authValidation.js";
import "../../style/auth.css";

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

    const footerActions = (
        <details className="hrcms-auth-more-actions">
            <summary>Tùy chọn nhân viên</summary>
            <nav aria-label="Staff account actions">
                <Link to="/accept-invitation">Accept a staff invitation</Link>
            </nav>
        </details>
    );

    return (
        <AuthLayout footerActions={footerActions}>
            <section className="hrcms-register-card" aria-labelledby="register-title">
                <div className="hrcms-register-heading">
                    <h1 id="register-title">Đăng Ký Tài Khoản Chủ Sở Hữu (Horse Owner)</h1>
                    <p>Dành cho Chủ sở hữu ngựa / Khách hàng. Nhân viên nội bộ dùng tài khoản do Club Manager cấp. Đăng ký ngựa là một quy trình riêng.</p>
                </div>

                <div className="hrcms-auth-alert hrcms-auth-alert-warning" role="note">
                    <img src="/figma/auth/warning.svg" alt="" />
                    <span>CCCD không bắt buộc. Nếu cung cấp, hãy nhập thông tin hợp lệ.</span>
                </div>

                {form.error && (
                    <div className="hrcms-auth-alert hrcms-auth-alert-error" role="alert">{form.error}</div>
                )}
                {!form.error && Object.values(form.errors).some(Boolean) && (
                    <div className="hrcms-auth-alert hrcms-auth-alert-error" role="alert">
                        Please check the highlighted fields.
                    </div>
                )}

                <form className="hrcms-register-form" noValidate aria-busy={!!form.pending}
                    onSubmit={(event) => { event.preventDefault(); void form.submit(submit); }}>
                    <fieldset className="hrcms-register-fieldset" disabled={!!form.pending}>
                        <div className="hrcms-register-grid">
                            <div className="hrcms-register-row">
                                <AuthInput variant="hrcms" label="Họ *" {...form.field("lastName")}
                                    required maxLength={100} autoComplete="family-name" placeholder="Nhập thông tin" />
                                <AuthInput variant="hrcms" label="Tên *" {...form.field("firstName")}
                                    required maxLength={100} autoComplete="given-name" placeholder="Nhập thông tin" />
                            </div>
                            <div className="hrcms-register-row">
                                <AuthInput variant="hrcms" label="Tên đăng nhập *" {...form.field("userName")}
                                    required minLength={3} maxLength={80} autoComplete="username" placeholder="Nhập thông tin" />
                                <AuthInput variant="hrcms" label="Địa chỉ Email liên hệ *" {...form.field("email")}
                                    type="email" required maxLength={254} autoComplete="email" placeholder="Nhập thông tin" />
                            </div>
                            <div className="hrcms-register-row">
                                <AuthInput variant="hrcms" label="Số điện thoại di động *" {...form.field("phone")}
                                    type="tel" required maxLength={30} autoComplete="tel" placeholder="Nhập thông tin" />
                                <AuthInput variant="hrcms"
                                    label={AUTH_POLICY.requireNationalId ? "Số CCCD *" : "Số CCCD (không bắt buộc)"}
                                    {...form.field("nationalId")} required={AUTH_POLICY.requireNationalId}
                                    inputMode="numeric" maxLength={AUTH_POLICY.nationalIdDigits}
                                    autoComplete="off" placeholder="Nhập thông tin"
                                    help={`If supplied, enter exactly ${AUTH_POLICY.nationalIdDigits} digits.`} />
                            </div>
                            <div className="hrcms-register-row">
                                <AuthInput variant="hrcms" label="Địa chỉ thường trú *" {...form.field("address")}
                                    multiline rows={2} required maxLength={500} autoComplete="street-address"
                                    placeholder="Nhập thông tin" />
                            </div>
                            <div className="hrcms-register-row">
                                <AuthInput variant="hrcms" label="Mật khẩu bảo mật *" {...form.field("password")}
                                    type="password" required maxLength={AUTH_POLICY.passwordMaxLength}
                                    autoComplete="new-password" placeholder="••••••••••••" help={passwordHelp} />
                                <AuthInput variant="hrcms" label="Xác nhận mật khẩu *" {...form.field("confirmPassword")}
                                    type="password" required maxLength={AUTH_POLICY.passwordMaxLength}
                                    autoComplete="new-password" placeholder="••••••••••••" />
                            </div>
                        </div>

                        <div className="hrcms-register-divider">
                            <img src="/figma/auth/register-divider.svg" alt="" />
                        </div>

                        <div className="hrcms-register-actions">
                            <Link to="/login" className="hrcms-auth-secondary-button">Quay Lại Đăng Nhập</Link>
                            <AuthButton variant="hrcms" pending={!!form.pending} pendingLabel="Creating account...">
                                Tiếp Tục &amp; Xác Thực Email
                            </AuthButton>
                        </div>
                    </fieldset>
                </form>
            </section>
        </AuthLayout>
    );
}
