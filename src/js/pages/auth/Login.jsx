import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../../css/Login.css";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        if (!email.trim() || !password) {
            setError("Vui lòng nhập đầy đủ email và mật khẩu.");
            return;
        }

        try {
            setLoading(true);

            await login({
                email: email.trim(),
                password
            });

            navigate("/dashboard");
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Tên đăng nhập hoặc mật khẩu không chính xác."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            {/* HEADER */}
            <header className="login-header">
                <div className="login-brand">
                    <span className="login-brand-mark"></span>
                    <span>HRCMS</span>
                </div>

                <div className="login-header-title">
                    CỔNG QUẢN TRỊ CHIẾM MÃ HOÀNG GIA
                </div>
            </header>

            {/* MAIN */}
            <main className="login-main">

                <section className="login-card">

                    <h1 className="login-title">
                        Đăng Nhập
                    </h1>

                    <p className="login-subtitle">
                        Truy cập cổng quản lý chiếm mã hoàng gia
                    </p>

                    {/* INFORMATION */}
                    <div className="login-info">
                        <span className="login-info-icon">i</span>

                        <p className="login-info-text">
                            Tài khoản nhân viên nội bộ
                            (Staff/Manager/HR/Trainer/Vet/Groom)
                            chỉ được tham gia trực tiếp vào bàn giao.
                            Không tự đăng ký tài khoản.
                        </p>
                    </div>

                    {/* ERROR */}
                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    {/* FORM */}
                    <form
                        className="login-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="login-field">
                            <label
                                className="login-label"
                                htmlFor="email"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                className="login-input"
                                placeholder="Nhập email của bạn"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                autoComplete="username"
                            />
                        </div>

                        <div className="login-field">
                            <label
                                className="login-label"
                                htmlFor="password"
                            >
                                Mật khẩu
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="login-input"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="login-options">

                            <label className="login-remember">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(event) =>
                                        setRememberMe(
                                            event.target.checked
                                        )
                                    }
                                />

                                <span>Ghi nhớ đăng nhập</span>
                            </label>

                            <Link
                                to="/forgot-password"
                                className="login-forgot"
                            >
                                Quên mật khẩu?
                            </Link>

                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Đang đăng nhập..."
                                : "Đăng Nhập Hệ Thống"}
                        </button>

                    </form>

                    <p className="login-register">
                        Bạn là Chủ Sở Hữu (Horse Owner)?
                        {" "}
                        <Link
                            to="/register"
                            className="login-register-link"
                        >
                            Đăng ký ngay
                        </Link>
                    </p>

                </section>

            </main>

            {/* FOOTER */}
            <footer className="login-footer">

                <div className="login-footer-content">

                    <div className="login-footer-brand">
                        <h2 className="login-footer-title">
                            HRCMS
                        </h2>

                        <p className="login-footer-description">
                            Hệ thống Quản lý và Huấn luyện Chiến mã Hoàng Gia.
                            Bảo mật, tối ưu và chuyên nghiệp cho các câu lạc bộ
                            đua ngựa quy mô lớn.
                        </p>
                    </div>

                    <div className="login-footer-support">

                        <h3 className="login-footer-support-title">
                            LIÊN HỆ HỖ TRỢ
                        </h3>

                        <p>Hotline: 1900-HRCMS</p>
                        <p>Email: support@hrcms.gov.vn</p>

                    </div>

                </div>

                <div className="login-footer-bottom">
                    Bản quyền © 2026 HRCMS. Tất cả các quyền được bảo lưu.
                </div>

            </footer>

        </div>
    );
}

export default Login;