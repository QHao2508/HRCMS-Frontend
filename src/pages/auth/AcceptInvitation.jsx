import PasswordSetupForm from "../../components/auth/PasswordSetupForm.jsx";

/**
 * Dùng PasswordSetupForm cho nhân viên tự kích hoạt tài khoản theo lời mời do quản lý tạo.
 */
export default function AcceptInvitation() {
    return <PasswordSetupForm invitation />;
}
