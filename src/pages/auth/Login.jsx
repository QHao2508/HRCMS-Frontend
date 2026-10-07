import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { useAuth } from "../../context/useAuth.js";
import { getNavigationEmail } from "../../services/authValidation.js";
import { getLoginDestination } from "../../routes/redirects.js";
import PublicLayout from "../../layouts/PublicLayout.jsx";

const notices = {
    "email-verified": "Email đã được xác thực. Bạn có thể đăng nhập.",
    "password-reset": "Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới.",
    "invitation-accepted": "Đã thiết lập tài khoản. Bạn có thể đăng nhập.",
};
export default function Login() {
    const navigate = useNavigate();
    const { login, loading: restoring, isAuthenticated } = useAuth();
    const location = useLocation();
    const destination = getLoginDestination(location.state);
    const [form, setForm] = useState({ email: getNavigationEmail(location.state), password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    async function submit(event) {
        event.preventDefault();
        if (loading || restoring) return;
        setError("");
        if (!form.email || !form.password) { setError("Vui lòng nhập email và mật khẩu."); return; }
        setLoading(true);
        try { await login(form); navigate(destination, { replace: true }); }
        catch (failure) { setError(failure.message === "Invalid email or password." ? "Email hoặc mật khẩu không đúng." : failure.message || "Không thể đăng nhập. Vui lòng thử lại."); }
        finally { setLoading(false); }
    }
    if (isAuthenticated && !restoring) return <Navigate to={destination} replace />;
    return <PublicLayout><main className="auth-page"><div className="auth-card">
        <h1>Đăng Nhập</h1><p>Truy cập cổng quản lý chiến mã hoàng gia</p>
        <div className="alert alert-info staff-note"><Info size={17} /><span>Nhân viên nội bộ dùng tài khoản do Club Manager tạo và bàn giao; không tự đăng ký tại đây.</span></div>
        {restoring && <p role="status">Loading · Đang kiểm tra phiên đăng nhập...</p>}
        {notices[location.state?.authNotice] && <div className="alert alert-success" role="status">{notices[location.state.authNotice]}</div>}
        {location.state?.logoutError && <div className="alert alert-warning" role="alert">Đã đăng xuất trên thiết bị. Chưa xác nhận được đăng xuất phía máy chủ: {location.state.logoutError}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <form onSubmit={submit} aria-busy={loading || restoring}>
            <div className="mb-3"><label htmlFor="login-email" className="form-label">Email</label><input id="login-email" type="email" autoComplete="username" name="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Nhập email" required disabled={loading || restoring} /></div>
            <div className="mb-3"><label htmlFor="login-password" className="form-label">Mật khẩu</label><input id="login-password" type="password" autoComplete="current-password" name="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Nhập mật khẩu" required disabled={loading || restoring} /></div>
            <Link className="auth-forgot" to="/forgot-password" state={{ email: form.email }}>Quên mật khẩu?</Link>
            <button className="btn btn-primary w-100" type="submit" disabled={loading || restoring}>{loading ? "Đang đăng nhập..." : "Đăng Nhập Hệ Thống"}</button>
        </form>
        <div className="auth-register">Bạn là Chủ Sở Hữu Ngựa (Horse Owner)? <Link to="/register">Đăng ký ngay!</Link></div>
        <div className="auth-support-links"><Link to="/verify-email" state={{ email: form.email }}>Xác thực email</Link><Link to="/accept-invitation">Nhận lời mời nhân viên</Link></div>
    </div></main></PublicLayout>;
}
