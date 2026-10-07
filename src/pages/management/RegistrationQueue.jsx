import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { listRegistrations } from "../../services/registrationService.js";
import { REGISTRATION_STATUS, statusDisplay } from "../../constants/registration.js";
import { canReview } from "../../services/managerReviewService.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import RegistrationStatus from "../../components/registrations/RegistrationStatus.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";

export function RegistrationQueueResults({ resource, onPage }) {
    if (resource.loading) return <p role="status">Loading review queue...</p>;
    if (resource.error) return <><RegistrationError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>Retry queue</button></>;
    const { items, page, pageSize, total } = resource.data;
    return <>
        {!items.length ? <p>No registrations match this filter.</p> : <div className="table-responsive"><table className="table align-middle">
            <thead><tr><th>Horse</th><th>Status</th><th>Owner ID</th><th>Created</th><th>Action</th></tr></thead>
            <tbody>{items.map((record) => <tr key={record.id}>
                <td>{record.name || "Unnamed registration"}</td><td><RegistrationStatus status={record.status} /></td>
                <td>{record.ownerId}</td><td>{record.createdAt?.slice(0, 10) || "Not provided"}</td>
                <td><Link to={`/management/registrations/${encodeURIComponent(record.id)}`}>{canReview(record.status) ? "Review" : "View"}</Link></td>
            </tr>)}</tbody>
        </table></div>}
        <nav aria-label="Review queue pages" className="d-flex align-items-center gap-3">
            <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
            <span>Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} registrations</span>
            <button className="btn btn-outline-secondary" disabled={page * pageSize >= total} onClick={() => onPage(page + 1)}>Next</button>
        </nav>
    </>;
}
export default function RegistrationQueue() {
    const [filter, setFilter] = useState({ status: REGISTRATION_STATUS.PendingReview, page: 1 });
    const load = useCallback(() => listRegistrations(filter), [filter]);
    const resource = useRegistrationResource(load);
    return <section><h1>Registration review queue</h1><p>Only registrations pending review can be edited or reviewed.</p>
        <label className="form-label" htmlFor="review-status-filter">Status</label>
        <select id="review-status-filter" className="form-select mb-3" value={filter.status} onChange={(event) => setFilter({ status: event.target.value, page: 1 })}>
            <option value="">All statuses</option>{Object.values(REGISTRATION_STATUS).map((status) => <option key={status} value={status}>{statusDisplay(status).label}</option>)}
        </select>
        <RegistrationQueueResults resource={resource} onPage={(page) => setFilter({ ...filter, page })} />
    </section>;
}
