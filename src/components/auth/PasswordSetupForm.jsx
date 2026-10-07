import { MSG, msg } from "../../messages/index.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthForm from "./AuthForm.jsx";
import AuthInput from "./AuthInput.jsx";
import { useAuthForm } from "../../context/useAuthForm.js";
import { acceptInvitation, resetPassword } from "../../services/authService.js";
import { AUTH_POLICY, getNavigationEmail, passwordHelp, validatePasswordSetup } from "../../services/authValidation.js";

/**
 * Dùng chung form email, OTP và mật khẩu mới cho Reset/Invite; chọn endpoint đúng mục đích và yêu cầu đăng nhập lại sau thành công.
 * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { invitation = false }. Các props/callback lấy từ caller.
 */
export default function PasswordSetupForm({ invitation = false }) {
    const location = useLocation();
    const navigate = useNavigate();
    const form = useAuthForm({ email: getNavigationEmail(location.state), code: "", password: "", confirmPassword: "" }, validatePasswordSetup);

    /**
     * Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.
     * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
     * @param values Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API.
     */
    async function submit(values) {
        if (invitation) await acceptInvitation(values);
        else await resetPassword(values);
        navigate("/login", {
            replace: true,
            state: { email: values.email.trim(), authNotice: invitation ? "invitation-accepted" : "password-reset" },
        });
    }

    return (
        <AuthForm title={invitation ? msg(MSG.ACCEPT_STAFF_INVITATION) : msg(MSG.RESET_PASSWORD)}
            description={invitation
                ? msg(MSG.NHAP_EMAIL_NHAN_LOI_MOI_OTP_6_CHU_SO_VA_DAT_MAT_KHAU_SAU_DO_DANG_NHAP_BA)
                : msg(MSG.NHAP_EMAIL_OTP_6_CHU_SO_TU_EMAIL_VA_MAT_KHAU_MOI)}
            form={form} onSubmit={() => form.submit(submit)} submitLabel={invitation ? msg(MSG.SET_PASSWORD) : msg(MSG.RESET_PASSWORD)}
            pendingLabel={msg(MSG.SAVING_PASSWORD)}
            footer={<>{invitation ? <p>{msg(MSG.NEED_AN_INVITATION_OR_A_REPLACEMENT_CODE_CONTACT_CLUB_MANAGEMENT)}</p>
                : <p><Link to="/forgot-password" state={{ email: form.values.email.trim() }}>{msg(MSG.REQUEST_A_NEW_RESET_CODE)}</Link></p>}
                <Link to="/login">{msg(MSG.BACK_TO_SIGN_IN)}</Link></>}>
            <AuthInput label={msg(MSG.EMAIL)} {...form.field("email")} type="email" required autoComplete="email" />
            <AuthInput label={invitation ? msg(MSG.OTP_KICH_HOAT_6_CHU_SO) : msg(MSG.OTP_DAT_LAI_MAT_KHAU_6_CHU_SO)} {...form.field("code")}
                required maxLength={6} inputMode="numeric" autoComplete="one-time-code" spellCheck={false} autoCapitalize="none" />
            <AuthInput label={msg(MSG.NEW_PASSWORD)} {...form.field("password")} type="password" required
                maxLength={AUTH_POLICY.passwordMaxLength} autoComplete="new-password" help={passwordHelp} />
            <AuthInput label={msg(MSG.CONFIRM_PASSWORD)} {...form.field("confirmPassword")} type="password" required
                maxLength={AUTH_POLICY.passwordMaxLength} autoComplete="new-password" />
        </AuthForm>
    );
}
