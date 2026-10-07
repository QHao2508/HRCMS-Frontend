import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../../css/ForgotPassword.css";

function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        if (!email.trim()) {
            setError("Vui lòng nhập tên đăng nhập hoặc Email.");
            return;
        }

        try {
            setLoading(true);

            /*
             * Backend integration will be added later.
             *
             * Example flow:
             * await forgotPassword(email);
             */

            // Temporary navigation for UI testing
            navigate("/otp-verification");
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Không thể gửi yêu cầu. Vui lòng thử lại."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-page">

            {/* HEADER */}
            <header className="auth-header">
                <Link to="/login" className="auth-brand">
                    <span className="auth-brand-mark"></span>
                    <span>HRCMS</span>
                </Link>

                <div className="auth-header-title">
                    CỔNG QUẢN TRỊ CHIẾM MÃ HOÀNG GIA
                </div>
            </header>

            {/* MAIN */}
            <main className="forgot-main">

                <section className="forgot-card">

                    <h1 className="forgot-title">
                        Yêu Cầu Cấp Lại Mật Khẩu
                    </h1>

                    <p className="forgot-subtitle">
                        Nhập tên tài khoản hoặc địa chỉ Email đã đăng ký
                        để nhận hướng dẫn đặt lại mật khẩu.
                    </p>

                    <form
                        className="forgot-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="forgot-field">

                            <label
                                htmlFor="forgot-email"
                                className="forgot-label"
                            >
                                Tên đăng nhập hoặc Email tài khoản
                            </label>

                            <input
                                id="forgot-email"
                                type="text"
                                className="forgot-input"
                                placeholder="owner.nguyen@hrcms.vn"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                autoComplete="username"
                            />

                        </div>

                        <div className="forgot-info">

                            <span className="forgot-info-icon">
                                i
                            </span>

                            <p>
                                Lưu ý: Bạn cần truy cập hòm thư đã xác thực
                                của tài khoản này để tiếp tục quá trình
                                thay đổi mật khẩu.
                            </p>

                        </div>

                        {error && (
                            <div className="forgot-error">
                                {error}
                            </div>
                        )}

                        <div className="forgot-divider"></div>

                        <div className="forgot-actions">

                            <Link
                                to="/login"
                                className="forgot-back-button"
                            >
                                Quay Lại
                            </Link>

                            <button
                                type="submit"
                                className="forgot-submit-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Đang xử lý..."
                                    : "Yêu Cầu Đặt Lại Mật Khẩu"}
                            </button>

                        </div>

                    </form>

                </section>

            </main>

            {/* FOOTER */}
            <footer className="auth-footer">

                <div className="auth-footer-content">

                    <div className="auth-footer-brand">
                        <h2>HRCMS</h2>

                        <p>
                            Hệ thống Quản lý và Huấn luyện Chiến mã Hoàng Gia.
                            Bảo mật, tối ưu và chuyên nghiệp cho các câu lạc bộ
                            đua ngựa quy mô lớn.
                        </p>
                    </div>

                    <div className="auth-footer-support">

                        <h3>LIÊN HỆ HỖ TRỢ</h3>

                        <p>Hotline: 1900-HRCMS</p>
                        <p>Email: support@hrcms.gov.vn</p>

                    </div>

                </div>

                <div className="auth-footer-bottom">
                    Bản quyền © 2026 HRCMS. Tất cả các quyền được bảo lưu.
                </div>

            </footer>

        </div>
    );
}

export default ForgotPassword;