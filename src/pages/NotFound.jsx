import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

export default function NotFound() {
    const { loading, isAuthenticated } = useAuth();
    if (loading) return <div role="status">Loading...</div>;
    return (
        <main className="container py-4">
            <h1>Page not found</h1>
            <p>The page you requested could not be found.</p>
            <Link to={isAuthenticated ? "/dashboard" : "/login"}>
                {isAuthenticated ? "Back to dashboard" : "Back to sign in"}
            </Link>
        </main>
    );
}
