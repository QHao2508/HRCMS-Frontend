import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Eye, Pencil, Plus, ShieldAlert, UserRound, X } from "lucide-react";

import TrainingLayout from "../../components/training/TrainingLayout";
import {
    createTrainingSession,
    getHorseMedicalSummary,
    getHorses,
    getTrainingPlans,
    getTrainingSessions,
    getTrainingTemplates,
    getWorkRiders,
    startTrainingSession,
    assignTrainingSession,
    skipTrainingSession,
    updateTrainingSession,
} from "../../services/trainingService";

const emptyForm = {
    planId: "",
    scheduledAt: "",
    trainingType: "Walk",
    distanceMetres: "",
    intensity: "Light",
    surface: "",
    target: "",
    riderId: "",
    notes: "",
};

const SESSION_STATUSES = ["Planned", "Assigned", "InProgress", "Completed", "Skipped", "IssueReported"];
const TRAINING_TYPES = ["Walk", "Trot", "Canter", "Gallop", "Sprint", "Recovery"];
const INTENSITIES = ["Light", "Moderate", "Heavy"];

function listFromResponse(data) {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.data ?? data?.results ?? data?.plans ?? data?.sessions ?? data?.staff ?? [];
}

function firstDefined(object, keys, fallback = "") {
    for (const key of keys) {
        if (object?.[key] !== undefined && object?.[key] !== null) return object[key];
    }
    return fallback;
}

function idOf(object, keys = ["id", "Id"]) {
    return firstDefined(object, keys, "");
}

function labelHorse(horse) {
    return firstDefined(horse, ["name", "horseName", "Name", "HorseName"], "Unnamed horse");
}

function labelPlan(plan, horses) {
    const horseId = idOf(plan, ["horseId", "HorseId"]);
    const horse = horses.find((item) => idOf(item) === horseId);
    const horseName = horse ? labelHorse(horse) : firstDefined(plan, ["horseName", "HorseName"], "Horse");
    const goal = firstDefined(plan, ["goal", "trainingGoal", "Goal"], "Training Plan");
    return `${horseName} — ${goal}`;
}

function statusLabel(status) {
    return String(status || "Planned").replace("InProgress", "In Progress").replace("IssueReported", "Issue Reported");
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function toLocalInputValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function extractMedicalContext(data) {
    const source = data?.data ?? data?.summary ?? data ?? {};
    const restrictions = source?.restrictions ?? source?.medicalRestrictions ?? source?.activeRestrictions ?? [];
    return {
        healthStatus: firstDefined(source, ["healthStatus", "HealthStatus", "status", "Status"], "Unknown"),
        trainingLock: source?.trainingLock ?? source?.lock ?? source?.medicalTrainingLock ?? null,
        restrictions: Array.isArray(restrictions) ? restrictions : [],
    };
}

function restrictionBlocksSession(medical, form) {
    if (!medical) return { blocked: false, reasons: [] };
    const reasons = [];
    const lock = medical.trainingLock;
    const lockActive = lock === true || lock?.active === true || lock?.isActive === true || lock?.status === "Active";
    if (lockActive) reasons.push("Training Lock is active for this horse.");

    for (const restriction of medical.restrictions) {
        const active = restriction?.active !== false && restriction?.isActive !== false;
        if (!active) continue;
        if (restriction?.blockAllTraining === true) reasons.push(restriction.reason || "Medical restriction blocks all training.");

        const maxDistance = restriction?.maxDistanceMetres ?? restriction?.maximumDistanceMetres;
        if (maxDistance != null && Number(form.distanceMetres) > Number(maxDistance)) {
            reasons.push(`Maximum distance is ${maxDistance} metres.`);
        }

        const maxIntensity = restriction?.maxIntensity;
        if (maxIntensity) {
            const order = { Light: 1, Moderate: 2, Heavy: 3 };
            if ((order[form.intensity] || 0) > (order[maxIntensity] || 99)) {
                reasons.push(`Maximum allowed intensity is ${maxIntensity}.`);
            }
        }

        if (restriction?.noSprint === true && form.trainingType === "Sprint") {
            reasons.push("Sprint is prohibited by the active medical restriction.");
        }
    }

    return { blocked: reasons.length > 0, reasons };
}

function TrainingSessions() {
    const [sessions, setSessions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [horses, setHorses] = useState([]);
    const [riders, setRiders] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [medical, setMedical] = useState(null);
    const [medicalLoading, setMedicalLoading] = useState(false);

    const [selectedSession, setSelectedSession] = useState(null);
    const [skipReason, setSkipReason] = useState("");

    const loadSessions = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getTrainingSessions({ page: 1, pageSize: 100 });
            setSessions(listFromResponse(data));
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.title || "Unable to load training sessions.");
        } finally {
            setLoading(false);
        }
    };

    const loadSelectors = async () => {
        try {
            const [planData, horseData, riderData] = await Promise.all([
                getTrainingPlans(1, 100),
                getHorses(1, 100),
                getWorkRiders(1, 100),
            ]);
            setPlans(listFromResponse(planData));
            setHorses(listFromResponse(horseData));
            setRiders(listFromResponse(riderData));
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Unable to load plans, horses, or Work Riders.");
        }
    };

    useEffect(() => {
        loadSessions();
        loadSelectors();
    }, []);

    const filteredSessions = useMemo(() => {
        const query = search.trim().toLowerCase();
        return sessions.filter((session) => {
            const planId = firstDefined(session, ["planId", "PlanId"]);
            const plan = plans.find((item) => idOf(item) === planId);
            const horseId = firstDefined(session, ["horseId", "HorseId"]);
            const horse = horses.find((item) => idOf(item) === horseId);
            const horseName = horse ? labelHorse(horse) : firstDefined(session, ["horseName", "HorseName"], "");
            const type = firstDefined(session, ["trainingType", "TrainingType", "type"], "");
            const target = firstDefined(session, ["target", "Target"], "");
            const scheduledAt = firstDefined(session, ["scheduledAt", "ScheduledAt"], "");
            const status = firstDefined(session, ["status", "Status"], "Planned");
            const matchesSearch = !query || `${horseName} ${type} ${target} ${plan ? labelPlan(plan, horses) : ""}`.toLowerCase().includes(query);
            const matchesStatus = !statusFilter || status === statusFilter;
            const matchesDate = !dateFilter || String(scheduledAt).startsWith(dateFilter);
            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [sessions, plans, horses, search, statusFilter, dateFilter]);

    const loadMedical = async (horseId) => {
        if (!horseId) {
            setMedical(null);
            return;
        }
        try {
            setMedicalLoading(true);
            const data = await getHorseMedicalSummary(horseId);
            setMedical(extractMedicalContext(data));
        } catch (err) {
            console.error(err);
            setMedical(null);
            setError(err.response?.data?.message || "Unable to load medical restrictions for this horse.");
        } finally {
            setMedicalLoading(false);
        }
    };

    const openCreate = (planId = "") => {
        setEditingSession(null);
        setForm({ ...emptyForm, planId });
        setMedical(null);
        setError("");
        setShowModal(true);
        if (planId) {
            const plan = plans.find((item) => idOf(item) === planId);
            const horseId = plan ? firstDefined(plan, ["horseId", "HorseId"]) : "";
            if (horseId) loadMedical(horseId);
        }
    };

    const openEdit = async (session) => {
        setEditingSession(session);
        setError("");
        setShowModal(true);
        const planId = firstDefined(session, ["planId", "PlanId"]);
        const plan = plans.find((item) => idOf(item) === planId);
        const horseId = firstDefined(session, ["horseId", "HorseId"]) || firstDefined(plan, ["horseId", "HorseId"]);
        setForm({
            planId,
            scheduledAt: toLocalInputValue(firstDefined(session, ["scheduledAt", "ScheduledAt"])),
            trainingType: firstDefined(session, ["trainingType", "TrainingType"], "Walk"),
            distanceMetres: firstDefined(session, ["distanceMetres", "DistanceMetres"], ""),
            intensity: firstDefined(session, ["intensity", "Intensity"], "Light"),
            surface: firstDefined(session, ["surface", "Surface"], ""),
            target: firstDefined(session, ["target", "Target"], ""),
            riderId: firstDefined(session, ["riderId", "RiderId"], "") || "",
            notes: firstDefined(session, ["notes", "Notes"], ""),
        });
        if (horseId) await loadMedical(horseId);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditingSession(null);
        setMedical(null);
        setForm({ ...emptyForm });
    };

    const handlePlanChange = async (event) => {
        const planId = event.target.value;
        setForm((previous) => ({ ...previous, planId }));
        const plan = plans.find((item) => idOf(item) === planId);
        const horseId = plan ? firstDefined(plan, ["horseId", "HorseId"]) : "";
        await loadMedical(horseId);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const selectedPlan = plans.find((item) => idOf(item) === form.planId);
    const medicalCheck = restrictionBlocksSession(medical, form);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!form.planId || !form.scheduledAt || !form.distanceMetres || !form.surface.trim() || !form.target.trim()) {
            setError("Plan, Date/Time, Distance, Surface, and Target are required.");
            return;
        }
        if (medicalCheck.blocked) {
            setError("This session is blocked by the horse's active medical restriction.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            const payload = {
                scheduledAt: new Date(form.scheduledAt).toISOString(),
                trainingType: form.trainingType,
                distanceMetres: Number(form.distanceMetres),
                intensity: form.intensity,
                surface: form.surface.trim(),
                target: form.target.trim(),
                notes: form.notes.trim(),
                riderId: form.riderId || null,
            };

            if (editingSession) {
                await updateTrainingSession(editingSession.id, payload);
            } else {
                await createTrainingSession(form.planId, payload);
            }
            closeModal();
            await loadSessions();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.title || "Unable to save training session.");
        } finally {
            setSaving(false);
        }
    };

    const performAction = async (action, session, extra = undefined) => {
        try {
            setError("");
            if (action === "assign") await assignTrainingSession(session.id, extra);
            if (action === "start") await startTrainingSession(session.id);
            if (action === "skip") await skipTrainingSession(session.id, extra);
            await loadSessions();
            if (selectedSession?.id === session.id) setSelectedSession(null);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data?.title || `Unable to ${action} session.`);
        }
    };

    const riderName = (riderId) => {
        const rider = riders.find((item) => idOf(item) === riderId);
        return rider ? firstDefined(rider, ["name", "fullName", "userName", "email", "Name"], "Work Rider") : "Unassigned";
    };

    return (
        <TrainingLayout role="Trainer">
            <section className="training-page">
                <div className="training-page-header">
                    <div>
                        <span className="training-eyebrow">F02-C</span>
                        <h2>Training Sessions</h2>
                        <p>Create, schedule, assign, and manage sessions linked to a Training Plan.</p>
                    </div>
                    <button className="training-primary-button" onClick={() => openCreate()}>
                        <Plus size={16} /> Create Session
                    </button>
                </div>

                {error && <div className="training-error">{error}</div>}

                <div className="training-toolbar">
                    <input className="training-search" placeholder="Search horse, session type, target..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All statuses</option>
                        {SESSION_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                    </select>
                    <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                </div>

                <div className="training-card">
                    <div className="training-card-header">
                        <div><h3><CalendarDays size={15} /> Session Schedule</h3><span>{filteredSessions.length} session(s)</span></div>
                    </div>

                    {loading ? <div className="training-empty">Loading sessions...</div> : filteredSessions.length === 0 ? (
                        <div className="training-empty">No training sessions found.</div>
                    ) : (
                        <div className="training-table-wrap">
                            <table className="training-table">
                                <thead><tr><th>Scheduled</th><th>Horse</th><th>Training</th><th>Plan</th><th>Distance</th><th>Intensity</th><th>Rider</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {filteredSessions.map((session) => {
                                        const planId = firstDefined(session, ["planId", "PlanId"]);
                                        const plan = plans.find((item) => idOf(item) === planId);
                                        const horseId = firstDefined(session, ["horseId", "HorseId"]);
                                        const horse = horses.find((item) => idOf(item) === horseId);
                                        const status = firstDefined(session, ["status", "Status"], "Planned");
                                        const riderId = firstDefined(session, ["riderId", "RiderId"], "");
                                        return (
                                            <tr key={session.id}>
                                                <td>{formatDateTime(firstDefined(session, ["scheduledAt", "ScheduledAt"]))}</td>
                                                <td><strong>{horse ? labelHorse(horse) : firstDefined(session, ["horseName", "HorseName"], "—")}</strong></td>
                                                <td>{firstDefined(session, ["trainingType", "TrainingType"], "—")}</td>
                                                <td>{plan ? firstDefined(plan, ["goal", "trainingGoal", "Goal"], "—") : "—"}</td>
                                                <td>{firstDefined(session, ["distanceMetres", "DistanceMetres"], "—")} m</td>
                                                <td>{firstDefined(session, ["intensity", "Intensity"], "—")}</td>
                                                <td>{riderName(riderId)}</td>
                                                <td><span className={`training-status-badge ${String(status).toLowerCase()}`}>{statusLabel(status)}</span></td>
                                                <td>
                                                    <div className="training-actions">
                                                        <button className="training-icon-button" title="View" onClick={() => setSelectedSession(session)}><Eye size={15} /></button>
                                                        {status === "Planned" && <button className="training-icon-button" title="Edit" onClick={() => openEdit(session)}><Pencil size={15} /></button>}
                                                        {status === "Planned" && riderId && <button className="training-small-button" onClick={() => performAction("assign", session, riderId)}>Assign</button>}
                                                        {status === "Assigned" && <button className="training-small-button" onClick={() => performAction("start", session)}>Start</button>}
                                                        {(status === "Planned" || status === "Assigned") && <button className="training-small-button danger" onClick={() => { const reason = window.prompt("Reason for skipping this session:"); if (reason?.trim()) performAction("skip", session, { reason: reason.trim() }); }}>Skip</button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="training-modal-overlay">
                        <div className="training-modal training-session-modal">
                            <div className="training-modal-header"><div><span className="training-eyebrow">F02-C</span><h3>{editingSession ? "Edit Training Session" : "Create Training Session"}</h3></div><button className="training-modal-close" onClick={closeModal}><X size={17} /></button></div>
                            <form className="training-form" onSubmit={handleSubmit}>
                                <div className="training-form-group training-form-full"><label>Training Plan *</label><select value={form.planId} onChange={handlePlanChange} disabled={Boolean(editingSession)}><option value="">Select a Training Plan</option>{plans.map((plan) => <option key={idOf(plan)} value={idOf(plan)}>{labelPlan(plan, horses)}</option>)}</select></div>
                                <div className="training-form-grid">
                                    <div className="training-form-group"><label>Date / Time *</label><input name="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={handleChange} /></div>
                                    <div className="training-form-group"><label>Training Type *</label><select name="trainingType" value={form.trainingType} onChange={handleChange}>{TRAINING_TYPES.map((item) => <option key={item}>{item}</option>)}</select></div>
                                    <div className="training-form-group"><label>Distance (m) *</label><input name="distanceMetres" type="number" min="1" max="100000" value={form.distanceMetres} onChange={handleChange} /></div>
                                    <div className="training-form-group"><label>Intensity *</label><select name="intensity" value={form.intensity} onChange={handleChange}>{INTENSITIES.map((item) => <option key={item}>{item}</option>)}</select></div>
                                    <div className="training-form-group"><label>Surface *</label><input name="surface" value={form.surface} onChange={handleChange} placeholder="Track / Turf / Sand..." /></div>
                                    <div className="training-form-group"><label>Assigned Work Rider</label><select name="riderId" value={form.riderId} onChange={handleChange}><option value="">Unassigned — keep Planned</option>{riders.map((rider) => <option key={idOf(rider)} value={idOf(rider)}>{firstDefined(rider, ["name", "fullName", "userName", "email"], "Work Rider")}</option>)}</select></div>
                                    <div className="training-form-group training-form-full"><label>Target *</label><input name="target" value={form.target} onChange={handleChange} placeholder="e.g. Maintain controlled canter for 1200m" /></div>
                                    <div className="training-form-group training-form-full"><label>Notes</label><textarea name="notes" rows="3" value={form.notes} onChange={handleChange} /></div>
                                </div>

                                <div className="training-medical-panel">
                                    <div className="training-medical-panel-header"><ShieldAlert size={17} /><strong>Medical Validation</strong></div>
                                    {medicalLoading ? <p>Checking medical restrictions...</p> : !form.planId ? <p>Select a Training Plan to load the horse's medical context.</p> : medical ? <>
                                        <div className="training-medical-grid"><div><span>Health Status</span><strong>{medical.healthStatus}</strong></div><div><span>Training Lock</span><strong>{String(Boolean(medical.trainingLock)).toUpperCase()}</strong></div><div><span>Restrictions</span><strong>{medical.restrictions.length}</strong></div></div>
                                        {medicalCheck.blocked && <div className="training-medical-blocked"><strong>Session blocked</strong>{medicalCheck.reasons.map((reason, index) => <span key={index}>• {reason}</span>)}<small>Trainer cannot override an active medical restriction or Training Lock.</small></div>}
                                    </> : <p>No medical summary returned. Backend validation remains authoritative.</p>}
                                </div>

                                <div className="training-modal-actions"><button type="button" className="training-secondary-button" onClick={closeModal}>Cancel</button><button type="submit" className="training-primary-button" disabled={saving || medicalCheck.blocked}>{saving ? "Saving..." : editingSession ? "Save Changes" : "Create Session"}</button></div>
                            </form>
                        </div>
                    </div>
                )}

                {selectedSession && (
                    <div className="training-modal-overlay" onClick={() => setSelectedSession(null)}>
                        <div className="training-modal" onClick={(event) => event.stopPropagation()}>
                            <div className="training-modal-header"><div><span className="training-eyebrow">SESSION DETAIL</span><h3>{firstDefined(selectedSession, ["trainingType", "TrainingType"], "Training Session")}</h3></div><button className="training-modal-close" onClick={() => setSelectedSession(null)}><X size={17} /></button></div>
                            <div className="training-detail-content">
                                <div className="training-detail-summary"><div><span>Scheduled</span><strong>{formatDateTime(firstDefined(selectedSession, ["scheduledAt", "ScheduledAt"]))}</strong></div><div><span>Status</span><strong>{statusLabel(firstDefined(selectedSession, ["status", "Status"], "Planned"))}</strong></div><div><span>Distance</span><strong>{firstDefined(selectedSession, ["distanceMetres", "DistanceMetres"], "—")} m</strong></div><div><span>Intensity</span><strong>{firstDefined(selectedSession, ["intensity", "Intensity"], "—")}</strong></div></div>
                                <div className="training-session-detail-list"><p><UserRound size={14} /> <strong>Work Rider:</strong> {riderName(firstDefined(selectedSession, ["riderId", "RiderId"], ""))}</p><p><strong>Surface:</strong> {firstDefined(selectedSession, ["surface", "Surface"], "—")}</p><p><strong>Target:</strong> {firstDefined(selectedSession, ["target", "Target"], "—")}</p><p><strong>Notes:</strong> {firstDefined(selectedSession, ["notes", "Notes"], "—")}</p></div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </TrainingLayout>
    );
}

export default TrainingSessions;
