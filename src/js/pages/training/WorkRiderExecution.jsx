import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Eye, Play, Send, ShieldAlert, X } from "lucide-react";

import TrainingLayout from "../../components/training/TrainingLayout";
import { useAuth } from "../../context/AuthContext";
import {
    getHorseMedicalSummary,
    getTrainingSessions,
    getTrainingPlans,
    startTrainingSession,
    submitTrainingResult,
} from "../../services/trainingService";

const emptyResult = {
    distanceMetres: "",
    timeSeconds: "",
    heartRate: "",
    intensity: "Moderate",
    feedback: "",
    abnormalObservation: false,
};

const STATUSES = ["All", "Assigned", "InProgress", "Completed", "Skipped", "IssueReported"];
const INTENSITIES = ["Light", "Moderate", "Heavy"];

function listFromResponse(data) {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.data ?? data?.results ?? data?.sessions ?? data?.plans ?? [];
}

function firstDefined(object, keys, fallback = "") {
    for (const key of keys) {
        const value = key.split(".").reduce((current, part) => current?.[part], object);
        if (value !== undefined && value !== null && value !== "") {
            return value;
        }
    }
    return fallback;
}

function normalizeStatus(status) {
    return String(status ?? "").replace(/[_\s-]/g, "").toLowerCase();
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
}

function formatDuration(seconds) {
    if (!seconds) return "—";
    const total = Number(seconds);
    if (!Number.isFinite(total)) return "—";
    const minutes = Math.floor(total / 60);
    const remaining = Math.round(total % 60);
    return `${minutes}m ${String(remaining).padStart(2, "0")}s`;
}

function getErrorMessage(error, fallback) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.response?.data?.detail ||
        error?.message ||
        fallback
    );
}

function getHorseName(session) {
    return firstDefined(session, ["horseName", "horse?.name"], "Horse");
}

function getSessionHorseId(session) {
    return firstDefined(session, ["horseId", "horse?.id", "horse?.horseId"]);
}

function getRiderId(session) {
    return firstDefined(session, ["riderId", "rider?.id", "assignedRiderId"]);
}

function getSessionId(session) {
    return firstDefined(session, ["id", "sessionId"]);
}

function getSessionPlanId(session) {
    return firstDefined(session, ["planId", "trainingPlanId", "plan?.id"]);
}

function WorkRiderExecution() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedSession, setSelectedSession] = useState(null);
    const [medical, setMedical] = useState(null);
    const [medicalLoading, setMedicalLoading] = useState(false);
    const [resultForm, setResultForm] = useState(emptyResult);
    const [submitting, setSubmitting] = useState(false);
    const [startingId, setStartingId] = useState("");

    const currentUserId = firstDefined(user, ["id", "userId", "staffId"]);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [sessionResponse, planResponse] = await Promise.all([
                getTrainingSessions({ page: 1, pageSize: 100 }),
                getTrainingPlans(1, 100),
            ]);

            setSessions(listFromResponse(sessionResponse));
            setPlans(listFromResponse(planResponse));
        } catch (err) {
            setError(getErrorMessage(err, "Unable to load Work Rider schedule."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const planMap = useMemo(() => {
        const map = new Map();
        plans.forEach((plan) => map.set(firstDefined(plan, ["id", "planId"]), plan));
        return map;
    }, [plans]);

    const mySessions = useMemo(() => {
        // The API does not expose a riderId query parameter. If the login payload
        // contains the current user id, use it to enforce the "My Schedule" view.
        // Otherwise keep the backend response visible rather than guessing identity.
        return sessions.filter((session) => {
            if (!currentUserId) return true;
            const riderId = getRiderId(session);
            return !!riderId && String(riderId) === String(currentUserId);
        });
    }, [sessions, currentUserId]);

    const filteredSessions = useMemo(() => {
        const query = search.trim().toLowerCase();
        return [...mySessions]
            .filter((session) => statusFilter === "All" || firstDefined(session, ["status"]) === statusFilter)
            .filter((session) => {
                if (!query) return true;
                const plan = planMap.get(getSessionPlanId(session));
                const haystack = [
                    getHorseName(session),
                    firstDefined(session, ["trainingType"]),
                    firstDefined(session, ["surface"]),
                    firstDefined(session, ["target"]),
                    firstDefined(plan, ["goal", "trainingGoal"]),
                ]
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(query);
            })
            .sort((a, b) => new Date(firstDefined(a, ["scheduledAt"])) - new Date(firstDefined(b, ["scheduledAt"])));
    }, [mySessions, search, statusFilter, planMap]);

    const openSession = async (session) => {
        setSelectedSession(session);
        setResultForm(emptyResult);
        setNotice("");
        setError("");
        setMedical(null);
        setMedicalLoading(true);

        try {
            const horseId = getSessionHorseId(session);
            const sessionId = getSessionId(session);
            const [freshSession, medicalSummary] = await Promise.all([
                sessionId ? getTrainingSession(sessionId) : Promise.resolve(session),
                horseId ? getHorseMedicalSummary(horseId) : Promise.resolve(null),
            ]);
            setSelectedSession(freshSession || session);
            setMedical(medicalSummary);
        } catch (err) {
            setError(getErrorMessage(err, "Unable to load session detail."));
        } finally {
            setMedicalLoading(false);
        }
    };

    const handleStart = async (session) => {
        const id = getSessionId(session);
        if (!id) return;
        setStartingId(id);
        setError("");
        setNotice("");
        try {
            await startTrainingSession(id);
            setNotice("Training session started. You can now record the result.");
            await loadData();
            const updated = { ...session, status: "InProgress" };
            setSelectedSession(updated);
        } catch (err) {
            setError(getErrorMessage(err, "Unable to start the training session."));
        } finally {
            setStartingId("");
        }
    };

    const handleResultChange = (event) => {
        const { name, value, type, checked } = event.target;
        setResultForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmitResult = async (event) => {
        event.preventDefault();
        if (!selectedSession) return;

        const sessionId = getSessionId(selectedSession);
        const distance = Number(resultForm.distanceMetres);
        const timeSeconds = Number(resultForm.timeSeconds);
        const heartRate = resultForm.heartRate === "" ? null : Number(resultForm.heartRate);

        if (!sessionId || !Number.isFinite(distance) || distance < 0 || !Number.isFinite(timeSeconds) || timeSeconds <= 0) {
            setError("Enter a valid actual distance and actual time.");
            return;
        }

        if (heartRate !== null && (!Number.isInteger(heartRate) || heartRate < 1 || heartRate > 300)) {
            setError("Heart rate must be empty or an integer from 1 to 300.");
            return;
        }

        setSubmitting(true);
        setError("");
        setNotice("");
        try {
            await submitTrainingResult(sessionId, {
                distanceMetres: distance,
                timeSeconds,
                heartRate,
                intensity: resultForm.intensity,
                feedback: resultForm.feedback.trim(),
                abnormalObservation: resultForm.abnormalObservation,
            });
            setNotice("Result submitted successfully. The session is now available for Trainer evaluation.");
            await loadData();
            setSelectedSession(null);
        } catch (err) {
            setError(getErrorMessage(err, "Unable to submit the training result."));
        } finally {
            setSubmitting(false);
        }
    };

    const getPlanName = (session) => {
        const plan = planMap.get(getSessionPlanId(session));
        return firstDefined(session, ["planName"], firstDefined(plan, ["name", "goal", "trainingGoal"], "—"));
    };

    return (
        <TrainingLayout role="Work Rider">
            <section className="training-page-heading">
                <div>
                    <div className="training-kicker">F02-D · EXECUTION</div>
                    <h2>My Schedule</h2>
                    <p>Execute assigned sessions, record actual performance, and send rider feedback to the Trainer.</p>
                </div>
                <div className="training-summary-pill">
                    <CalendarDays size={16} /> {filteredSessions.length} session{filteredSessions.length === 1 ? "" : "s"}
                </div>
            </section>

            {error && <div className="training-alert training-alert-error">{error}</div>}
            {notice && <div className="training-alert training-alert-success"><CheckCircle2 size={16} /> {notice}</div>}

            <section className="training-toolbar">
                <input
                    className="training-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search horse, training type, target..."
                />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="training-filter-select">
                    {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
            </section>

            <section className="training-card">
                <div className="training-card-header">
                    <div>
                        <h3>Today & Upcoming</h3>
                        <p>Sessions assigned to the current Work Rider.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="training-empty-state">Loading schedule...</div>
                ) : filteredSessions.length === 0 ? (
                    <div className="training-empty-state">No assigned sessions match the selected filters.</div>
                ) : (
                    <div className="training-table-wrap">
                        <table className="training-table">
                            <thead>
                                <tr>
                                    <th>Scheduled</th>
                                    <th>Horse</th>
                                    <th>Training</th>
                                    <th>Plan</th>
                                    <th>Distance</th>
                                    <th>Intensity</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSessions.map((session) => {
                                    const status = firstDefined(session, ["status"], "Planned");
                                    const id = getSessionId(session);
                                    const normalized = normalizeStatus(status);
                                    return (
                                        <tr key={id}>
                                            <td>{formatDateTime(firstDefined(session, ["scheduledAt"]))}</td>
                                            <td><strong>{getHorseName(session)}</strong></td>
                                            <td>{firstDefined(session, ["trainingType"], "—")}</td>
                                            <td>{getPlanName(session)}</td>
                                            <td>{firstDefined(session, ["distanceMetres"], "—")} m</td>
                                            <td>{firstDefined(session, ["intensity"], "—")}</td>
                                            <td><span className={`training-status-badge ${normalized}`}>{status}</span></td>
                                            <td>
                                                <div className="training-action-row">
                                                    <button className="training-small-button" onClick={() => openSession(session)} title="View session">
                                                        <Eye size={15} />
                                                    </button>
                                                    {normalized === "assigned" && (
                                                        <button
                                                            className="training-small-button primary"
                                                            onClick={() => handleStart(session)}
                                                            disabled={startingId === id}
                                                        >
                                                            <Play size={15} /> {startingId === id ? "Starting..." : "Start"}
                                                        </button>
                                                    )}
                                                    {normalized === "inprogress" && (
                                                        <button className="training-small-button primary" onClick={() => openSession(session)}>
                                                            <Send size={15} /> Record result
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {selectedSession && (
                <div className="training-modal-backdrop">
                    <div className="training-modal training-session-modal training-execution-modal">
                        <div className="training-modal-header">
                            <div>
                                <div className="training-kicker">WORK RIDER EXECUTION</div>
                                <h3>{getHorseName(selectedSession)}</h3>
                                <p>{firstDefined(selectedSession, ["trainingType"], "Training Session")} · {firstDefined(selectedSession, ["status"], "—")}</p>
                            </div>
                            <button className="training-icon-button" onClick={() => setSelectedSession(null)}><X size={18} /></button>
                        </div>

                        <div className="training-execution-grid">
                            <div className="training-execution-main">
                                <section className="training-detail-panel">
                                    <h4>Session Detail</h4>
                                    <div className="training-session-detail-list">
                                        <div><span>Scheduled</span><strong>{formatDateTime(firstDefined(selectedSession, ["scheduledAt"]))}</strong></div>
                                        <div><span>Planned Distance</span><strong>{firstDefined(selectedSession, ["distanceMetres"], "—")} m</strong></div>
                                        <div><span>Planned Intensity</span><strong>{firstDefined(selectedSession, ["intensity"], "—")}</strong></div>
                                        <div><span>Surface</span><strong>{firstDefined(selectedSession, ["surface"], "—")}</strong></div>
                                        <div><span>Target</span><strong>{firstDefined(selectedSession, ["target"], "—")}</strong></div>
                                        <div><span>Plan</span><strong>{getPlanName(selectedSession)}</strong></div>
                                    </div>
                                </section>

                                <section className="training-detail-panel">
                                    <h4>Record Result</h4>
                                    {normalizeStatus(firstDefined(selectedSession, ["status"])) !== "inprogress" ? (
                                        <div className="training-inline-warning">
                                            <ShieldAlert size={17} />
                                            Start the session before recording a result.
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmitResult} className="training-form-grid">
                                            <label>
                                                Actual Distance (m) *
                                                <input name="distanceMetres" type="number" min="0" max="100000" step="0.01" value={resultForm.distanceMetres} onChange={handleResultChange} required />
                                            </label>
                                            <label>
                                                Actual Time (seconds) *
                                                <input name="timeSeconds" type="number" min="0.001" max="86400" step="0.01" value={resultForm.timeSeconds} onChange={handleResultChange} required />
                                            </label>
                                            <label>
                                                Heart Rate (optional)
                                                <input name="heartRate" type="number" min="1" max="300" step="1" value={resultForm.heartRate} onChange={handleResultChange} placeholder="e.g. 145" />
                                            </label>
                                            <label>
                                                Actual Intensity *
                                                <select name="intensity" value={resultForm.intensity} onChange={handleResultChange} required>
                                                    {INTENSITIES.map((value) => <option key={value}>{value}</option>)}
                                                </select>
                                            </label>
                                            <label className="training-form-full">
                                                Rider Feedback
                                                <textarea name="feedback" value={resultForm.feedback} onChange={handleResultChange} rows="4" placeholder="How did the horse respond during the session?" />
                                            </label>
                                            <label className="training-checkbox training-form-full">
                                                <input name="abnormalObservation" type="checkbox" checked={resultForm.abnormalObservation} onChange={handleResultChange} />
                                                <span>Abnormal observation</span>
                                            </label>
                                            <div className="training-form-actions training-form-full">
                                                <button type="button" className="training-secondary-button" onClick={() => setSelectedSession(null)}>Cancel</button>
                                                <button type="submit" className="training-primary-button" disabled={submitting}>
                                                    <Send size={16} /> {submitting ? "Submitting..." : "Submit Result"}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </section>
                            </div>

                            <aside className="training-execution-side">
                                <section className="training-medical-panel">
                                    <div className="training-medical-panel-title"><ShieldAlert size={17} /> Medical Context</div>
                                    {medicalLoading ? (
                                        <p>Loading medical restrictions...</p>
                                    ) : medical ? (
                                        <>
                                            <div className="training-medical-grid">
                                                <div><span>Health Status</span><strong>{firstDefined(medical, ["healthStatus", "status"], "—")}</strong></div>
                                                <div><span>Training Lock</span><strong>{firstDefined(medical, ["trainingLock", "trainingLockStatus"], "—")}</strong></div>
                                            </div>
                                            <p className="training-medical-note">Medical restrictions are execution context only. The Work Rider must follow the assigned session and report abnormalities rather than override restrictions.</p>
                                        </>
                                    ) : (
                                        <p>No medical summary is available for this horse.</p>
                                    )}
                                </section>

                                <section className="training-detail-panel">
                                    <h4>Result Preview</h4>
                                    <div className="training-result-preview">
                                        <div><span>Actual speed</span><strong>{resultForm.distanceMetres && resultForm.timeSeconds ? `${(Number(resultForm.distanceMetres) / Number(resultForm.timeSeconds)).toFixed(2)} m/s` : "—"}</strong></div>
                                        <div><span>Duration</span><strong>{formatDuration(resultForm.timeSeconds)}</strong></div>
                                        <div><span>Heart rate</span><strong>{resultForm.heartRate || "—"}</strong></div>
                                    </div>
                                </section>
                            </aside>
                        </div>
                    </div>
                </div>
            )}
        </TrainingLayout>
    );
}

export default WorkRiderExecution;
