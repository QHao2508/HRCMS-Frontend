import { useCallback, useState } from "react";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { listTrainingHistory } from "../../services/trainingPlanService.js";
import TrainingPlanError from "./TrainingPlanError.jsx";

function snapshotText(snapshot) {
    try { return JSON.stringify(JSON.parse(snapshot), null, 2); }
    catch { return snapshot; }
}

export function TrainingHistoryResult({ resource, onPage }) {
    if (resource.loading) return <p role="status">Loading Training History...</p>;
    if (resource.error) return <><TrainingPlanError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>Retry Training History</button></>;
    const { items, page, pageSize, total } = resource.data;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    return <>{!items.length ? <p>No Training History is recorded.</p> : <div className="vstack gap-3">{items.map((revision) => <article className="border rounded p-3" key={revision.id}>
        <h3 className="h6">{revision.sessionId ? "Training Session revision" : "Training Plan revision"}</h3>
        <dl className="row mb-2"><div className="col-md-6"><dt>Recorded</dt><dd><time dateTime={revision.createdAt}>{revision.createdAt}</time></dd></div>
            <div className="col-md-6"><dt>Actor ID</dt><dd>{revision.actorId}</dd></div>
            {revision.sessionId && <div className="col-12"><dt>Session ID</dt><dd>{revision.sessionId}</dd></div>}</dl>
        <details><summary>View recorded snapshot</summary><pre className="bg-body-tertiary border rounded p-2 mt-2 mb-0 text-wrap">{snapshotText(revision.snapshot)}</pre></details>
    </article>)}</div>}
        <nav className="d-flex flex-wrap align-items-center gap-3 mt-3" aria-label="Training History pages">
            <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous history</button>
            <span>History page {page} of {pages}</span>
            <button className="btn btn-outline-secondary" disabled={page * pageSize >= total} onClick={() => onPage(page + 1)}>Next history</button>
        </nav></>;
}

export default function TrainingHistory({ planId }) {
    const [page, setPage] = useState(1);
    const load = useCallback(() => listTrainingHistory(planId, { page, pageSize: 20 }), [planId, page]);
    const resource = useRegistrationResource(load);
    return <section className="border rounded p-3 mb-3" aria-label="Training History"><h2 className="h5">Training History</h2>
        <p className="text-body-secondary">Read-only snapshots recorded by the backend, newest first.</p>
        <TrainingHistoryResult resource={resource} onPage={setPage} />
    </section>;
}
