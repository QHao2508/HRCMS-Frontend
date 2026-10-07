import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import { useAuth } from "../../context/useAuth.js";
import { getNavigationEmail } from "../../services/authValidation.js";
import { getLoginDestination } from "../../routes/redirects.js";
import "../../style/auth.css";

const authNotices = {
    "email-verified": "Your email is verified. You can now sign in.",
    "password-reset": "Your password has been reset. Sign in with your new password.",
    "invitation-accepted": "Your password is set. You can now sign in.",
};

function Login() {
    const navigate = useNavigate();
    const { login, loading: restoring, isAuthenticated } = useAuth();
    const location = useLocation();
    const destination = getLoginDestination(location.state);

    const [form, setForm] = useState({
        email: getNavigationEmail(location.state),
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading || restoring) return;

        setError("");

        if (!form.email || !form.password) {
            setError("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);

            await login(form);
            navigate(destination, { replace: true });
        } catch (err) {
            setError(
                err.message || "Unable to sign in. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (restoring) return <div>Loading...</div>;
    if (isAuthenticated) return <Navigate to={destination} replace />;

    const footerActions = (
        <details className="hrcms-auth-more-actions">
            <summary>Tùy chọn tài khoản</summary>
            <nav aria-label="Other account actions">
                <Link to="/verify-email" state={{ email: form.email }}>Verify your email</Link>
                <Link to="/accept-invitation">Accept a staff invitation</Link>
            </nav>
        </details>
    );

    return (
        <AuthLayout footerActions={footerActions}>
            <section className="hrcms-login-card" aria-labelledby="login-title">
                <div className="hrcms-login-heading">
                    <h1 id="login-title">Đăng Nhập</h1>
                    <p>Truy cập cổng quản lý chiến mã hoàng gia</p>
                </div>

                <div className="hrcms-auth-alert hrcms-auth-alert-info" role="note">
                    <img src="/figma/auth/info.svg" alt="" />
                    <span>Nhân viên nội bộ dùng tài khoản do Club Manager tạo và bàn giao; không tự đăng ký tại đây.</span>
                </div>

                {authNotices[location.state?.authNotice] && (
                    <div className="hrcms-auth-alert hrcms-auth-alert-success" role="status">
                        {authNotices[location.state.authNotice]}
                    </div>
                )}

                {location.state?.logoutError && (
                    <div className="hrcms-auth-alert hrcms-auth-alert-warning" role="alert">
                        Signed out on this device. Server logout could not be confirmed: {location.state.logoutError}
                    </div>
                )}

                {error && (
                    <div className="hrcms-auth-alert hrcms-auth-alert-error" role="alert">
                        {error}
                    </div>
                )}

                <form className="hrcms-login-form" onSubmit={handleSubmit}>
                    <div className="hrcms-login-fields">
                        <div className="hrcms-auth-field">
                            <label htmlFor="login-email">Email</label>
                            <input
                                id="login-email"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Nhập email"
                                autoComplete="email"
                            />
                        </div>

                        <div className="hrcms-auth-field">
                            <label htmlFor="login-password">Mật khẩu</label>
                            <input
                                id="login-password"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="•••••••••••••"
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <div className="hrcms-login-actions">
                        <Link to="/forgot-password" state={{ email: form.email }}>Quên mật khẩu?</Link>
                    </div>

                    <div className="hrcms-login-submit">
                        <button type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Đăng Nhập Hệ Thống"}
                        </button>
                        <div className="hrcms-login-divider">
                            <img src="/figma/auth/login-divider.svg" alt="" />
                        </div>
                        <p className="hrcms-login-register">
                            <span>Bạn là Chủ Sở Hữu Ngựa (Horse Owner)?</span>{" "}
                            <Link to="/register">Đăng ký ngay</Link>
                        </p>
                    </div>
                </form>
            </section>
        </AuthLayout>
    );
}

export default Login;
