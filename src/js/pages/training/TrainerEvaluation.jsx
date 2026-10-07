import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, MessageSquare, RefreshCw, Send, X } from "lucide-react";

import TrainingLayout from "../../components/training/TrainingLayout";
import {
    getTrainingSession,
    getTrainingSessions,
    submitTrainingEvaluation,
} from "../../services/trainingService";

const STATUSES = ["All", "Completed", "IssueReported"];

function listFromResponse(data) {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.data ?? data?.results ?? data?.sessions ?? [];
}

function firstDefined(object, keys, fallback = "") {
    for (const key of keys) {
        const value = key.split(".").reduce((current, part) => current?.[part], object);
        if (value !== undefined && value !== null && value !== "") return value;
    }
    return fallback;
}

function getErrorMessage(error, fallback) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.message ||
        fallback
    );
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
}

function formatDuration(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value) || value <= 0) return "—";
    const minutes = Math.floor(value / 60);
    const remaining = Math.round(value % 60);
    return `${minutes}m ${remaining}s`;
}

function formatSpeed(value) {
    const number = Number(value);
    return Number.isFinite(number) ? `${number.toFixed(2)} m/s` : "—";
}

function unwrapSession(data) {
    return data?.item ?? data?.data ?? data?.session ?? data;
}

function getResult(session) {
    return session?.result ?? session?.results?.[0] ?? session?.latestResult ?? null;
}

function getEvaluation(session) {
    return session?.evaluation ?? session?.evaluations?.[0] ?? session?.latestEvaluation ?? null;
}

function getHorseName(session) {
    return firstDefined(session, [
        "horse.name",
        "horseName",
        "horseNameDisplay",
        "horse.id",
        "horseId",
    ], "Unknown horse");
}

function getPlanName(session) {
    return firstDefined(session, [
        "plan.name",
        "planName",
        "trainingPlan.name",
        "trainingPlanName",
        "planId",
    ], "—");
}

function getRiderName(session) {
    return firstDefined(session, [
        "rider.fullName",
        "rider.name",
        "riderName",
        "rider.userName",
        "riderId",
    ], "—");
}

function TrainerEvaluation() {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("All");
    const [form, setForm] = useState({
        comment: "",
        adjustFutureSessions: false,
    });

    const loadSessions = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getTrainingSessions({
                page: 1,
                pageSize: 100,
            });
            setSessions(listFromResponse(response));
        } catch (err) {
            setError(getErrorMessage(err, "Unable to load training sessions."));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const filteredSessions = useMemo(() => {
        const query = search.trim().toLowerCase();

        return sessions.filter((session) => {
            const sessionStatus = firstDefined(session, ["status"], "");
            if (status !== "All" && sessionStatus !== status) return false;

            if (!query) return true;

            const haystack = [
                getHorseName(session),
                getPlanName(session),
                getRiderName(session),
                firstDefined(session, ["trainingType"], ""),
                sessionStatus,
            ].join(" ").toLowerCase();

            return haystack.includes(query);
        });
    }, [sessions, search, status]);

    const openSession = async (session) => {
        const id = firstDefined(session, ["id", "sessionId"]);
        if (!id) return;

        try {
            setDetailLoading(true);
            setError("");
            const response = await getTrainingSession(id);
            const detail = unwrapSession(response);
            setSelectedSession(detail);

            const evaluation = getEvaluation(detail);
            setForm({
                comment: evaluation?.comment ?? "",
                adjustFutureSessions: Boolean(evaluation?.adjustFutureSessions),
            });
        } catch (err) {
            setError(getErrorMessage(err, "Unable to load the training session detail."));
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        if (submitting) return;
        setSelectedSession(null);
        setForm({ comment: "", adjustFutureSessions: false });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedSession?.id) return;
        if (!form.comment.trim()) {
            setError("Trainer Evaluation / Comment is required.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            await submitTrainingEvaluation(selectedSession.id, {
                comment: form.comment.trim(),
                adjustFutureSessions: form.adjustFutureSessions,
            });

            setNotice("Trainer evaluation saved successfully.");
            await loadSessions();
            await openSession(selectedSession);
        } catch (err) {
            setError(getErrorMessage(err, "Unable to save the trainer evaluation."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <TrainingLayout role="Trainer">
            <section className="training-page">
                <div className="training-page-heading">
                    <div>
                        <div className="training-eyebrow">F02-E</div>
                        <h2>Trainer Evaluation</h2>
                        <p>Review completed training work, compare target vs actual, and decide whether future sessions need adjustment.</p>
                    </div>
                    <button className="training-secondary-button" onClick={loadSessions} disabled={loading}>
                        <RefreshCw size={15} /> Refresh
                    </button>
                </div>

                {notice && (
                    <div className="training-alert training-alert-success">
                        <CheckCircle2 size={17} />
                        <span>{notice}</span>
                        <button type="button" onClick={() => setNotice("")}><X size={15} /></button>
                    </div>
                )}

                {error && (
                    <div className="training-alert training-alert-error">
                        <span>{error}</span>
                        <button type="button" onClick={() => setError("")}><X size={15} /></button>
                    </div>
                )}

                <div className="training-toolbar">
                    <input
                        className="training-search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search horse, plan, rider..."
                    />
                    <select value={status} onChange={(event) => setStatus(event.target.value)}>
                        {STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>

                <div className="training-info-strip">
                    <MessageSquare size={17} />
                    <span>
                        Only the Trainer makes the training decision. Rider results and observations are read-only here; the evaluation records the Trainer's decision.
                    </span>
                </div>

                <div className="training-table-card">
                    <table className="training-table">
                        <thead>
                            <tr>
                                <th>Session</th>
                                <th>Horse</th>
                                <th>Training</th>
                                <th>Scheduled</th>
                                <th>Rider</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="training-empty">Loading sessions...</td></tr>
                            ) : filteredSessions.length === 0 ? (
                                <tr><td colSpan="7" className="training-empty">No sessions available for evaluation.</td></tr>
                            ) : (
                                filteredSessions.map((session) => {
                                    const sessionStatus = firstDefined(session, ["status"], "—");
                                    const id = firstDefined(session, ["id", "sessionId"]);
                                    return (
                                        <tr key={id}>
                                            <td><strong>{String(id || "—").slice(0, 8)}</strong></td>
                                            <td>{getHorseName(session)}</td>
                                            <td>{firstDefined(session, ["trainingType"], "—")}</td>
                                            <td>{formatDate(firstDefined(session, ["scheduledAt"]))}</td>
                                            <td>{getRiderName(session)}</td>
                                            <td><span className={`training-status-badge ${sessionStatus.toLowerCase()}`}>{sessionStatus}</span></td>
                                            <td>
                                                <button className="training-small-button" onClick={() => openSession(session)} disabled={detailLoading}>
                                                    <Eye size={14} /> Evaluate
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {selectedSession && (
                <div className="training-modal-backdrop" onMouseDown={closeDetail}>
                    <div className="training-modal training-evaluation-modal" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="training-modal-header">
                            <div>
                                <div className="training-eyebrow">F02-E · SESSION REVIEW</div>
                                <h3>{getHorseName(selectedSession)}</h3>
                            </div>
                            <button type="button" onClick={closeDetail} disabled={submitting}><X size={19} /></button>
                        </div>

                        {detailLoading ? (
                            <div className="training-empty">Loading session detail...</div>
                        ) : (
                            <div className="training-evaluation-body">
                                <div className="training-detail-grid">
                                    <div><span>Training Plan</span><strong>{getPlanName(selectedSession)}</strong></div>
                                    <div><span>Training Type</span><strong>{firstDefined(selectedSession, ["trainingType"], "—")}</strong></div>
                                    <div><span>Scheduled</span><strong>{formatDate(firstDefined(selectedSession, ["scheduledAt"]))}</strong></div>
                                    <div><span>Work Rider</span><strong>{getRiderName(selectedSession)}</strong></div>
                                </div>

                                <div className="training-evaluation-comparison">
                                    <div className="training-evaluation-column">
                                        <h4>Target / Planned</h4>
                                        <div className="training-result-row"><span>Distance</span><strong>{firstDefined(selectedSession, ["distanceMetres"], "—")} m</strong></div>
                                        <div className="training-result-row"><span>Intensity</span><strong>{firstDefined(selectedSession, ["intensity"], "—")}</strong></div>
                                        <div className="training-result-row"><span>Surface</span><strong>{firstDefined(selectedSession, ["surface"], "—")}</strong></div>
                                        <div className="training-result-row"><span>Target</span><strong>{firstDefined(selectedSession, ["target"], "—")}</strong></div>
                                    </div>

                                    <div className="training-evaluation-column">
                                        <h4>Actual / Rider Result</h4>
                                        {(() => {
                                            const result = getResult(selectedSession);
                                            if (!result) return <div className="training-empty-inline">No result has been submitted for this session yet.</div>;
                                            return (
                                                <>
                                                    <div className="training-result-row"><span>Distance</span><strong>{firstDefined(result, ["distanceMetres"], "—")} m</strong></div>
                                                    <div className="training-result-row"><span>Time</span><strong>{formatDuration(firstDefined(result, ["timeSeconds"]))}</strong></div>
                                                    <div className="training-result-row"><span>Speed</span><strong>{formatSpeed(firstDefined(result, ["speedMetresPerSecond"]))}</strong></div>
                                                    <div className="training-result-row"><span>Heart Rate</span><strong>{firstDefined(result, ["heartRate"], "—")}</strong></div>
                                                    <div className="training-result-row"><span>Intensity</span><strong>{firstDefined(result, ["intensity"], "—")}</strong></div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {(() => {
                                    const result = getResult(selectedSession);
                                    if (!result) return null;
                                    return (
                                        <div className={`training-rider-feedback ${result.abnormalObservation ? "abnormal" : ""}`}>
                                            <div className="training-rider-feedback-title">
                                                <strong>Rider Feedback</strong>
                                                {result.abnormalObservation && <span className="training-warning-badge">Abnormal observation</span>}
                                            </div>
                                            <p>{result.feedback || "No feedback provided."}</p>
                                        </div>
                                    );
                                })()}

                                <form onSubmit={handleSubmit} className="training-evaluation-form">
                                    <label>
                                        Trainer Evaluation / Comment *
                                        <textarea
                                            value={form.comment}
                                            onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
                                            rows="5"
                                            placeholder="Evaluate the result and record your training decision..."
                                            required
                                        />
                                    </label>

                                    <label className="training-checkbox-row">
                                        <input
                                            type="checkbox"
                                            checked={form.adjustFutureSessions}
                                            onChange={(event) => setForm((current) => ({ ...current, adjustFutureSessions: event.target.checked }))}
                                        />
                                        <span>
                                            <strong>Adjust future sessions</strong>
                                            <small>Continue the plan with changes to upcoming training sessions.</small>
                                        </span>
                                    </label>

                                    <div className="training-evaluation-decision">
                                        <div>
                                            <span>Decision</span>
                                            <strong>{form.adjustFutureSessions ? "Adjust future sessions" : "Continue plan"}</strong>
                                        </div>
                                        <button className="training-primary-button" type="submit" disabled={submitting}>
                                            <Send size={15} />
                                            {submitting ? "Saving..." : "Submit Evaluation"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </TrainingLayout>
    );
}

export default TrainerEvaluation;
