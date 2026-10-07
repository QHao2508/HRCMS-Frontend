import { useCallback, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { canManagePlan, createPlanMutation, getTrainingPlan, updateTrainingPlan, updateTrainingPlanStatus } from "../../services/trainingPlanService.js";
import TrainingPlanError from "../../components/training/TrainingPlanError.jsx";
import TrainingPlanForm from "../../components/training/TrainingPlanForm.jsx";
import TrainingPlanMedicalContext from "../../components/training/TrainingPlanMedicalContext.jsx";
import TrainingSessions from "../../components/training/TrainingSessions.jsx";
import TrainingSessionForm, { RiderAssignmentForm } from "../../components/training/TrainingSessionForm.jsx";
import TrainingSessionError from "../../components/training/TrainingSessionError.jsx";
import { SkipSessionForm, StartSessionConfirmation, TrainingResultForm } from "../../components/training/TrainingExecutionForms.jsx";
import { assignTrainingSession, createSessionMutation, createTrainingSession, listWorkRiderCandidates, skipTrainingSession,
    startTrainingSession, submitTrainingSessionResult, updateTrainingSession } from "../../services/trainingSessionService.js";

function Fields({ values }) {
    return <dl className="row mb-0">{values.map(([label, value]) => <div className="col-12 col-lg-6" key={label}><dt>{label}</dt>
        <dd>{value === null || value === undefined || value === "" ? "Not provided" : value}</dd></div>)}</dl>;
}

export function PlanStatusControls({ plan, busy, selected, onSelect, onCancel, onConfirm }) {
    if (!["Active", "Paused"].includes(plan.status)) return <p>This plan is in a terminal state and cannot be reopened.</p>;
    const choices = plan.status === "Active" ? ["Paused", "Completed", "Archived"] : ["Active", "Completed", "Archived"];
    return <section className="border rounded p-3 mb-3" aria-label="Training Plan status controls"><h2 className="h5">Plan status</h2>
        {!selected ? <div className="d-flex flex-wrap gap-2">{choices.map((status) => <button className="btn btn-outline-primary" disabled={busy} key={status} onClick={() => onSelect(status)}>
            {status === "Active" ? "Resume plan" : status === "Paused" ? "Pause plan" : `${status} plan`}</button>)}</div> : <div className="alert alert-warning mb-0">
            <p>Confirm changing this plan from {plan.status} to {selected}. Backend session-state checks remain authoritative.{selected === "Archived" ? " Archived plans cannot be reopened." : ""}</p>
            <button className="btn btn-primary me-2" disabled={busy} onClick={() => onConfirm(selected)}>Confirm status change</button>
            <button className="btn btn-outline-secondary" disabled={busy} onClick={onCancel}>Cancel</button>
        </div>}
    </section>;
}

export function TrainingPlanDetailContent({ detail, user, canManage, editing, statusChoice, busy, error, sessionBusy = false, sessionError,
    onEdit, onCancelEdit, onSave, onSelectStatus, onCancelStatus, onStatus, onReload, onCreateSession, onEditSession, onAssignSession,
    onStartSession, onResultSession, onSkipSession, onSessionPage }) {
    const { plan, horseDetail, restrictions } = detail;
    return <>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3"><div><h1>{plan.goal || "Training Plan"}</h1>
            <p className="mb-0">Status: <strong>{plan.status}</strong></p></div>
            {canManage && !editing && ["Active", "Paused"].includes(plan.status) && <button className="btn btn-outline-primary" disabled={busy || !!error?.requiresReload} onClick={onEdit}>Edit plan</button>}
        </div>
        {error && <TrainingPlanError error={error} />}
        {error?.requiresReload && <div className="alert alert-warning">The mutation result or current plan state must be reconciled before another change.
            <button className="btn btn-outline-primary ms-2" onClick={onReload}>Reload plan</button></div>}
        {editing ? <TrainingPlanForm plan={plan} busy={busy} onSave={onSave} onCancel={onCancelEdit} /> : <section className="border rounded p-3 my-3"><h2 className="h5">Plan information</h2>
            <Fields values={[["Plan ID", plan.id], ["Horse ID", plan.horseId], ["Template ID", plan.templateId], ["Recorded trainer ID", plan.trainerId],
                ["Goal", plan.goal], ["Phase", plan.phase], ["Start date", plan.startDate], ["End date", plan.endDate], ["Notes", plan.notes]]} />
            <p className="text-body-secondary">The template ID is the only template reference returned by plan detail; no template detail endpoint exists.</p>
        </section>}
        <TrainingPlanMedicalContext horseDetail={horseDetail} restrictions={restrictions} />
        {sessionError && <><TrainingSessionError error={sessionError} />{sessionError.requiresReload && <div className="alert alert-warning">Reconcile the authoritative plan before another session change.
            <button className="btn btn-outline-primary ms-2" onClick={onReload}>Reload plan</button></div>}</>}
        <TrainingSessions detail={detail} user={user} canManage={canManage} busy={sessionBusy} blocked={!!sessionError?.requiresReload}
            onCreate={onCreateSession} onEdit={onEditSession} onAssign={onAssignSession} onStart={onStartSession}
            onResult={onResultSession} onSkip={onSkipSession} onPage={onSessionPage} />
        {canManage && !editing && <PlanStatusControls plan={plan} busy={busy || !!error?.requiresReload} selected={statusChoice}
            onSelect={onSelectStatus} onCancel={onCancelStatus} onConfirm={onStatus} />}
    </>;
}

function LoadedPlan({ initialDetail, user, onReload }) {
    const [detail, setDetail] = useState(initialDetail);
    const [editing, setEditing] = useState(false);
    const [statusChoice, setStatusChoice] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [sessionError, setSessionError] = useState(null);
    const [sessionMode, setSessionMode] = useState(null);
    const [sessionBusy, setSessionBusy] = useState(false);
    const mutation = useRef(createPlanMutation((operation) => operation()));
    const sessionMutation = useRef(createSessionMutation((operation) => operation()));
    const saving = useRef(false);
    const canManage = canManagePlan(user, detail.horseDetail);
    async function perform(operation) {
        if (saving.current || error?.requiresReload || !canManage) return;
        saving.current = true; setBusy(true); setError(null);
        try {
            const refreshed = await mutation.current(operation);
            if (refreshed) { setDetail(refreshed); setEditing(false); setStatusChoice(""); }
        } catch (failure) { setError(failure); }
        finally { saving.current = false; setBusy(false); }
    }
    async function performSession(operation) {
        if (saving.current || sessionError?.requiresReload || !canManage && user?.role !== "WorkRider") return;
        saving.current = true; setSessionBusy(true); setSessionError(null);
        try {
            const refreshed = await sessionMutation.current(operation);
            if (refreshed) { setDetail(refreshed); setSessionMode(null); }
        } catch (failure) { setSessionError(failure); }
        finally { saving.current = false; setSessionBusy(false); }
    }
    async function sessionPage(page) {
        if (saving.current || sessionBusy) return;
        saving.current = true; setSessionBusy(true); setSessionError(null); setSessionMode(null);
        try { setDetail(await getTrainingPlan(detail.plan.id, { sessionPage: page, sessionPageSize: detail.sessionPageSize })); }
        catch (failure) { setSessionError(failure); }
        finally { saving.current = false; setSessionBusy(false); }
    }
    return <><TrainingPlanDetailContent {...{ detail, user, canManage, editing, statusChoice, busy, error, sessionBusy, sessionError }}
        onEdit={() => { setEditing(true); setStatusChoice(""); setError(null); }} onCancelEdit={() => setEditing(false)}
        onSave={(values) => perform(() => updateTrainingPlan(detail, values))}
        onSelectStatus={(status) => { setStatusChoice(status); setError(null); }} onCancelStatus={() => setStatusChoice("")}
        onStatus={(status) => perform(() => updateTrainingPlanStatus(detail, status))} onReload={onReload}
        onCreateSession={() => { setSessionMode({ type: "create" }); setSessionError(null); }}
        onEditSession={(session) => { setSessionMode({ type: "edit", session }); setSessionError(null); }}
        onAssignSession={(session) => { setSessionMode({ type: "assign", session }); setSessionError(null); }}
        onStartSession={(session) => { setSessionMode({ type: "start", session }); setSessionError(null); }}
        onResultSession={(session) => { setSessionMode({ type: "result", session }); setSessionError(null); }}
        onSkipSession={(session) => { setSessionMode({ type: "skip", session }); setSessionError(null); }} onSessionPage={sessionPage} />
        {sessionMode && ["create", "edit", "assign"].includes(sessionMode.type) && canManage && <SessionPlanningEditor detail={detail} mode={sessionMode} busy={sessionBusy || !!sessionError?.requiresReload}
            onCancel={() => setSessionMode(null)} onCreate={(values, rider) => performSession(() => createTrainingSession(detail, values, rider))}
            onEdit={(session, values, rider) => performSession(() => updateTrainingSession(detail, session, values, rider))}
            onAssign={(session, rider) => performSession(() => assignTrainingSession(detail, session, rider))} />}
        {sessionMode && ["start", "result", "skip"].includes(sessionMode.type) && (canManage || user?.role === "WorkRider")
            && <SessionExecutionEditor mode={sessionMode} busy={sessionBusy || !!sessionError?.requiresReload} onCancel={() => setSessionMode(null)}
                onStart={(session) => performSession(() => startTrainingSession(detail, session, user))}
                onResult={(session, values) => performSession(() => submitTrainingSessionResult(detail, session, user, values))}
                onSkip={(session, reason) => performSession(() => skipTrainingSession(detail, session, user, reason))} />}
    </>;
}

function SessionPlanningEditor({ detail, mode, busy, onCancel, onCreate, onEdit, onAssign }) {
    const load = useCallback(() => listWorkRiderCandidates(), []);
    const candidates = useRegistrationResource(load);
    return <section aria-label="Training Session editor">
        {candidates.error && <button type="button" className="btn btn-outline-secondary mb-2" onClick={candidates.reload}>Retry WorkRider candidates</button>}
        {mode.type === "assign" ? <RiderAssignmentForm session={mode.session} candidates={candidates} busy={busy}
            onSave={(rider) => onAssign(mode.session, rider)} onCancel={onCancel} />
            : <TrainingSessionForm detail={detail} session={mode.session} candidates={candidates} busy={busy}
                onSave={(values, rider) => mode.type === "create" ? onCreate(values, rider) : onEdit(mode.session, values, rider)} onCancel={onCancel} />}
    </section>;
}

function SessionExecutionEditor({ mode, busy, onCancel, onStart, onResult, onSkip }) {
    if (mode.type === "start") return <StartSessionConfirmation session={mode.session} busy={busy} onConfirm={() => onStart(mode.session)} onCancel={onCancel} />;
    if (mode.type === "result") return <TrainingResultForm session={mode.session} busy={busy} onSave={(values) => onResult(mode.session, values)} onCancel={onCancel} />;
    return <SkipSessionForm session={mode.session} busy={busy} onSave={(reason) => onSkip(mode.session, reason)} onCancel={onCancel} />;
}

export function TrainingPlanDetailResult({ resource, user }) {
    if (resource.loading) return <p role="status">Loading Training Plan...</p>;
    if (resource.error) return <><TrainingPlanError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>Retry Training Plan</button></>;
    return <LoadedPlan key={`${resource.data.plan.id}:${resource.data.plan.version}`} initialDetail={resource.data} user={user} onReload={resource.reload} />;
}

export default function TrainingPlanDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const load = useCallback(() => getTrainingPlan(id), [id]);
    const resource = useRegistrationResource(load);
    return <section><Link to="/training/plans">Back to Training Plans</Link><TrainingPlanDetailResult resource={resource} user={user} /></section>;
}
