import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Plus, Search, X } from "lucide-react";
import MedicalLayout from "../../components/medical/MedicalLayout";
import {
    createMedicalInjury,
    getMedicalHorses,
    getMedicalInjuries,
    getMedicalRecords,
} from "../../services/medicalService";

const injuryTypes = ["Muscle", "Tendon", "Ligament", "Bone", "Joint", "Hoof", "Wound", "Other"];
const severities = ["Mild", "Moderate", "Severe", "Critical"];
const statuses = ["All", "Active", "Recovering", "Recovered"];

const emptyForm = {
    medicalRecordId: "",
    injuryDate: "",
    type: "Muscle",
    bodyLocation: "",
    severity: "Mild",
    cause: "",
    reviewDate: "",
};

function unwrapList(data) {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.data ?? data?.results ?? data?.value ?? [];
}

function horseIdOf(horse) {
    return horse?.id ?? horse?.horseId;
}

function horseNameOf(horse) {
    return horse?.name ?? horse?.horseName ?? horse?.Name ?? "Unnamed horse";
}

function horseCodeOf(horse) {
    return horse?.registrationNumber ?? horse?.registrationNo ?? horse?.identifier ?? horse?.id ?? "—";
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function statusLabel(status) {
    return String(status ?? "Unknown").toUpperCase();
}

function MedicalInjury() {
    const [horses, setHorses] = useState([]);
    const [selectedHorseId, setSelectedHorseId] = useState("");
    const [records, setRecords] = useState([]);
    const [injuries, setInjuries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingInjuries, setLoadingInjuries] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const selectedHorse = useMemo(
        () => horses.find((horse) => String(horseIdOf(horse)) === String(selectedHorseId)),
        [horses, selectedHorseId]
    );

    const filteredInjuries = useMemo(() => {
        const query = search.trim().toLowerCase();
        return injuries.filter((injury) => {
            const matchesStatus = statusFilter === "All" || statusLabel(injury.status) === statusFilter.toUpperCase();
            const text = [
                injury.type,
                injury.bodyLocation,
                injury.severity,
                injury.cause,
                injury.status,
            ].join(" ").toLowerCase();
            return matchesStatus && (!query || text.includes(query));
        });
    }, [injuries, search, statusFilter]);

    useEffect(() => {
        let active = true;

        const loadHorses = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getMedicalHorses({ page: 1, pageSize: 100 });
                const list = unwrapList(data);
                if (!active) return;
                setHorses(list);
                if (list.length > 0) setSelectedHorseId(String(horseIdOf(list[0])));
            } catch (err) {
                if (active) setError(err?.response?.data?.message || "Unable to load horses.");
            } finally {
                if (active) setLoading(false);
            }
        };

        loadHorses();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!selectedHorseId) {
            setRecords([]);
            setInjuries([]);
            return;
        }

        let active = true;
        const loadMedicalData = async () => {
            try {
                setLoadingInjuries(true);
                setError("");
                const [recordsData, injuriesData] = await Promise.all([
                    getMedicalRecords(selectedHorseId, { page: 1, pageSize: 100 }),
                    getMedicalInjuries(selectedHorseId, { page: 1, pageSize: 100 }),
                ]);
                if (!active) return;
                setRecords(unwrapList(recordsData));
                setInjuries(unwrapList(injuriesData));
            } catch (err) {
                if (active) setError(err?.response?.data?.message || "Unable to load injury records.");
            } finally {
                if (active) setLoadingInjuries(false);
            }
        };

        loadMedicalData();
        return () => {
            active = false;
        };
    }, [selectedHorseId]);

    const openCreate = () => {
        setError("");
        setSuccess("");
        const today = new Date().toISOString().slice(0, 10);
        setForm({ ...emptyForm, medicalRecordId: records[0]?.id ?? records[0]?.medicalRecordId ?? "", injuryDate: today, reviewDate: today });
        setShowModal(true);
    };

    const closeModal = () => {
        if (!saving) setShowModal(false);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!selectedHorseId) {
            setError("Please select a horse first.");
            return;
        }
        if (!form.medicalRecordId) {
            setError("An existing Medical Examination / Record is required before creating an injury.");
            return;
        }
        if (!form.injuryDate || !form.reviewDate) {
            setError("Injury Date and Expected Review Date are required.");
            return;
        }
        if (form.reviewDate < form.injuryDate) {
            setError("Expected Review Date cannot be earlier than Injury Date.");
            return;
        }

        try {
            setSaving(true);
            const created = await createMedicalInjury(selectedHorseId, {
                medicalRecordId: form.medicalRecordId,
                injuryDate: form.injuryDate,
                type: form.type,
                bodyLocation: form.bodyLocation.trim(),
                severity: form.severity,
                cause: form.cause.trim(),
                reviewDate: form.reviewDate,
            });

            setInjuries((current) => [created, ...current]);
            setShowModal(false);
            setSuccess("Injury record created successfully. The horse health status is now INJURED.");
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to create the injury record.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <MedicalLayout>
            <div className="medical-page-heading-row">
                <div>
                    <div className="medical-page-intro">F03-C · Injury Management</div>
                    <h2 className="medical-page-title">Ghi Nhận Chấn Thương</h2>
                    <p className="medical-page-subtitle">
                        Ghi nhận chấn thương theo từng Horse và liên kết trực tiếp với Medical Record.
                    </p>
                </div>
                <button className="medical-primary-button" onClick={openCreate} disabled={!selectedHorseId || records.length === 0}>
                    <Plus size={15} />
                    Ghi nhận chấn thương
                </button>
            </div>

            {error && <div className="medical-alert medical-alert-error">{error}</div>}
            {success && <div className="medical-alert medical-alert-success">{success}</div>}

            <section className="medical-table-card medical-injury-toolbar-card">
                <div className="medical-toolbar-grid">
                    <label className="medical-field">
                        <span>Horse</span>
                        <select value={selectedHorseId} onChange={(event) => setSelectedHorseId(event.target.value)} disabled={loading}>
                            <option value="">Select horse...</option>
                            {horses.map((horse) => (
                                <option key={horseIdOf(horse)} value={horseIdOf(horse)}>
                                    {horseNameOf(horse)} · {horseCodeOf(horse)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="medical-field">
                        <span>Search</span>
                        <div className="medical-search medical-search-wide">
                            <Search size={14} />
                            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Type, location, severity, cause..." />
                        </div>
                    </label>

                    <label className="medical-field">
                        <span>Status</span>
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                            {statuses.map((status) => <option key={status}>{status}</option>)}
                        </select>
                    </label>
                </div>
            </section>

            {selectedHorse && (
                <section className="medical-horse-context">
                    <div>
                        <span>SELECTED HORSE</span>
                        <strong>{horseNameOf(selectedHorse)}</strong>
                        <small>{horseCodeOf(selectedHorse)}</small>
                    </div>
                    <div>
                        <span>MEDICAL RECORDS</span>
                        <strong>{records.length}</strong>
                        <small>available for injury linkage</small>
                    </div>
                    <div>
                        <span>ACTIVE INJURIES</span>
                        <strong>{injuries.filter((item) => statusLabel(item.status) === "ACTIVE").length}</strong>
                        <small>current injury records</small>
                    </div>
                </section>
            )}

            {selectedHorseId && records.length === 0 && !loadingInjuries && (
                <div className="medical-empty-warning">
                    <AlertTriangle size={18} />
                    <div>
                        <strong>No Medical Record available</strong>
                        <span>Create a Medical Examination / Record in F03-B first. The backend requires every injury to be linked to an existing medical record.</span>
                    </div>
                </div>
            )}

            <section className="medical-table-card">
                <div className="medical-section-header">
                    <div>
                        <h3>Injury History</h3>
                        <span>{filteredInjuries.length} record{filteredInjuries.length === 1 ? "" : "s"}</span>
                    </div>
                    {selectedHorse && <span className="medical-section-context">{horseNameOf(selectedHorse)}</span>}
                </div>

                <div className="medical-table-wrapper">
                    <table className="medical-table medical-injury-table">
                        <thead>
                            <tr>
                                <th>Injury Date</th>
                                <th>Type</th>
                                <th>Body Location</th>
                                <th>Severity</th>
                                <th>Cause</th>
                                <th>Status</th>
                                <th>Expected Review</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingInjuries ? (
                                <tr><td colSpan="7" className="medical-empty-cell">Loading injury records...</td></tr>
                            ) : filteredInjuries.length === 0 ? (
                                <tr><td colSpan="7" className="medical-empty-cell">No injury records for the selected filters.</td></tr>
                            ) : (
                                filteredInjuries.map((injury) => (
                                    <tr key={injury.id}>
                                        <td><strong>{formatDate(injury.injuryDate)}</strong></td>
                                        <td>{injury.type}</td>
                                        <td>{injury.bodyLocation}</td>
                                        <td><span className={`injury-severity ${String(injury.severity ?? "").toLowerCase()}`}>{injury.severity}</span></td>
                                        <td>{injury.cause}</td>
                                        <td><span className={`injury-status ${String(injury.status ?? "").toLowerCase()}`}>{statusLabel(injury.status)}</span></td>
                                        <td><CalendarDays size={13} /> {formatDate(injury.reviewDate)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {showModal && (
                <div className="medical-modal-backdrop" onMouseDown={closeModal}>
                    <div className="medical-modal medical-injury-modal" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="medical-modal-header">
                            <div>
                                <span>F03-C</span>
                                <h3>Ghi Nhận Chấn Thương</h3>
                                <p>{selectedHorse ? horseNameOf(selectedHorse) : "Selected horse"}</p>
                            </div>
                            <button className="medical-icon-button" onClick={closeModal} disabled={saving}><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="medical-form-grid">
                            <label className="medical-field medical-field-full">
                                <span>Medical Record *</span>
                                <select name="medicalRecordId" value={form.medicalRecordId} onChange={handleChange} required>
                                    <option value="">Select examination / record...</option>
                                    {records.map((record) => (
                                        <option key={record.id} value={record.id}>
                                            {formatDate(record.examinationAt)} · {record.reason || record.diagnosis || "Medical examination"}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="medical-field">
                                <span>Injury Date *</span>
                                <input type="date" name="injuryDate" value={form.injuryDate} onChange={handleChange} max={new Date().toISOString().slice(0, 10)} required />
                            </label>

                            <label className="medical-field">
                                <span>Expected Review Date *</span>
                                <input type="date" name="reviewDate" value={form.reviewDate} onChange={handleChange} min={form.injuryDate || undefined} required />
                            </label>

                            <label className="medical-field">
                                <span>Injury Type *</span>
                                <select name="type" value={form.type} onChange={handleChange} required>
                                    {injuryTypes.map((type) => <option key={type}>{type}</option>)}
                                </select>
                            </label>

                            <label className="medical-field">
                                <span>Severity *</span>
                                <select name="severity" value={form.severity} onChange={handleChange} required>
                                    {severities.map((severity) => <option key={severity}>{severity}</option>)}
                                </select>
                            </label>

                            <label className="medical-field">
                                <span>Body Location *</span>
                                <input name="bodyLocation" value={form.bodyLocation} onChange={handleChange} placeholder="e.g. Left foreleg tendon" required />
                            </label>

                            <label className="medical-field">
                                <span>Cause *</span>
                                <input name="cause" value={form.cause} onChange={handleChange} placeholder="e.g. Training overload" required />
                            </label>

                            <div className="medical-form-note medical-field-full">
                                <AlertTriangle size={15} />
                                <span>
                                    New injury records start as <strong>ACTIVE</strong>. The backend automatically changes the horse health status to <strong>INJURED</strong>.
                                    Recovery is handled through the medical follow-up / clearance flow rather than editing this record directly.
                                </span>
                            </div>

                            {error && <div className="medical-alert medical-alert-error medical-field-full">{error}</div>}

                            <div className="medical-modal-actions medical-field-full">
                                <button type="button" className="medical-secondary-button" onClick={closeModal} disabled={saving}>Cancel</button>
                                <button type="submit" className="medical-primary-button" disabled={saving}>
                                    {saving ? "Saving..." : "Create Injury Record"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MedicalLayout>
    );
}

export default MedicalInjury;
