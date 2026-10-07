import { MSG, msg } from "../../messages/index.js";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm.jsx";
import AuthInput from "../../components/auth/AuthInput.jsx";
import { useAuthForm } from "../../context/useAuthForm.js";
import { useAuthCooldown } from "../../context/useAuthCooldown.js";
import { forgotPassword } from "../../services/authService.js";
import { getNavigationEmail, validateEmail } from "../../services/authValidation.js";

/**
 * Yêu cầu OTP đặt lại mật khẩu, giữ thông báo chung và cooldown để không tiết lộ email tồn tại.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function ForgotPassword() {
    const location = useLocation();
    const form = useAuthForm({ email: getNavigationEmail(location.state) }, validateEmail);
    const cooldown = useAuthCooldown("passwordReset");
    const [message, setMessage] = useState("");

    /**
     * Yêu cầu OTP Reset từ email đã kiểm, hiển thị thông báo chung và bắt đầu cooldown.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     * @param values Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API.
     */
    async function requestCode(values) {
        setMessage("");
        try {
            await forgotPassword(values);
            setMessage(msg(MSG.IF_ELIGIBLE_A_RESET_CODE_WILL_BE_EMAILED));
        } finally {
            cooldown.start();
        }
    }

    return (
        <AuthForm title={msg(MSG.FORGOT_PASSWORD)} description={msg(MSG.ENTER_YOUR_EMAIL_TO_REQUEST_A_PASSWORD_RESET_CODE)}
            form={form} onSubmit={() => { if (!cooldown.seconds) void form.submit(requestCode); }}
            submitLabel={cooldown.seconds ? msg(MSG.REQUEST_AGAIN_IN_S, { p0: cooldown.seconds }) : msg(MSG.SEND_RESET_CODE)}
            pendingLabel={msg(MSG.REQUESTING_CODE)} submitDisabled={cooldown.seconds > 0} success={message}
            footer={<><p><Link to="/reset-password" state={{ email: form.values.email.trim() }}>{msg(MSG.ALREADY_HAVE_A_RESET_CODE)}</Link></p><Link to="/login">{msg(MSG.BACK_TO_SIGN_IN)}</Link></>}>
            <AuthInput label={msg(MSG.EMAIL)} {...form.field("email")} type="email" required autoComplete="email" />
        </AuthForm>
    );
}
