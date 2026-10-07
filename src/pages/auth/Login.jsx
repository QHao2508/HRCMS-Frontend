import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { getNavigationEmail } from "../../services/authValidation.js";
import { getLoginDestination } from "../../routes/redirects.js";

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

    return (
        <div className="auth-page">
            <div className="auth-card">

                <h1>Welcome Back</h1>

                <p>
                    Sign in to your HorseClub account
                </p>

                {authNotices[location.state?.authNotice] && (
                    <div className="alert alert-success" role="status">{authNotices[location.state.authNotice]}</div>
                )}

                {location.state?.logoutError && (
                    <div className="alert alert-warning" role="alert">
                        Signed out on this device. Server logout could not be confirmed: {location.state.logoutError}
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="mb-3">
                        <label className="form-label">
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                </form>

                <div className="mt-3">
                    <p><Link to="/register">Create a Horse Owner account</Link></p>
                    <p><Link to="/verify-email" state={{ email: form.email }}>Verify your email</Link></p>
                    <p><Link to="/forgot-password" state={{ email: form.email }}>Forgot password?</Link></p>
                    <p><Link to="/accept-invitation">Accept a staff invitation</Link></p>
                </div>

            </div>
        </div>
    );
}

export default Login;
