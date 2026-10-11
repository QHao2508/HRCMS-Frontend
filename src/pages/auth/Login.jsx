import { AUTH_ERROR, AUTH_NOTICE } from "../../constants/auth.js";
import { MSG, msg } from "../../messages/index.js";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { getNavigationEmail } from "../../services/authValidation.js";
import { getLoginDestination } from "../../routes/redirects.js";
import PublicLayout from "../../layouts/PublicLayout.jsx";

import AuthIntro from "../../components/auth/AuthIntro.jsx";

const notices = {
    "email-verified": msg(MSG.EMAIL_DA_DUOC_XAC_THUC_BAN_CO_THE_DANG_NHAP),
    "password-reset": msg(MSG.DA_DAT_LAI_MAT_KHAU_HAY_DANG_NHAP_BANG_MAT_KHAU_MOI),
    "invitation-accepted": msg(MSG.DA_THIET_LAP_TAI_KHOAN_BAN_CO_THE_DANG_NHAP),
};
/**
 * Quản lý form username/email và password; đăng nhập, xử lý cần xác thực/quá hạn và điều hướng về vị trí người dùng muốn vào.
 * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function Login() {
    const navigate = useNavigate();
    const { login, loading: restoring, isAuthenticated } = useAuth();
    const location = useLocation();
    const destination = getLoginDestination(location.state);
    const [form, setForm] = useState({ email: getNavigationEmail(location.state), password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    /**
     * Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.
     * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     * @param event Event UI; đọc target/currentTarget, chặn submit mặc định khi cần.
     */
    async function submit(event) {
        event.preventDefault();
        if (loading || restoring) return;
        setError("");
        if (!form.email || !form.password) { setError(msg(MSG.VUI_LONG_NHAP_TEN_DANG_NHAP_HOAC_EMAIL_VA_MAT_KHAU)); return; }
        setLoading(true);
        try { await login(form); navigate(destination, { replace: true }); }
        catch (failure) {
            if (failure.authCode === AUTH_ERROR.VerificationRequired && failure.verificationEmail) {
                navigate("/verify-email", { replace: true, state: { email: failure.verificationEmail, authNotice: AUTH_NOTICE.VerificationRequired } });
                return;
            }
            if (failure.authCode === AUTH_ERROR.RegistrationExpired) {
                navigate("/register", { replace: true, state: { email: form.email.includes("@") ? form.email.trim() : "", authNotice: AUTH_NOTICE.RegistrationExpired } });
                return;
            }
            setError(failure.message === msg(MSG.TEN_DANG_NHAP_EMAIL_HOAC_MAT_KHAU_KHONG_DUNG) ? msg(MSG.TEN_DANG_NHAP_EMAIL_HOAC_MAT_KHAU_KHONG_DUNG) : failure.message || msg(MSG.KHONG_THE_DANG_NHAP_VUI_LONG_THU_LAI)); }
        finally { setLoading(false); }
    }
    if (isAuthenticated && !restoring) return <Navigate to={destination} replace />;
    return <PublicLayout><main className="auth-page"><div className="auth-workspace"><AuthIntro /><div className="auth-card login-card">
        <h1>{msg(MSG.DANG_NHAP)}</h1><p>{msg(MSG.AUTH_LOGIN_DESCRIPTION)}</p>
        {restoring && <p role="status">{msg(MSG.LOADING_DANG_KIEM_TRA_PHIEN_DANG_NHAP)}</p>}
        {notices[location.state?.authNotice] && <div className="alert alert-success" role="status">{notices[location.state.authNotice]}</div>}
        {location.state?.logoutError && <div className="alert alert-warning" role="alert">{msg(MSG.DA_DANG_XUAT_TREN_THIET_BI_CHUA_XAC_NHAN_DUOC_DANG_XUAT_PHIA_MAY_CHU)}{' '}{location.state.logoutError}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <form onSubmit={submit} aria-busy={loading || restoring}>
            <div className="mb-3"><label htmlFor="login-email" className="form-label">{msg(MSG.TEN_DANG_NHAP_HOAC_EMAIL)}</label><input id="login-email" type="text" autoComplete="username" name="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={msg(MSG.NHAP_TEN_DANG_NHAP_HOAC_EMAIL)} required disabled={loading || restoring} /></div>
            <div className="mb-3"><label htmlFor="login-password" className="form-label">{msg(MSG.MAT_KHAU)}</label><input id="login-password" type="password" autoComplete="current-password" name="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={msg(MSG.NHAP_MAT_KHAU)} required disabled={loading || restoring} /></div>
            <Link className="auth-forgot" to="/forgot-password" state={{ email: form.email.includes("@") ? form.email : "" }}>{msg(MSG.QUEN_MAT_KHAU)}</Link>
            <button className="btn btn-primary w-100" type="submit" disabled={loading || restoring}>{loading ? msg(MSG.DANG_DANG_NHAP) : msg(MSG.DANG_NHAP)}</button>
        </form>
        <div className="auth-register">{msg(MSG.CHUA_CO_TAI_KHOAN)}{' '}<Link to="/register">{msg(MSG.DANG_KY)}</Link></div>
        <div className="auth-support-links"><Link to="/accept-invitation">{msg(MSG.ACCEPT_STAFF_INVITATION)}</Link></div>
    </div></div></main></PublicLayout>;
}
