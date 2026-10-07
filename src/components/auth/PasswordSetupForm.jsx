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
        <AuthForm title={invitation ? "Thiết Lập Tài Khoản Nhân Viên" : "Thiết Lập Mật Khẩu Mới"}
            description={invitation
                ? "Nhập email và mã mời để tự thiết lập mật khẩu."
                : "Thiết lập mật khẩu mới cho tài khoản của bạn."}
            form={form} onSubmit={() => form.submit(submit)} submitLabel="Lưu & Về Đăng Nhập"
            pendingLabel="Đang lưu mật khẩu..." className="hrcms-flow-password-card"
            secondaryAction={<Link to="/login" className="hrcms-auth-secondary-button">Hủy</Link>}
            extra={form.values.password && form.values.password === form.values.confirmPassword
                ? <p className="hrcms-flow-password-hint hrcms-flow-password-match" role="status">
                    <img src="/figma/auth/flow-check.svg" alt="" />
                    Hai mật khẩu nhập vào trùng khớp hoàn toàn
                </p>
                : <p className="hrcms-flow-password-hint">12–128 ký tự, gồm chữ hoa, chữ thường và số.</p>}
            footerActions={invitation
                ? <p className="hrcms-flow-footer-note">Cần mã mời hoặc mã thay thế? Liên hệ Club Manager.</p>
                : <details className="hrcms-auth-more-actions">
                    <summary>Cần mã khôi phục mới?</summary>
                    <nav aria-label="Password recovery actions">
                        <Link to="/forgot-password" state={{ email: form.values.email.trim() }}>Yêu cầu mã mới</Link>
                    </nav>
                </details>}>
            <AuthInput variant="hrcms" label="Email" {...form.field("email")}
                type="email" required autoComplete="email" placeholder="Nhập email" />
            <AuthInput variant="hrcms" label={invitation ? "Mã mời" : "Mã khôi phục"} {...form.field("code")}
                required maxLength={4000} autoComplete="off" spellCheck={false} autoCapitalize="none"
                placeholder="Nhập mã từ email" />
            <AuthInput variant="hrcms" label="Mật khẩu mới" {...form.field("password")}
                type="password" required maxLength={AUTH_POLICY.passwordMaxLength}
                autoComplete="new-password" placeholder="•••••••••••••" help={passwordHelp} />
            <AuthInput variant="hrcms" label="Xác nhận mật khẩu mới" {...form.field("confirmPassword")}
                type="password" required maxLength={AUTH_POLICY.passwordMaxLength}
                autoComplete="new-password" placeholder="•••••••••••••" />
        </AuthForm>
    );
}
