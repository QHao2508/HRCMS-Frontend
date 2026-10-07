import { useCallback, useRef, useState } from "react";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { ROLES } from "../../constants/roles.js";
import TrainingTemplateForm from "../../components/training/TrainingTemplateForm.jsx";
import TrainingTemplateError from "../../components/training/TrainingTemplateError.jsx";
import { archiveTrainingTemplate, createTemplateMutation, createTrainingTemplate, listTrainingTemplates, runTemplateMutation, updateTrainingTemplate } from "../../services/trainingTemplateService.js";

export function TrainingTemplateResults({ resource, canManage, blocked, editing, confirming, onEdit, onArchive, onCancelArchive, onConfirmArchive, onPage }) {
    if (resource.loading) return <p role="status">Loading Training Templates...</p>;
    if (resource.error) return <><TrainingTemplateError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>Retry Training Templates</button></>;
    const { items, page, pageSize, total } = resource.data;
    return <>
        {!items.length ? <p>No active Training Templates are available.</p> : <div className="table-responsive"><table className="table align-middle">
            <thead><tr><th>Name</th><th>Goal</th><th>Phase</th><th>Distance</th><th>Intensity</th><th>Surface</th><th>Frequency</th>{canManage && <th>Actions</th>}</tr></thead>
            <tbody>{items.map((template) => <tr key={template.id}>
                <td>{template.name}</td><td>{template.goal}</td><td>{template.phase}</td><td>{template.distanceMetres} m</td>
                <td>{template.intensity}</td><td>{template.surface}</td><td>{template.frequencyPerWeek}/week</td>
                {canManage && <td>{template.archived === false ? confirming === template.id ? <div className="alert alert-warning mb-0">
                    <p>Archive {template.name}? It will leave the active list and cannot be restored in this application.</p>
                    <button className="btn btn-danger btn-sm me-2" disabled={blocked} onClick={() => onConfirmArchive(template)}>Confirm archive</button>
                    <button className="btn btn-outline-secondary btn-sm" disabled={blocked} onClick={onCancelArchive}>Keep template</button>
                </div> : <>
                    <button className="btn btn-outline-primary btn-sm me-2" disabled={blocked || !!editing} onClick={() => onEdit(template)}>Edit</button>
                    <button className="btn btn-outline-danger btn-sm" disabled={blocked || !!editing} onClick={() => onArchive(template.id)}>Archive</button>
                </> : <span>Archived — read only</span>}</td>}
            </tr>)}</tbody>
        </table></div>}
        <nav className="d-flex flex-wrap align-items-center gap-3" aria-label="Training Template pages">
            <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
            <span>Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} templates</span>
            <button className="btn btn-outline-secondary" disabled={page * pageSize >= total} onClick={() => onPage(page + 1)}>Next</button>
        </nav>
    </>;
}

export default function TrainingTemplates() {
    const { user } = useAuth();
    const canManage = user?.role === ROLES.HeadTrainer;
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);
    const [confirming, setConfirming] = useState(null);
    const [busy, setBusy] = useState(false);
    const [mutationError, setMutationError] = useState(null);
    const [success, setSuccess] = useState("");
    const load = useCallback(() => listTrainingTemplates({ page, pageSize: 20 }), [page]);
    const resource = useRegistrationResource(load);
    const mutate = useRef(createTemplateMutation((operation) => operation()));
    const blocked = busy || !!mutationError?.requiresReload;

    async function perform(operation, message) {
        if (blocked) return;
        setBusy(true); setMutationError(null); setSuccess("");
        try {
            const result = await runTemplateMutation(() => mutate.current(operation), resource.reload);
            if (result === null) return;
            setEditing(null); setCreating(false); setConfirming(null); setSuccess(message);
        } catch (error) { setMutationError(error); }
        finally { setBusy(false); }
    }
    function reload() {
        setMutationError(null); setSuccess(""); setEditing(null); setCreating(false); setConfirming(null);
        mutate.current = createTemplateMutation((operation) => operation());
        resource.reload();
    }

    return <section><div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div><h1>Training Templates</h1><p className="mb-0">Reusable standards for future Horse Training Plans. Templates do not create plans or sessions.</p></div>
        {canManage && <button className="btn btn-primary" disabled={blocked || creating || !!editing} onClick={() => { setCreating(true); setConfirming(null); setMutationError(null); }}>Create template</button>}
    </div>
    {success && <p className="alert alert-success" role="status">{success} Refreshing the authoritative template list.</p>}
    {mutationError && <TrainingTemplateError error={mutationError} />}
    {mutationError?.requiresReload && <div className="alert alert-warning">The mutation result or current template state must be reconciled before another change.
        <button className="btn btn-outline-primary ms-2" onClick={reload}>Reload templates</button></div>}
    {canManage && creating && <TrainingTemplateForm busy={busy} onCancel={() => setCreating(false)}
        onSave={(values) => perform(() => createTrainingTemplate(values), "Template created.")} />}
    {canManage && editing && <TrainingTemplateForm key={editing.id} template={editing} busy={busy} onCancel={() => setEditing(null)}
        onSave={(values) => perform(() => updateTrainingTemplate(editing, values), "Template updated.")} />}
    <TrainingTemplateResults resource={resource} canManage={canManage} blocked={blocked} editing={editing} confirming={confirming}
        onEdit={(template) => { setEditing(template); setCreating(false); setConfirming(null); setMutationError(null); }}
        onArchive={(id) => { setConfirming(id); setCreating(false); setEditing(null); }} onCancelArchive={() => setConfirming(null)}
        onConfirmArchive={(template) => perform(() => archiveTrainingTemplate(template).then(() => true), "Template archived.")}
        onPage={(next) => { setPage(next); setEditing(null); setCreating(false); setConfirming(null); setMutationError(null); }} />
    </section>;
}
