import { AUTH_NOTICE } from "../../constants/auth.js";
import { MSG, msg } from "../../messages/index.js";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm.jsx";
import AuthInput from "../../components/auth/AuthInput.jsx";
import { useAuthForm } from "../../context/useAuthForm.js";
import { useAuthCooldown } from "../../context/useAuthCooldown.js";
import { resendVerification, verifyEmail } from "../../services/authService.js";
import { getNavigationEmail, validateEmail, validateVerification } from "../../services/authValidation.js";

/**
 * Nhập email/OTP, xác thực hoặc gửi lại mã với cooldown riêng; không coi gửi email hay xác thực là đã đăng nhập.
 * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();
    const form = useAuthForm({ email: getNavigationEmail(location.state), code: "" }, validateVerification);
    const cooldown = useAuthCooldown("verification");
    const [message, setMessage] = useState(location.state?.authNotice === AUTH_NOTICE.VerificationRequired ? msg(MSG.ACCOUNT_VERIFICATION_REQUIRED) : location.state?.registered
        ? msg(MSG.YOUR_ACCOUNT_WAS_CREATED_CHECK_YOUR_EMAIL_FOR_A_VERIFICATION_CODE) : "");

    /**
     * Gửi email/OTP; thành công mới chuyển login cùng notice xác thực, không lưu mã vào URL.
     * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
     * @param values Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API.
     */
    async function verify(values) {
        setMessage("");
        await verifyEmail(values);
        navigate("/login", { replace: true, state: { email: values.email.trim(), authNotice: "email-verified" } });
    }

    /**
     * Gửi lại OTP khi hết cooldown, chỉ kiểm email để không bắt người dùng nhập OTP trước khi xin mã mới.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     */
    function resend() {
        if (cooldown.seconds > 0) return;
        void form.submit(async (values) => {
            setMessage("");
            try {
                await resendVerification(values);
                setMessage(msg(MSG.IF_ELIGIBLE_A_CODE_WILL_BE_EMAILED));
            } finally {
                cooldown.start();
            }
        }, validateEmail, "resend");
    }

    return (
        <AuthForm title={msg(MSG.VERIFY_YOUR_EMAIL)} description={msg(MSG.ENTER_YOUR_EMAIL_AND_THE_SIX_DIGIT_CODE_FROM_YOUR_VERIFICATION_EMAIL)}
            form={form} onSubmit={() => form.submit(verify)} submitLabel={msg(MSG.VERIFY_YOUR_EMAIL)}
            pendingLabel={form.pending === "resend" ? msg(MSG.REQUESTING_CODE) : msg(MSG.VERIFYING)} success={message}
            footer={<Link to="/login">{msg(MSG.BACK_TO_SIGN_IN)}</Link>}>
            <p className="form-text">{msg(MSG.REGISTRATION_EXPIRY_HELP)}</p>
            <AuthInput label={msg(MSG.EMAIL)} {...form.field("email")} type="email" required autoComplete="email" />
            <AuthInput label={msg(MSG.VERIFICATION_CODE)} {...form.field("code")} required inputMode="numeric"
                autoComplete="one-time-code" maxLength={6} />
            <button type="button" className="btn btn-outline-secondary mb-3" onClick={resend}
                disabled={!!form.pending || cooldown.seconds > 0}>
                {cooldown.seconds > 0 ? msg(MSG.REQUEST_AGAIN_IN_S, { p0: cooldown.seconds }) : msg(MSG.RESEND_VERIFICATION_CODE)}
            </button>
        </AuthForm>
    );
}
