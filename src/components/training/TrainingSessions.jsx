import { TRAINING_SESSION_EDITABLE_STATUSES } from "../../constants/training.js";
import { isAssignedWorkRider } from "../../services/trainingSessionModel.js";

export default function TrainingSessions({ detail, user, canManage, busy, blocked, onCreate, onEdit, onAssign, onStart, onResult, onSkip, onReview, onPage }) {
    const { plan, sessions, sessionPage, sessionPageSize, sessionTotal } = detail;
    const pages = Math.max(1, Math.ceil(sessionTotal / sessionPageSize));
    const permitsMutation = canManage && plan.status === "Active" && !blocked;
    const hasReviewableSession = sessions.some((session) => ["Completed", "IssueReported"].includes(session.status)
        && (user?.role !== "WorkRider" || isAssignedWorkRider(user, session)));
    const showActions = ((canManage || user?.role === "WorkRider") && !blocked) || !!onReview && hasReviewableSession;
    return <section className="border rounded p-3 mb-3" aria-label="Training Sessions">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2"><div><h2 className="h5">Training Sessions</h2>
            <p className="mb-0">{sessionTotal} sessions are recorded.</p></div>
            {permitsMutation && <button className="btn btn-primary" disabled={busy} onClick={onCreate}>Create Training Session</button>}
        </div>
        {!sessions.length ? <p className="mt-3">No Training Sessions are available on this page.</p> : <div className="table-responsive mt-3"><table className="table align-middle">
            <thead><tr><th>Scheduled instant</th><th>Type</th><th>Distance</th><th>Intensity</th><th>Surface / target</th><th>Rider</th><th>Status</th><th>Started</th>{showActions && <th>Available actions</th>}</tr></thead>
            <tbody>{sessions.map((session) => {
                const editable = permitsMutation && TRAINING_SESSION_EDITABLE_STATUSES.includes(session.status);
                const assignedRider = isAssignedWorkRider(user, session);
                const canStart = assignedRider && session.status === "Assigned" && plan.status === "Active";
                const canResult = assignedRider && session.status === "InProgress";
                const canSkip = (assignedRider || canManage) && ["Planned", "Assigned", "InProgress"].includes(session.status);
                const canReview = !!onReview && ["Completed", "IssueReported"].includes(session.status)
                    && (user?.role !== "WorkRider" || assignedRider);
                return <tr key={session.id}><td><time dateTime={session.scheduledAt}>{session.scheduledAt}</time></td><td>{session.trainingType}</td>
                    <td>{session.distanceMetres} m</td><td>{session.intensity}</td><td>{session.surface}<br />{session.target}<br />{session.notes || "No notes"}</td>
                    <td>{session.riderId || "Unassigned"}</td><td>{session.status}</td><td>{session.startedAt || "Not started"}</td>
                    {showActions && <td><div className="d-flex flex-wrap gap-2">
                        {editable && <><button className="btn btn-sm btn-outline-primary" disabled={busy} onClick={() => onEdit(session)}>Edit</button>
                            <button className="btn btn-sm btn-outline-primary" disabled={busy} onClick={() => onAssign(session)}>{session.riderId ? "Change rider" : "Assign rider"}</button></>}
                        {canStart && <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => onStart(session)}>Start session</button>}
                        {canResult && <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => onResult(session)}>Submit result</button>}
                        {canSkip && <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => onSkip(session)}>Skip session</button>}
                        {canReview && <button className="btn btn-sm btn-outline-primary" disabled={busy} onClick={() => onReview(session)}>Review result</button>}
                        {!editable && !canStart && !canResult && !canSkip && !canReview && <span>Read only after start / terminal</span>}
                    </div></td>}</tr>;
            })}</tbody>
        </table></div>}
        <nav className="d-flex flex-wrap align-items-center gap-3" aria-label="Training Session pages">
            <button className="btn btn-outline-secondary" disabled={busy || sessionPage <= 1} onClick={() => onPage(sessionPage - 1)}>Previous sessions</button>
            <span>Session page {sessionPage} of {pages}</span>
            <button className="btn btn-outline-secondary" disabled={busy || sessionPage * sessionPageSize >= sessionTotal} onClick={() => onPage(sessionPage + 1)}>Next sessions</button>
        </nav>
        {canManage && plan.status !== "Active" && <p className="text-body-secondary mt-3 mb-0">Session planning is read-only unless the Training Plan is Active.</p>}
    </section>;
}
