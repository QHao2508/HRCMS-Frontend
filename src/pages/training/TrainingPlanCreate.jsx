import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { getHorse } from "../../services/horseService.js";
import { listAllTrainingTemplates } from "../../services/trainingTemplateService.js";
import { canManagePlan, createPlanMutation, createTrainingPlan, listAllTrainerHorses } from "../../services/trainingPlanService.js";
import TrainingPlanForm from "../../components/training/TrainingPlanForm.jsx";
import TrainingPlanError from "../../components/training/TrainingPlanError.jsx";

export default function TrainingPlanCreate() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const loadHorses = useCallback(() => listAllTrainerHorses(), []);
    const loadTemplates = useCallback(() => listAllTrainingTemplates(), []);
    const horses = useRegistrationResource(loadHorses);
    const templates = useRegistrationResource(loadTemplates);
    const submit = useRef(createPlanMutation(createTrainingPlan));
    const saving = useRef(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    async function save(values) {
        if (saving.current || error?.requiresReload) return;
        saving.current = true; setBusy(true); setError(null);
        try {
            const horseDetail = await getHorse(values.horseId);
            if (!canManagePlan(user, horseDetail)) {
                const denied = new Error("Only the currently assigned Trainer may create a plan for this Horse."); denied.status = 403; throw denied;
            }
            const selected = templates.data.find((template) => template.id === values.templateId && template.archived === false);
            const detail = await submit.current(values, selected);
            if (detail) navigate(`/training/plans/${encodeURIComponent(detail.plan.id)}`, { replace: true });
        } catch (failure) { setError(failure); }
        finally { saving.current = false; setBusy(false); }
    }
    if (horses.loading || templates.loading) return <p role="status">Loading Training Plan choices...</p>;
    if (horses.error || templates.error) {
        const failed = horses.error ? horses : templates;
        return <section><h1>Create Training Plan</h1><TrainingPlanError error={failed.error} />
            <button className="btn btn-outline-primary" onClick={failed.reload}>Retry choices</button></section>;
    }
    return <section><Link to="/training/plans">Back to Training Plans</Link><h1 className="mt-3">Create Training Plan</h1>
        {!horses.data.length && <p className="alert alert-warning">No currently assigned Horses were returned for this Trainer.</p>}
        {!templates.data.length && <p className="alert alert-warning">No active Training Templates are available.</p>}
        {error && <TrainingPlanError error={error} />}
        {error?.requiresReload && <p className="alert alert-warning">The create result must be reconciled from the Training Plan list before another submission.</p>}
        <TrainingPlanForm horses={horses.data} templates={templates.data} busy={busy || !!error?.requiresReload} onSave={save} onCancel={() => navigate("/training/plans")} />
    </section>;
}
