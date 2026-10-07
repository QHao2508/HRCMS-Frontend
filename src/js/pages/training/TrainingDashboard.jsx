import TrainingLayout from "../../components/training/TrainingLayout";

const kpis = [
    {
        label: "Active Plans",
        value: "8",
        description: "6 on active plans",
    },
    {
        label: "Today's Sessions",
        value: "6",
        description: "4 completed · 1 assigned · 1 overdue",
    },
    {
        label: "Completion Rate",
        value: "80%",
        description: "20 completed / 25 sessions",
    },
    {
        label: "Horses Requiring Attention",
        value: "3",
        description: "3 active horses with alerts",
    },
];

const targetRows = [
    {
        horse: "Silver Comet",
        session: "SES-0902-1002",
        target: "1,200 m",
        actual: "1,200 m",
        adherence: "100%",
    },
    {
        horse: "Northern Star",
        session: "SES-0903-1002",
        target: "800 m",
        actual: "780 m",
        adherence: "97.5%",
    },
    {
        horse: "Blue Horizon",
        session: "SES-0910-1002",
        target: "1,000 m",
        actual: "900 m",
        adherence: "90%",
    },
];

const attentionRows = [
    {
        horse: "Training Lock · Northern Star",
        reason: "MED-TR-1028 · Rider missing pace assessment",
        action: "Training / exercise blocked",
    },
    {
        horse: "Overdue Session · Blue Horizon",
        reason: "SES-0910-1002 · 06:00 · no completion result",
        action: "Trainer review required",
    },
    {
        horse: "Abnormal Result · Silver Comet",
        reason: "SES-0910-1022 · Rider observation",
        action: "Trainer evaluate",
    },
];

function TrainingDashboard() {
    return (
        <TrainingLayout role="Trainer">
            <div className="training-content">

                <div className="training-breadcrumb">
                    Training / Dashboard
                </div>

                <div className="training-page-title-row">
                    <div>
                        <h2>Training Dashboard</h2>
                        <p>
                            Illustrative snapshot · 02 Oct 2026, 10:30 ·
                            Assigned horses · 7-day trends ending 02 Oct
                        </p>
                    </div>

                    <button className="training-button primary">
                        View Reports
                    </button>
                </div>

                {/* KPI */}
                <section className="training-kpi-grid">
                    {kpis.map((kpi) => (
                        <div className="training-card kpi-card" key={kpi.label}>
                            <span>{kpi.label}</span>
                            <strong>{kpi.value}</strong>
                            <small>{kpi.description}</small>
                        </div>
                    ))}
                </section>

                {/* Charts */}
                <section className="training-chart-grid">

                    <div className="training-card">
                        <div className="training-card-header">
                            <div>
                                <h3>Training Volume / Workload Trend</h3>
                                <span>
                                    Completed distance (km) · daily · last 7 days
                                </span>
                            </div>
                        </div>

                        <div className="fake-chart bar-chart">
                            {[34, 28, 36, 42, 31, 39, 27].map(
                                (height, index) => (
                                    <div
                                        className="bar-column"
                                        key={index}
                                    >
                                        <div
                                            className="bar"
                                            style={{
                                                height: `${height * 2}px`,
                                            }}
                                        />
                                        <small>
                                            {index + 26} Sep
                                        </small>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    <div className="training-card">
                        <div className="training-card-header">
                            <div>
                                <h3>Performance Trend</h3>
                                <span>
                                    Average adherence · daily
                                </span>
                            </div>
                        </div>

                        <div className="performance-chart">
                            {[80, 86, 82, 91, 88, 95, 94].map(
                                (value, index) => (
                                    <div
                                        className="performance-point"
                                        key={index}
                                        style={{
                                            height: `${value - 50}px`,
                                        }}
                                    >
                                        <span>{value}</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                </section>

                {/* Target vs actual */}
                <section className="training-card">
                    <div className="training-card-header">
                        <div>
                            <h3>
                                Target vs Actual — comparable completed
                                sessions
                            </h3>
                            <span>02 Oct</span>
                        </div>
                    </div>

                    <div className="training-table-wrapper">
                        <table className="training-table">
                            <thead>
                                <tr>
                                    <th>Horse / Session</th>
                                    <th>Target Distance</th>
                                    <th>Actual Distance</th>
                                    <th>Adherence</th>
                                </tr>
                            </thead>

                            <tbody>
                                {targetRows.map((row) => (
                                    <tr key={row.session}>
                                        <td>
                                            <strong>{row.horse}</strong>
                                            <small>{row.session}</small>
                                        </td>
                                        <td>{row.target}</td>
                                        <td>{row.actual}</td>
                                        <td>{row.adherence}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Attention */}
                <section className="training-card">
                    <div className="training-card-header">
                        <div>
                            <h3>
                                Horses Requiring Attention — 3 distinct
                                horses
                            </h3>
                        </div>
                    </div>

                    <div className="training-table-wrapper">
                        <table className="training-table">
                            <thead>
                                <tr>
                                    <th>Alert / Horse</th>
                                    <th>Reason / Source</th>
                                    <th>Action State</th>
                                </tr>
                            </thead>

                            <tbody>
                                {attentionRows.map((row) => (
                                    <tr key={row.horse}>
                                        <td>
                                            <strong>{row.horse}</strong>
                                        </td>
                                        <td>{row.reason}</td>
                                        <td>
                                            <span className="training-badge warning">
                                                {row.action}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Medical warning */}
                <div className="training-alert warning">
                    <strong>
                        Medical authority remains with Veterinarian
                    </strong>
                    <span>
                        Trainer may evaluate results and manage permitted
                        sessions. Medical Lock / Training Lock and
                        incompatible restrictions block training; no
                        override is available.
                    </span>
                </div>

            </div>
        </TrainingLayout>
    );
}

export default TrainingDashboard;