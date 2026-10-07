import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, History, Pencil, Plus, ShieldAlert, X } from "lucide-react";

import TrainingLayout from "../../components/training/TrainingLayout";
import { useAuth } from "../../context/AuthContext";
import {
    createTrainingPlan,
    getHorseMedicalSummary,
    getHorses,
    getTrainingPlanHistory,
    getTrainingPlans,
    getTrainingSessions,
    getTrainingTemplates,
    updateTrainingPlan,
    updateTrainingPlanStatus,
} from "../../services/trainingService";

const emptyForm = {
    horseId: "",
    templateId: "",
    goal: "",
    phase: "",
    startDate: "",
    endDate: "",
    notes: "",
};

const PLAN_STATUSES = ["Active", "Paused", "Completed", "Archived"];

function listFromResponse(data) {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.data ?? data?.results ?? data?.plans ?? [];
}

function firstDefined(object, keys, fallback = "") {
    for (const key of keys) {
        if (object?.[key] !== undefined && object?.[key] !== null) {
            return object[key];
        }
    }
    return fallback;
}

function displayHorse(horse) {
    return firstDefined(horse, ["name", "horseName", "Name", "HorseName"], "Unnamed horse");
}

function displayTemplate(template) {
    return firstDefined(template, ["name", "templateName", "Name", "TemplateName"], "Unnamed template");
}

function displayPlanStatus(plan) {
    return firstDefined(plan, ["status", "Status"], "Active");
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function extractMedicalContext(data) {
    const source = data?.data ?? data?.summary ?? data ?? {};
    const restrictions =
        source?.restrictions ??
        source?.medicalRestrictions ??
        source?.activeRestrictions ??
        [];

    const lock =
        source?.trainingLock ??
        source?.lock ??
        source?.medicalTrainingLock ??
        null;

    return {
        healthStatus: firstDefined(source, ["healthStatus", "HealthStatus", "status", "Status"], "Unknown"),
        trainingLock: lock,
        restrictions: Array.isArray(restrictions) ? restrictions : [],
    };
}

function extractSessions(data) {
    return listFromResponse(data);
}

function TrainingPlans() {
    const { user } = useAuth();

    const [plans, setPlans] = useState([]);
    const [horses, setHorses] = useState([]);
    const [templates, setTemplates] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const [selectedPlan, setSelectedPlan] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [history, setHistory] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const [medicalContext, setMedicalContext] = useState(null);
    const [medicalLoading, setMedicalLoading] = useState(false);

    const currentTrainerName = useMemo(() => {
        if (!user) return "Current signed-in Trainer";
        return (
            user.name ||
            user.userName ||
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.email ||
            "Current signed-in Trainer"
        );
    }, [user]);

    const loadPlans = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getTrainingPlans(1, 100);
            setPlans(listFromResponse(data));
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                err.response?.data?.title ||
                "Unable to load training plans."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadSelectors = async () => {
        try {
            const [horseData, templateData] = await Promise.all([
                getHorses(1, 100),
                getTrainingTemplates(1, 100),
            ]);

            setHorses(listFromResponse(horseData));
            setTemplates(listFromResponse(templateData));
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                "Unable to load horses/templates for Training Plan creation."
            );
        }
    };

    useEffect(() => {
        loadPlans();
        loadSelectors();
    }, []);

    const filteredPlans = useMemo(() => {
        const query = search.trim().toLowerCase();

        return plans.filter((plan) => {
            const horse = horses.find(
                (item) => item.id === firstDefined(plan, ["horseId", "HorseId"])
            );

            const horseName = horse ? displayHorse(horse) : firstDefined(plan, ["horseName", "HorseName"]);
            const goal = firstDefined(plan, ["goal", "trainingGoal", "Goal"], "");
            const phase = firstDefined(plan, ["phase", "trainingPhase", "Phase"], "");

            const matchesQuery =
                !query ||
                `${horseName} ${goal} ${phase}`.toLowerCase().includes(query);

            const matchesStatus =
                !statusFilter || displayPlanStatus(plan) === statusFilter;

            return matchesQuery && matchesStatus;
        });
    }, [plans, horses, search, statusFilter]);

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleTemplateChange = (event) => {
        const templateId = event.target.value;
        const template = templates.find((item) => item.id === templateId);

        setForm((previous) => ({
            ...previous,
            templateId,
            goal: template?.goal ?? previous.goal,
            phase: template?.phase ?? previous.phase,
        }));
    };

    const openCreateModal = () => {
        setEditingPlan(null);
        setForm({ ...emptyForm });
        setMedicalContext(null);
        setError("");
        setShowModal(true);
    };

    const openEditModal = async (plan) => {
        setEditingPlan(plan);
        setError("");
        setShowModal(true);
        setMedicalContext(null);

        const horseId = firstDefined(plan, ["horseId", "HorseId"]);
        const templateId = firstDefined(plan, ["templateId", "TemplateId"]);

        setForm({
            horseId,
            templateId,
            goal: firstDefined(plan, ["goal", "trainingGoal", "Goal"]),
            phase: firstDefined(plan, ["phase", "trainingPhase", "Phase"]),
            startDate: firstDefined(plan, ["startDate", "StartDate"]),
            endDate: firstDefined(plan, ["endDate", "EndDate"]),
            notes: firstDefined(plan, ["notes", "Notes"]),
        });

        if (horseId) {
            await loadMedicalContext(horseId);
        }
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditingPlan(null);
        setMedicalContext(null);
        setForm({ ...emptyForm });
    };

    const loadMedicalContext = async (horseId) => {
        if (!horseId) {
            setMedicalContext(null);
            return;
        }

        try {
            setMedicalLoading(true);
            const data = await getHorseMedicalSummary(horseId);
            setMedicalContext(extractMedicalContext(data));
        } catch (err) {
            console.error(err);
            setMedicalContext(null);
            setError(
                err.response?.data?.message ||
                "Unable to load the horse medical summary."
            );
        } finally {
            setMedicalLoading(false);
        }
    };

    const handleHorseChange = async (event) => {
        const horseId = event.target.value;
        setForm((previous) => ({ ...previous, horseId }));
        await loadMedicalContext(horseId);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.horseId || !form.templateId) {
            setError("Horse and Template are required.");
            return;
        }

        if (!form.startDate || !form.endDate) {
            setError("Start Date and End Date are required.");
            return;
        }

        if (form.endDate < form.startDate) {
            setError("End Date cannot be before Start Date.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const payload = {
                horseId: form.horseId,
                templateId: form.templateId,
                goal: form.goal.trim(),
                phase: form.phase.trim(),
                startDate: form.startDate,
                endDate: form.endDate,
                notes: form.notes.trim(),
            };

            if (editingPlan) {
                await updateTrainingPlan(editingPlan.id, payload);
            } else {
                await createTrainingPlan(payload);
            }

            closeModal();
            await loadPlans();
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                err.response?.data?.title ||
                "Unable to save training plan."
            );
        } finally {
            setSaving(false);
        }
    };

    const openPlanDetail = async (plan) => {
        setSelectedPlan(plan);
        setDetailLoading(true);
        setError("");

        try {
            const planId = plan.id;
            const horseId = firstDefined(plan, ["horseId", "HorseId"]);

            const [sessionData, historyData] = await Promise.all([
                horseId ? getTrainingSessions({ horseId, page: 1, pageSize: 100 }) : Promise.resolve([]),
                getTrainingPlanHistory(planId, 1, 100),
            ]);

            const allSessions = extractSessions(sessionData);
            const planSessions = allSessions.filter(
                (session) =>
                    firstDefined(session, ["planId", "PlanId", "trainingPlanId", "TrainingPlanId"]) === planId
            );

            setSessions(planSessions);
            setHistory(listFromResponse(historyData));
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                "Unable to load Training Plan history/timeline."
            );
        } finally {
            setDetailLoading(false);
        }
    };

    const changeStatus = async (plan, status) => {
        try {
            setError("");
            await updateTrainingPlanStatus(plan.id, status);
            await loadPlans();

            const refreshed = plans.find((item) => item.id === plan.id);
            if (selectedPlan?.id === plan.id) {
                setSelectedPlan({
                    ...(refreshed || plan),
                    status,
                });
            }
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                err.response?.data?.title ||
                `Unable to change plan status to ${status}.`
            );
        }
    };

    const getHorseName = (plan) => {
        const horseId = firstDefined(plan, ["horseId", "HorseId"]);
        const horse = horses.find((item) => item.id === horseId);
        return horse ? displayHorse(horse) : firstDefined(plan, ["horseName", "HorseName"], "Unknown horse");
    };

    return (
        <TrainingLayout role="Trainer">
            <section className="training-content">
                <div className="training-breadcrumb">Training / Training Plans</div>

                <div className="training-page-title-row">
                    <div>
                        <h2>Training Plans</h2>
                        <p>Horse-specific plans created from Standard Training Templates.</p>
                    </div>
                    <button className="training-primary-button" onClick={openCreateModal}>
                        <Plus size={15} />
                        Create Training Plan
                    </button>
                </div>

                {error && <div className="training-error">{error}</div>}

                <div className="training-toolbar">
                    <input
                        className="training-search"
                        placeholder="Search horse, goal, phase..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                    <select
                        className="training-filter-select"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                    >
                        <option value="">All statuses</option>
                        {PLAN_STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                <div className="training-card training-table-card">
                    <div className="training-table-wrap">
                        <table className="training-table">
                            <thead>
                                <tr>
                                    <th>Horse</th>
                                    <th>Training Goal</th>
                                    <th>Phase</th>
                                    <th>Trainer</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="training-empty">Loading training plans...</td></tr>
                                ) : filteredPlans.length === 0 ? (
                                    <tr><td colSpan="8" className="training-empty">No Training Plans found.</td></tr>
                                ) : (
                                    filteredPlans.map((plan) => (
                                        <tr key={plan.id}>
                                            <td><strong>{getHorseName(plan)}</strong></td>
                                            <td>{firstDefined(plan, ["goal", "trainingGoal", "Goal"], "—")}</td>
                                            <td>{firstDefined(plan, ["phase", "trainingPhase", "Phase"], "—")}</td>
                                            <td>{currentTrainerName}</td>
                                            <td>{formatDate(firstDefined(plan, ["startDate", "StartDate"]))}</td>
                                            <td>{formatDate(firstDefined(plan, ["endDate", "EndDate"]))}</td>
                                            <td><span className={`training-status-badge ${String(displayPlanStatus(plan)).toLowerCase()}`}>{displayPlanStatus(plan)}</span></td>
                                            <td>
                                                <div className="training-actions">
                                                    <button className="training-icon-button" title="View timeline/history" onClick={() => openPlanDetail(plan)}>
                                                        <History size={14} />
                                                    </button>
                                                    <button className="training-icon-button" title="Edit" onClick={() => openEditModal(plan)}>
                                                        <Pencil size={14} />
                                                    </button>
                                                    {displayPlanStatus(plan) === "Active" && (
                                                        <button className="training-small-button" onClick={() => changeStatus(plan, "Paused")}>Pause</button>
                                                    )}
                                                    {displayPlanStatus(plan) === "Paused" && (
                                                        <button className="training-small-button" onClick={() => changeStatus(plan, "Active")}>Resume</button>
                                                    )}
                                                    {displayPlanStatus(plan) === "Active" && (
                                                        <button className="training-small-button" onClick={() => changeStatus(plan, "Completed")}>Complete</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {showModal && (
                <div className="training-modal-overlay">
                    <div className="training-modal training-plan-modal">
                        <div className="training-modal-header">
                            <div>
                                <span className="training-modal-eyebrow">F02-B</span>
                                <h3>{editingPlan ? "Edit Training Plan" : "Create Training Plan"}</h3>
                                <p>Create a horse-specific plan from a Standard Training Template.</p>
                            </div>
                            <button className="training-modal-close" onClick={closeModal} disabled={saving}>
                                <X size={17} />
                            </button>
                        </div>

                        <form className="training-form" onSubmit={handleSubmit}>
                            <div className="training-form-grid">
                                <label className="training-form-group">
                                    <span>Horse *</span>
                                    <select name="horseId" value={form.horseId} onChange={handleHorseChange} required>
                                        <option value="">Select horse</option>
                                        {horses.map((horse) => (
                                            <option key={horse.id} value={horse.id}>{displayHorse(horse)}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="training-form-group">
                                    <span>Trainer</span>
                                    <input value={currentTrainerName} readOnly />
                                    <small>Trainer is determined by the authenticated backend user.</small>
                                </label>

                                <label className="training-form-group">
                                    <span>Template *</span>
                                    <select name="templateId" value={form.templateId} onChange={handleTemplateChange} required>
                                        <option value="">Select standard template</option>
                                        {templates.filter((template) => !template.archived).map((template) => (
                                            <option key={template.id} value={template.id}>{displayTemplate(template)}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="training-form-group">
                                    <span>Training Goal *</span>
                                    <input name="goal" value={form.goal} onChange={handleFormChange} required />
                                </label>

                                <label className="training-form-group">
                                    <span>Training Phase *</span>
                                    <input name="phase" value={form.phase} onChange={handleFormChange} required />
                                </label>

                                <label className="training-form-group">
                                    <span>Start Date *</span>
                                    <input type="date" name="startDate" value={form.startDate} onChange={handleFormChange} required />
                                </label>

                                <label className="training-form-group">
                                    <span>End Date *</span>
                                    <input type="date" name="endDate" value={form.endDate} onChange={handleFormChange} required />
                                </label>

                                <label className="training-form-group training-form-group-full">
                                    <span>Notes</span>
                                    <textarea name="notes" rows="4" value={form.notes} onChange={handleFormChange} />
                                </label>
                            </div>

                            <div className="training-medical-panel">
                                <div className="training-medical-panel-title">
                                    <ShieldAlert size={15} />
                                    Horse Health / Training Safety Check
                                </div>
                                {!form.horseId ? (
                                    <p>Select a horse to load the current medical summary.</p>
                                ) : medicalLoading ? (
                                    <p>Loading medical summary...</p>
                                ) : medicalContext ? (
                                    <>
                                        <div className="training-medical-grid">
                                            <div><span>Health Status</span><strong>{medicalContext.healthStatus}</strong></div>
                                            <div><span>Training Lock</span><strong>{medicalContext.trainingLock ? "ACTIVE" : "None reported"}</strong></div>
                                            <div><span>Restrictions</span><strong>{medicalContext.restrictions.length}</strong></div>
                                        </div>
                                        {medicalContext.trainingLock && (
                                            <div className="training-warning">
                                                An active medical Training Lock is reported by the backend. The Trainer cannot override it.
                                            </div>
                                        )}
                                        {medicalContext.restrictions.length > 0 && (
                                            <ul className="training-restriction-list">
                                                {medicalContext.restrictions.map((restriction, index) => (
                                                    <li key={restriction.id ?? index}>
                                                        {firstDefined(restriction, ["reason", "description", "notes", "type"], "Medical restriction active")}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <p>Medical summary is unavailable. The backend will still validate the request when saved.</p>
                                )}
                            </div>

                            <div className="training-modal-footer">
                                <button type="button" className="training-button secondary" onClick={closeModal} disabled={saving}>Cancel</button>
                                <button type="submit" className="training-primary-button" disabled={saving}>
                                    {saving ? "Saving..." : editingPlan ? "Save Changes" : "Create Plan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedPlan && (
                <div className="training-modal-overlay" onClick={() => setSelectedPlan(null)}>
                    <div className="training-modal training-detail-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="training-modal-header">
                            <div>
                                <span className="training-modal-eyebrow">F02-B · PLAN DETAIL</span>
                                <h3>{getHorseName(selectedPlan)}</h3>
                                <p>{firstDefined(selectedPlan, ["goal", "trainingGoal", "Goal"], "Training Plan")}</p>
                            </div>
                            <button className="training-modal-close" onClick={() => setSelectedPlan(null)}><X size={17} /></button>
                        </div>

                        {detailLoading ? (
                            <div className="training-empty">Loading plan timeline and history...</div>
                        ) : (
                            <div className="training-detail-content">
                                <div className="training-detail-summary">
                                    <div><span>Phase</span><strong>{firstDefined(selectedPlan, ["phase", "trainingPhase", "Phase"], "—")}</strong></div>
                                    <div><span>Status</span><strong>{displayPlanStatus(selectedPlan)}</strong></div>
                                    <div><span>Start</span><strong>{formatDate(firstDefined(selectedPlan, ["startDate", "StartDate"]))}</strong></div>
                                    <div><span>End</span><strong>{formatDate(firstDefined(selectedPlan, ["endDate", "EndDate"]))}</strong></div>
                                </div>

                                <section className="training-detail-section">
                                    <div className="training-card-header">
                                        <div><h3><CalendarDays size={14} /> Session Timeline</h3><span>Real session records from the Training API.</span></div>
                                    </div>
                                    {sessions.length === 0 ? (
                                        <div className="training-empty">No sessions are linked to this plan yet. Create Session is part of F02-C.</div>
                                    ) : (
                                        <div className="training-timeline">
                                            {sessions.map((session) => (
                                                <div className="training-timeline-item" key={session.id}>
                                                    <div className="training-timeline-dot" />
                                                    <div>
                                                        <strong>{firstDefined(session, ["trainingType", "type", "TrainingType"], "Training Session")}</strong>
                                                        <span><Clock3 size={12} /> {formatDateTime(firstDefined(session, ["scheduledAt", "dateTime", "date", "ScheduledAt"]))}</span>
                                                        <small>Status: {firstDefined(session, ["status", "Status"], "Planned")}</small>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                <section className="training-detail-section">
                                    <div className="training-card-header">
                                        <div><h3><History size={14} /> Plan History</h3><span>Backend revision history for this plan.</span></div>
                                    </div>
                                    {history.length === 0 ? (
                                        <div className="training-empty">No history records returned.</div>
                                    ) : (
                                        <div className="training-history-list">
                                            {history.map((entry, index) => (
                                                <div className="training-history-item" key={entry.id ?? index}>
                                                    <strong>Version {firstDefined(entry, ["version", "Version"], index + 1)}</strong>
                                                    <span>{formatDateTime(firstDefined(entry, ["createdAt", "CreatedAt"]))}</span>
                                                    <p>{firstDefined(entry, ["action", "description", "Detail", "detail"], "Plan revision recorded")}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </TrainingLayout>
    );
}

export default TrainingPlans;
