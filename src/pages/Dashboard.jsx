import { useAuth } from "../context/useAuth.js";
import { getRoleLabel, isKnownRole } from "../constants/roles.js";
import { getUserDisplayName } from "../utils/userDisplay.js";

export default function Dashboard() {
    const { user } = useAuth();
    return (
        <section aria-labelledby="dashboard-title">
            <h1 id="dashboard-title">Dashboard</h1>
            <p className="lead">Welcome, {getUserDisplayName(user)}.</p>
            <dl>
                <dt>Username</dt><dd>{user?.userName || "Not provided"}</dd>
                <dt>Role</dt><dd>{getRoleLabel(user?.role)}</dd>
            </dl>
            {!isKnownRole(user?.role) && <p role="alert">Your account role is not recognized. Contact club management for assistance.</p>}
        </section>
    );
}
