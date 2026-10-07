import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { ROLES } from "../../constants/roles.js";
import { listTrainingPlans } from "../../services/trainingPlanService.js";
import TrainingPlanError from "../../components/training/TrainingPlanError.jsx";

export function TrainingPlanListResults({ resource, onPage }) {
    if (resource.loading) return <p role="status">Loading Training Plans...</p>;
    if (resource.error) return <><TrainingPlanError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>Retry Training Plans</button></>;
    const { items, page, pageSize, total } = resource.data;
    return <>{!items.length ? <p>No Training Plans are available within your access scope.</p> : <div className="table-responsive"><table className="table align-middle">
        <thead><tr><th>Horse ID</th><th>Template ID</th><th>Goal</th><th>Phase</th><th>Dates</th><th>Status</th><th>Detail</th></tr></thead>
        <tbody>{items.map((plan) => <tr key={plan.id}><td>{plan.horseId}</td><td>{plan.templateId}</td><td>{plan.goal}</td><td>{plan.phase}</td>
            <td>{plan.startDate} to {plan.endDate}</td><td>{plan.status}</td><td><Link to={`/training/plans/${encodeURIComponent(plan.id)}`}>View plan</Link></td></tr>)}</tbody>
    </table></div>}
    <nav className="d-flex flex-wrap align-items-center gap-3" aria-label="Training Plan pages">
        <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <span>Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} plans</span>
        <button className="btn btn-outline-secondary" disabled={page * pageSize >= total} onClick={() => onPage(page + 1)}>Next</button>
    </nav></>;
}

export default function TrainingPlanList() {
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const load = useCallback(() => listTrainingPlans({ page, pageSize: 20 }), [page]);
    const resource = useRegistrationResource(load);
    return <section><div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><div><h1>Training Plans</h1>
        <p className="mb-0">Plans are scoped by Horse access and assignments.</p></div>
        {user?.role === ROLES.Trainer && <Link className="btn btn-primary" to="/training/plans/new">Create Training Plan</Link>}</div>
        <TrainingPlanListResults resource={resource} onPage={setPage} />
    </section>;
}
