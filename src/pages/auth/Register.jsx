import { AUTH_NOTICE } from "../../constants/auth.js";
import { MSG, msg } from "../../messages/index.js";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthForm from "../../components/auth/AuthForm.jsx";
import AuthInput from "../../components/auth/AuthInput.jsx";
import { useAuthForm } from "../../context/useAuthForm.js";
import { startAuthCooldown } from "../../context/useAuthCooldown.js";
import { register } from "../../services/authService.js";
import { AUTH_POLICY, getNavigationEmail, passwordHelp, validateRegistration } from "../../services/authValidation.js";

/**
 * Thu thập dữ liệu chủ ngựa, kiểm hợp lệ, đăng ký rồi chuyển xác thực; hỗ trợ quay lại xác thực khi tài khoản đã tồn tại.
 * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();
    const [existingAccount, setExistingAccount] = useState(false);
    const form = useAuthForm({
        firstName: "", lastName: "", userName: "", email: getNavigationEmail(location.state), phone: "", address: "",
        nationalId: "", password: "", confirmPassword: "",
    }, validateRegistration);

    /**
     * Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.
     * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
     * @param values Giá trị form hiện tại; validator/payload helper chuẩn hóa trước khi gọi API.
     */
    async function submit(values) {
        setExistingAccount(false);
        let account;
        try { account = await register(values); }
        catch (error) { setExistingAccount(error.status === 409); throw error; }
        startAuthCooldown("verification");
        navigate("/verify-email", {
            replace: true,
            state: { email: account?.email || values.email.trim(), registered: true },
        });
    }

    return (
        <AuthForm title={msg(MSG.CREATE_A_HORSE_OWNER_ACCOUNT)} description={msg(MSG.REGISTER_YOUR_ACCOUNT_THEN_VERIFY_YOUR_EMAIL_BEFORE_SIGNING_IN)}
            form={form} onSubmit={() => form.submit(submit)} submitLabel={msg(MSG.DANG_KY)} pendingLabel={msg(MSG.CREATING_ACCOUNT)}
            footer={<>{existingAccount && <p className="alert alert-info">{msg(MSG.VERIFY_RECOVERY_HELP)}{' '}<Link to="/verify-email" state={{ email: form.values.email.trim() }}>{msg(MSG.VERIFY_EXISTING_ACCOUNT)}</Link></p>}<Link to="/login">{msg(MSG.BACK_TO_SIGN_IN)}</Link><p className="mt-2">{msg(MSG.STAFF_ACCOUNTS_ARE_CREATED_BY_CLUB_MANAGEMENT)}{' '}<Link to="/accept-invitation">{msg(MSG.ACCEPT_STAFF_INVITATION)}</Link></p></>}>
            {location.state?.authNotice === AUTH_NOTICE.RegistrationExpired && <p className="alert alert-warning" role="alert">{msg(MSG.ACCOUNT_REGISTRATION_EXPIRED)}</p>}
            <p className="form-text">{msg(MSG.REGISTRATION_EXPIRY_HELP)}</p>
            <AuthInput label={msg(MSG.FIRST_NAME)} {...form.field("firstName")} required maxLength={100} autoComplete="given-name" />
            <AuthInput label={msg(MSG.LAST_NAME)} {...form.field("lastName")} required maxLength={100} autoComplete="family-name" />
            <AuthInput label={msg(MSG.USERNAME)} {...form.field("userName")} required minLength={3} maxLength={80} autoComplete="username" />
            <AuthInput label={msg(MSG.EMAIL)} {...form.field("email")} type="email" required maxLength={254} autoComplete="email" />
            <AuthInput label={msg(MSG.PHONE)} {...form.field("phone")} type="tel" required maxLength={30} autoComplete="tel" />
            <AuthInput label={msg(MSG.ADDRESS)} {...form.field("address")} multiline rows={2} required maxLength={500} autoComplete="street-address" />
            <AuthInput label={msg(MSG.NATIONAL_ID, { p0: AUTH_POLICY.requireNationalId ? "" : " " + msg(MSG.KHONG_BAT_BUOC) })} {...form.field("nationalId")}
                required={AUTH_POLICY.requireNationalId} inputMode="numeric" maxLength={AUTH_POLICY.nationalIdDigits}
                autoComplete="off" help={msg(MSG.IF_SUPPLIED_ENTER_EXACTLY_DIGITS, { p0: AUTH_POLICY.nationalIdDigits })} />
            <AuthInput label={msg(MSG.MAT_KHAU)} {...form.field("password")} type="password" required
                maxLength={AUTH_POLICY.passwordMaxLength} autoComplete="new-password" help={passwordHelp} />
            <AuthInput label={msg(MSG.CONFIRM_PASSWORD)} {...form.field("confirmPassword")} type="password" required
                maxLength={AUTH_POLICY.passwordMaxLength} autoComplete="new-password" />
        </AuthForm>
    );
}
