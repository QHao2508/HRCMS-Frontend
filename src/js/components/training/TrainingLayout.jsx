import { NavLink } from "react-router-dom";

function TrainingLayout({ children, role = "Trainer" }) {
    const trainingLinks = [
        {
            label: "F02-A Standard Templates",
            path: "/training/templates",
        },
        {
            label: "F02-B Training Plans",
            path: "/training/plans",
        },
        {
            label: "F02-C Training Sessions",
            path: "/training/sessions",
        },
        {
            label: "F02-D Work Rider Execution",
            path: "/training/work-rider",
        },
        {
            label: "F02-E Trainer Evaluation",
            path: "/training/evaluation",
        },
        {
            label: "F02-F Training Dashboard",
            path: "/training",
        },
    ];

    return (
        <div className="training-app">
            <aside className="training-sidebar">
                <div className="training-sidebar-section">
                    <div className="training-sidebar-title">
                        TRAINING
                    </div>

                    {trainingLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            end={link.path === "/training"}
                            className={({ isActive }) =>
                                `training-nav-link ${isActive ? "active" : ""
                                }`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </div>

                <div className="training-current-user">
                    <span>CURRENT ACTOR</span>
                    <strong>{role}</strong>
                    <small>
                        Training screens
                        <br />
                        for assigned horses
                    </small>
                </div>
            </aside>

            <main className="training-main">
                <header className="training-header">
                    <div>
                        <div className="training-header-system">
                            SWP391 · Racehorse Management · Flow 2
                        </div>

                        <h1>Training</h1>
                    </div>

                    <div className="training-role">
                        {role}
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
}

export default TrainingLayout;