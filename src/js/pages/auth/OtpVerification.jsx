import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../../css/OtpVerification.css";

function OtpVerification() {
    const navigate = useNavigate();

    const [otp, setOtp] = useState([
        "",
        "",
        "",
        "",
        "",
        ""
    ]);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const inputRefs = useRef([]);

    const handleOtpChange = (index, value) => {
        // Only allow numbers
        const numericValue = value.replace(/\D/g, "");

        if (!numericValue) {
            const newOtp = [...otp];
            newOtp[index] = "";
            setOtp(newOtp);
            return;
        }

        const newOtp = [...otp];

        // Only use the first digit
        newOtp[index] = numericValue.charAt(0);

        setOtp(newOtp);

        // Move to next box
        if (
            numericValue &&
            index < inputRefs.current.length - 1
        ) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, event) => {
        if (
            event.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        const otpValue = otp.join("");

        if (otpValue.length !== 6) {
            setError("Vui lòng nhập đầy đủ 6 chữ số OTP.");
            return;
        }

        try {
            setLoading(true);

            /*
             * Backend integration will be added later.
             *
             * Example:
             * await verifyOtp(otpValue);
             */

            // Temporary navigation for UI testing
            navigate("/reset-password");

        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Mã OTP không hợp lệ hoặc đã hết hạn."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");

        try {
            setResending(true);

            /*
             * Backend integration later:
             * await resendOtp();
             */

        } catch (err) {
            setError(
                "Không thể gửi lại mã OTP. Vui lòng thử lại."
            );
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="otp-page">

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
            <main className="otp-main">

                <section className="otp-card">

                    <h1 className="otp-title">
                        Xác Thực Mã OTP
                    </h1>

                    <p className="otp-subtitle">
                        Mã OTP đã được gửi đến Email của bạn:
                    </p>

                    <p className="otp-email">
                        vin********@gmail.com
                    </p>

                    <form onSubmit={handleSubmit}>

                        {/* OTP INPUTS */}
                        <div className="otp-inputs">

                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(element) => {
                                        inputRefs.current[index] =
                                            element;
                                    }}
                                    className={`otp-input ${digit
                                        ? "otp-input-filled"
                                        : ""
                                        }`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(event) =>
                                        handleOtpChange(
                                            index,
                                            event.target.value
                                        )
                                    }
                                    onKeyDown={(event) =>
                                        handleKeyDown(
                                            index,
                                            event
                                        )
                                    }
                                    aria-label={`OTP digit ${index + 1}`}
                                />
                            ))}

                        </div>

                        <p className="otp-question">
                            Bạn chưa nhận được mã xác thực?
                        </p>

                        <button
                            type="button"
                            className="otp-resend"
                            onClick={handleResend}
                            disabled={resending}
                        >
                            {resending
                                ? "Đang gửi..."
                                : "Gửi Lại Mã OTP"}
                        </button>

                        {error && (
                            <div className="otp-error">
                                {error}
                            </div>
                        )}

                        <div className="otp-divider"></div>

                        <div className="otp-actions">

                            <Link
                                to="/forgot-password"
                                className="otp-cancel"
                            >
                                Hủy Bỏ
                            </Link>

                            <button
                                type="submit"
                                className="otp-confirm"
                                disabled={loading}
                            >
                                {loading
                                    ? "Đang xác thực..."
                                    : "Xác Nhận & Kích Hoạt"}
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

export default OtpVerification;