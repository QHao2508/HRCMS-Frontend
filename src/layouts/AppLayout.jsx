import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { getRoleLabel } from "../constants/roles.js";
import { getUserDisplayName } from "../utils/userDisplay.js";
import { getNavigationForRole } from "../routes/navigation.js";
import LogoutButton from "../components/auth/LogoutButton.jsx";

export default function AppLayout() {
    const { user } = useAuth();
    const navigation = getNavigationForRole(user?.role);

    return (
        <div className="min-vh-100">
            <a className="visually-hidden-focusable" href="#main-content">Skip to main content</a>
            <header className="border-bottom bg-white px-3 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
                <Link className="fs-4 text-decoration-none fw-semibold" to="/dashboard">HRCMS</Link>
                <div className="d-flex flex-wrap align-items-center gap-3">
                    <div>
                        <div className="fw-semibold">{getUserDisplayName(user)}</div>
                        <div className="text-body-secondary small">{getRoleLabel(user?.role)}</div>
                    </div>
                    <LogoutButton />
                </div>
            </header>
            <div className="container-fluid">
                <div className="row">
                    <aside className="col-12 col-md-3 col-lg-2 bg-white border-end p-3">
                        <nav aria-label="Main navigation">
                            <ul className="nav nav-pills flex-column gap-1">
                                {navigation.map((item) => (
                                    <li className="nav-item" key={item.to}>
                                        <NavLink className="nav-link" to={item.to} end={item.to === "/dashboard"}>{item.label}</NavLink>
                                    </li>
                                ))}
                            </ul>
                            {!navigation.length && <p className="text-body-secondary mb-0">No navigation options are available for this account.</p>}
                        </nav>
                    </aside>
                    <main id="main-content" tabIndex={-1} className="col-12 col-md-9 col-lg-10 p-4">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
}
