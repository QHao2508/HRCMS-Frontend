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
            setMessage("Yêu cầu đặt lại mật khẩu đã được gửi. Nếu thông tin tài khoản hợp lệ, hãy kiểm tra hướng dẫn đặt lại mật khẩu.");
        } finally {
            cooldown.start();
        }
    }

    return (
        <AuthForm title="Quên Mật Khẩu"
            description="Nhập email đã đăng ký. Nếu tài khoản đủ điều kiện, bạn sẽ nhận mã khôi phục qua email."
            form={form} onSubmit={() => { if (!cooldown.seconds) void form.submit(requestCode); }}
            submitLabel={cooldown.seconds ? `Gửi lại sau ${cooldown.seconds}s` : "Gửi Hướng Dẫn Đặt Lại"}
            pendingLabel="Đang gửi mã..." submitDisabled={cooldown.seconds > 0} success={message}
            secondaryAction={<Link to="/login" className="hrcms-auth-secondary-button">Quay Lại</Link>}
            notice={<div className="hrcms-auth-alert hrcms-auth-alert-info" role="note">
                <img src="/figma/auth/info.svg" alt="" />
                <span>Lưu ý: Bạn cần truy cập hòm thư đã xác thực của tài khoản này để tiếp tục quá trình thay đổi mật khẩu.</span>
            </div>}
            footerActions={<details className="hrcms-auth-more-actions">
                <summary>Đã có mã khôi phục?</summary>
                <nav aria-label="Password recovery actions">
                    <Link to="/reset-password" state={{ email: form.values.email.trim() }}>Tiếp tục đặt lại mật khẩu</Link>
                </nav>
            </details>}>
            <AuthInput variant="hrcms" label="Email" {...form.field("email")}
                type="email" required autoComplete="email" placeholder="Nhập email" />
        </AuthForm>
    );
}
