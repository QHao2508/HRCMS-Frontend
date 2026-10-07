import { Link } from "react-router-dom";

export default function PermissionDenied() {
    return (
        <section aria-labelledby="permission-denied-title">
            <h1 id="permission-denied-title">Permission denied</h1>
            <p>Your signed-in account does not have permission to view this page.</p>
            <Link className="btn btn-primary" to="/dashboard">Back to dashboard</Link>
        </section>
    );
}
