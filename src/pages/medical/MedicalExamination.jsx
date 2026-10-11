import { MSG, msg } from "../../messages/index.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClipboardPlus, Eye, Pencil, Plus, Search, X } from "lucide-react";

import MedicalLayout from "../../components/medical/MedicalLayout";
import {
    correctMedicalRecord,
    createMedicalRecord,
    getMedicalRecords,
    getMedicalHorses,
} from "../../services/medicalService";

const emptyForm = {
    examinationAt: "",
    reason: "",
    symptoms: "",
    findings: "",
    diagnosis: "",
    healthStatus: "Fit",
    notes: "",
};

const HEALTH_STATUSES = ["Fit", "Monitoring", "Injured", "Isolated"];

function listFromResponse(data) {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.data ?? data?.results ?? data?.horses ?? data?.records ?? [];
}

function firstDefined(object, keys, fallback = "") {
    for (const key of keys) {
        if (object?.[key] !== undefined && object?.[key] !== null) {
            return object[key];
        }
    }
    return fallback;
}

function idOf(object) {
    return firstDefined(object, ["id", "Id"], "");
}

function horseName(horse) {
    return firstDefined(horse, ["name", "Name", "horseName", "HorseName"], "Unnamed horse");
}

function horseRegistration(horse) {
    return firstDefined(
        horse,
        ["registrationNumber", "RegistrationNumber", "identifier", "Identifier", "horseId", "HorseId"],
        ""
    );
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function toLocalInputValue(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);

    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
        date.getHours()
    )}:${pad(date.getMinutes())}`;
}

function healthClass(status) {
    return String(status || "unknown").toLowerCase();
}

function getErrorMessage(error, fallback) {
    return (
        error?.message || error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.response?.data?.detail ||
        fallback
    );
}

function MedicalExamination() {
    const [horses, setHorses] = useState([]);
    const [selectedHorseId, setSelectedHorseId] = useState("");
    const [records, setRecords] = useState([]);

    const [loadingHorses, setLoadingHorses] = useState(true);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [healthFilter, setHealthFilter] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [viewingRecord, setViewingRecord] = useState(null);
    const [form, setForm] = useState(emptyForm);

    useEffect(() => {
        const loadHorses = async () => {
            try {
                setLoadingHorses(true);
                setError("");

                const data = await getMedicalHorses({
                    page: 1,
                    pageSize: 100,
                });

                const items = listFromResponse(data);
                setHorses(items);

                if (items.length > 0) {
                    setSelectedHorseId(idOf(items[0]));
                }
            } catch (err) {
                console.error(err);
                setError(getErrorMessage(err, "Unable to load horses."));
            } finally {
                setLoadingHorses(false);
            }
        };

        loadHorses();
    }, []);

    const requestVersion = useRef(0);
    const loadRecords = useCallback(async () => {
        const version=++requestVersion.current;
        await Promise.resolve();
        if (!selectedHorseId) {
            setRecords([]);
            return;
        }

        try {
            setLoadingRecords(true);
            setError("");

            const data = await getMedicalRecords(selectedHorseId, {
                page: 1,
                pageSize: 100,
            });

            if(version === requestVersion.current) setRecords(listFromResponse(data));
        } catch (err) {
            console.error(err);
            if(version === requestVersion.current) setError(getErrorMessage(err, "Unable to load medical records."));
        } finally {
            if(version === requestVersion.current) setLoadingRecords(false);
        }
    }, [selectedHorseId]);

    useEffect(() => {
        let active = true;
        queueMicrotask(() => { if (active) loadRecords(); });
        return () => { active = false; };
    }, [loadRecords]);

    const selectedHorse = useMemo(
        () => horses.find((horse) => idOf(horse) === selectedHorseId),
        [horses, selectedHorseId]
    );

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase();

        return records.filter((record) => {
            const status = firstDefined(record, ["healthStatus", "HealthStatus"], "");
            const diagnosis = firstDefined(record, ["diagnosis", "Diagnosis"], "");
            const reason = firstDefined(record, ["reason", "Reason"], "");

            const matchesStatus = !healthFilter || status === healthFilter;
            const matchesSearch =
                !query ||
                String(diagnosis).toLowerCase().includes(query) ||
                String(reason).toLowerCase().includes(query) ||
                String(firstDefined(record, ["symptoms", "Symptoms"], ""))
                    .toLowerCase()
                    .includes(query);

            return matchesStatus && matchesSearch;
        });
    }, [records, search, healthFilter]);

    const openCreate = () => {
        setEditingRecord(null);
        setForm({
            ...emptyForm,
            examinationAt: toLocalInputValue(new Date()),
        });
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    const openEdit = (record) => {
        setEditingRecord(record);
        setForm({
            examinationAt: toLocalInputValue(
                firstDefined(record, ["examinationAt", "ExaminationAt"], "")
            ),
            reason: firstDefined(record, ["reason", "Reason"], ""),
            symptoms: firstDefined(record, ["symptoms", "Symptoms"], ""),
            findings: firstDefined(record, ["findings", "Findings"], ""),
            diagnosis: firstDefined(record, ["diagnosis", "Diagnosis"], ""),
            healthStatus: firstDefined(record, ["healthStatus", "HealthStatus"], "Fit"),
            notes: firstDefined(record, ["notes", "Notes"], ""),
        });
        setError("");
        setSuccess("");
        setShowModal(true);
    };

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const submitForm = async (event) => {
        event.preventDefault();

        if (!selectedHorseId) {
            setError("Select a horse before saving the examination.");
            return;
        }

        if (!form.examinationAt) {
            setError("Examination date and time are required.");
            return;
        }

        const examinationDate = new Date(form.examinationAt);

        if (Number.isNaN(examinationDate.getTime())) {
            setError("Examination date and time are invalid.");
            return;
        }

        if (examinationDate > new Date()) {
            setError("Examination date cannot be in the future.");
            return;
        }

        const payload = {
            examinationAt: editingRecord ? firstDefined(editingRecord, ["examinationAt", "ExaminationAt"]) : examinationDate.toISOString(),
            reason: form.reason.trim(),
            symptoms: form.symptoms.trim(),
            findings: form.findings.trim(),
            diagnosis: form.diagnosis.trim(),
            healthStatus: form.healthStatus,
            notes: form.notes.trim(),
        };

        if (!payload.reason || !payload.symptoms || !payload.findings || !payload.diagnosis) {
            setError("Reason, symptoms, findings, and diagnosis are required.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (editingRecord) {
                await correctMedicalRecord(selectedHorseId, idOf(editingRecord), payload);
                setSuccess("Medical record corrected successfully.");
            } else {
                await createMedicalRecord(selectedHorseId, payload);
                setSuccess("Medical examination recorded successfully.");
            }

            setShowModal(false);
            setEditingRecord(null);
            setForm(emptyForm);
            await loadRecords();
        } catch (err) {
            console.error(err);
            setError(
                getErrorMessage(
                    err,
                    editingRecord
                        ? "Unable to correct the medical record."
                        : "Unable to create the medical record."
                )
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <MedicalLayout>
            <div className="medical-page-intro">{msg(MSG.MERGED_UI_322)}</div>

            {error && <div className="medical-alert error">{error}</div>}
            {success && <div className="medical-alert success">{success}</div>}

            <section className="medical-record-header">
                <div>
                    <div className="medical-section-eyebrow">{msg(MSG.MERGED_UI_323)}</div>
                    <h2>{msg(MSG.MERGED_UI_324)}</h2>
                    <p>{msg(MSG.MERGED_UI_325)}</p>
                </div>

                <button
                    type="button"
                    className="medical-primary-button"
                    onClick={openCreate}
                    disabled={!selectedHorseId}
                >
                    <Plus size={14} />{msg(MSG.MERGED_UI_326)}</button>
            </section>

            <section className="medical-selector-card">
                <div className="medical-field">
                    <label htmlFor="medical-horse">{msg(MSG.MERGED_UI_327)}</label>
                    <select
                        id="medical-horse"
                        value={selectedHorseId}
                        onChange={(event) => setSelectedHorseId(event.target.value)}
                        disabled={loadingHorses || saving}
                    >
                        {loadingHorses && <option value="">{msg(MSG.MERGED_UI_328)}</option>}
                        {!loadingHorses && horses.length === 0 && (
                            <option value="">{msg(MSG.MERGED_UI_329)}</option>
                        )}
                        {horses.map((horse) => (
                            <option key={idOf(horse)} value={idOf(horse)}>
                                {horseName(horse)}
                                {horseRegistration(horse)
                                    ? ` · ${horseRegistration(horse)}`
                                    : ""}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedHorse && (
                    <div className="medical-selected-horse">
                        <span>{msg(MSG.MERGED_UI_330)}</span>
                        <strong>{horseName(selectedHorse)}</strong>
                        <small>{horseRegistration(selectedHorse) || idOf(selectedHorse)}</small>
                    </div>
                )}
            </section>

            <section className="medical-table-card">
                <div className="medical-table-toolbar medical-record-toolbar">
                    <div className="medical-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder={msg(MSG.MERGED_UI_331)}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <select
                        className="medical-inline-select"
                        value={healthFilter}
                        onChange={(event) => setHealthFilter(event.target.value)}
                    >
                        <option value="">{msg(MSG.MERGED_UI_332)}</option>
                        {HEALTH_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>

                    <span className="medical-record-count">
                        {filteredRecords.length}{msg(MSG.MERGED_UI_333)}{filteredRecords.length === 1 ? "" : "s"}
                    </span>
                </div>

                {loadingRecords ? (
                    <div className="medical-empty-state">{msg(MSG.MERGED_UI_334)}</div>
                ) : filteredRecords.length === 0 ? (
                    <div className="medical-empty-state">
                        <ClipboardPlus size={24} />
                        <strong>{msg(MSG.MERGED_UI_335)}</strong>
                        <span>{msg(MSG.MERGED_UI_336)}</span>
                    </div>
                ) : (
                    <div className="medical-record-timeline">
                        {filteredRecords.map((record) => {
                            const status = firstDefined(
                                record,
                                ["healthStatus", "HealthStatus"],
                                "Unknown"
                            );
                            const examinationAt = firstDefined(
                                record,
                                ["examinationAt", "ExaminationAt"],
                                ""
                            );
                            const reason = firstDefined(record, ["reason", "Reason"], "—");
                            const diagnosis = firstDefined(
                                record,
                                ["diagnosis", "Diagnosis"],
                                "—"
                            );
                            const findings = firstDefined(
                                record,
                                ["findings", "Findings"],
                                "—"
                            );
                            const symptoms = firstDefined(
                                record,
                                ["symptoms", "Symptoms"],
                                "—"
                            );
                            const notes = firstDefined(record, ["notes", "Notes"], "");

                            return (
                                <article className="medical-record-item" key={idOf(record)}>
                                    <div className="medical-record-date">
                                        {formatDateTime(examinationAt)}
                                    </div>

                                    <div className="medical-record-card">
                                        <div className="medical-record-card-header">
                                            <div>
                                                <span className="medical-section-eyebrow">{msg(MSG.MERGED_UI_337)}</span>
                                                <h3>{reason}</h3>
                                            </div>

                                            <span
                                                className={`status-badge ${healthClass(status)}`}
                                            >
                                                {status}
                                            </span>
                                        </div>

                                        <div className="medical-record-summary">
                                            <div>
                                                <span>{msg(MSG.MERGED_UI_338)}</span>
                                                <strong>{diagnosis}</strong>
                                            </div>
                                            <div>
                                                <span>{msg(MSG.MERGED_UI_339)}</span>
                                                <strong>{findings}</strong>
                                            </div>
                                            <div>
                                                <span>{msg(MSG.MERGED_UI_340)}</span>
                                                <strong>{symptoms}</strong>
                                            </div>
                                        </div>

                                        {notes && (
                                            <div className="medical-record-notes">
                                                <span>{msg(MSG.MERGED_UI_341)}</span>
                                                <p>{notes}</p>
                                            </div>
                                        )}

                                        <div className="medical-record-actions">
                                            <button
                                                type="button"
                                                className="medical-secondary-button"
                                                onClick={() => setViewingRecord(record)}
                                            >
                                                <Eye size={13} />{msg(MSG.MERGED_UI_342)}</button>

                                            <button
                                                type="button"
                                                className="medical-secondary-button"
                                                onClick={() => openEdit(record)}
                                            >
                                                <Pencil size={13} />{msg(MSG.MERGED_UI_343)}</button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {showModal && (
                <div className="medical-modal-backdrop" onMouseDown={() => !saving && setShowModal(false)}>
                    <div
                        className="medical-modal"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="medical-modal-header">
                            <div>
                                <span className="medical-section-eyebrow">
                                    {editingRecord ? "CORRECTION" : "NEW EXAMINATION"}
                                </span>
                                <h2>
                                    {editingRecord
                                        ? "Correct Medical Record"
                                        : "Record Medical Examination"}
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="medical-icon-button"
                                onClick={() => setShowModal(false)}
                                disabled={saving}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {editingRecord && (
                            <div className="medical-correction-note">{msg(MSG.MERGED_UI_344)}</div>
                        )}

                        <form className="medical-form" onSubmit={submitForm}>
                            <div className="medical-form-grid">
                                <div className="medical-field">
                                    <label htmlFor="examinationAt">{msg(MSG.MERGED_UI_345)}</label>
                                    <input
                                        id="examinationAt"
                                        type="datetime-local"
                                        disabled={!!editingRecord}
                                        value={form.examinationAt}
                                        onChange={(event) =>
                                            updateField("examinationAt", event.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <div className="medical-field">
                                    <label htmlFor="healthStatus">{msg(MSG.MERGED_UI_346)}</label>
                                    <select
                                        id="healthStatus"
                                        value={form.healthStatus}
                                        onChange={(event) =>
                                            updateField("healthStatus", event.target.value)
                                        }
                                        required
                                    >
                                        {HEALTH_STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="medical-field medical-field-full">
                                    <label htmlFor="reason">{msg(MSG.MERGED_UI_347)}</label>
                                    <input
                                        id="reason"
                                        value={form.reason}
                                        onChange={(event) => updateField("reason", event.target.value)}
                                        placeholder={msg(MSG.MERGED_UI_348)}
                                        required
                                    />
                                </div>

                                <div className="medical-field">
                                    <label htmlFor="symptoms">{msg(MSG.MERGED_UI_349)}</label>
                                    <textarea
                                        id="symptoms"
                                        value={form.symptoms}
                                        onChange={(event) =>
                                            updateField("symptoms", event.target.value)
                                        }
                                        rows="4"
                                        required
                                    />
                                </div>

                                <div className="medical-field">
                                    <label htmlFor="findings">{msg(MSG.MERGED_UI_350)}</label>
                                    <textarea
                                        id="findings"
                                        value={form.findings}
                                        onChange={(event) =>
                                            updateField("findings", event.target.value)
                                        }
                                        rows="4"
                                        required
                                    />
                                </div>

                                <div className="medical-field medical-field-full">
                                    <label htmlFor="diagnosis">{msg(MSG.MERGED_UI_351)}</label>
                                    <textarea
                                        id="diagnosis"
                                        value={form.diagnosis}
                                        onChange={(event) =>
                                            updateField("diagnosis", event.target.value)
                                        }
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="medical-field medical-field-full">
                                    <label htmlFor="notes">{msg(MSG.MERGED_UI_352)}</label>
                                    <textarea
                                        id="notes"
                                        value={form.notes}
                                        onChange={(event) => updateField("notes", event.target.value)}
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <div className="medical-form-footer">
                                <button
                                    type="button"
                                    className="medical-secondary-button"
                                    onClick={() => setShowModal(false)}
                                    disabled={saving}
                                >{msg(MSG.MERGED_UI_353)}</button>

                                <button
                                    type="submit"
                                    className="medical-primary-button"
                                    disabled={saving}
                                >
                                    <ClipboardPlus size={14} />
                                    {saving
                                        ? "Saving..."
                                        : editingRecord
                                            ? "Save Correction"
                                            : "Save Examination"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewingRecord && (
                <div className="medical-modal-backdrop" onMouseDown={() => setViewingRecord(null)}>
                    <div
                        className="medical-modal medical-detail-modal"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="medical-modal-header">
                            <div>
                                <span className="medical-section-eyebrow">{msg(MSG.MERGED_UI_354)}</span>
                                <h2>{msg(MSG.MERGED_UI_355)}</h2>
                            </div>

                            <button
                                type="button"
                                className="medical-icon-button"
                                onClick={() => setViewingRecord(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="medical-detail-grid">
                            <div>
                                <span>{msg(MSG.MERGED_UI_356)}</span>
                                <strong>
                                    {formatDateTime(
                                        firstDefined(
                                            viewingRecord,
                                            ["examinationAt", "ExaminationAt"],
                                            ""
                                        )
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>{msg(MSG.MERGED_UI_357)}</span>
                                <strong>
                                    {firstDefined(
                                        viewingRecord,
                                        ["healthStatus", "HealthStatus"],
                                        "Unknown"
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>{msg(MSG.MERGED_UI_358)}</span>
                                <strong>
                                    {firstDefined(viewingRecord, ["reason", "Reason"], "—")}
                                </strong>
                            </div>

                            <div>
                                <span>{msg(MSG.MERGED_UI_359)}</span>
                                <strong>
                                    {firstDefined(viewingRecord, ["diagnosis", "Diagnosis"], "—")}
                                </strong>
                            </div>

                            <div>
                                <span>{msg(MSG.MERGED_UI_360)}</span>
                                <p>
                                    {firstDefined(
                                        viewingRecord,
                                        ["symptoms", "Symptoms"],
                                        "—"
                                    )}
                                </p>
                            </div>

                            <div>
                                <span>{msg(MSG.MERGED_UI_361)}</span>
                                <p>
                                    {firstDefined(
                                        viewingRecord,
                                        ["findings", "Findings"],
                                        "—"
                                    )}
                                </p>
                            </div>

                            <div className="medical-detail-full">
                                <span>{msg(MSG.MERGED_UI_362)}</span>
                                <p>
                                    {firstDefined(viewingRecord, ["notes", "Notes"], "—")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MedicalLayout>
    );
}

export default MedicalExamination;
