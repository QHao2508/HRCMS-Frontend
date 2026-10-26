import MedicalCaseDetails from '../../components/medical/MedicalCaseDetails.jsx';
import { medicalCases } from '../../services/medicalCases.js';
import MedicalChoiceField from '../../components/medical/MedicalChoiceField.jsx';
import { Link } from 'react-router-dom';
import MedicalRecordHistory from '../../components/medical/MedicalRecordHistory.jsx';
import { useMedicalPatientSelection } from '../../services/medicalPatientSelection.js';
import { allMedicalPages } from '../../services/medicalValidation.js';
import { getMedicalLabel } from '../../constants/medicalLabels.js';
import { MSG, msg } from "../../messages/index.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClipboardPlus, Eye, Pencil, Plus, Search, X } from "lucide-react";

import MedicalLayout from "../../components/medical/MedicalLayout";
import {
    correctMedicalRecord,
    createMedicalRecord,
    getMedicalRecords,
    getMedicalHorses,
    getMedicalFollowUps,
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
    return firstDefined(horse, ["name", "Name", "horseName", "HorseName"], msg(MSG.MEDICAL_NGUA_CHUA_CO_TEN));
}

function horseRegistration(horse) {
    return firstDefined(
        horse,
        ["registrationNumber", "RegistrationNumber", "identifier", "Identifier"],
        ""
    );
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("vi-VN", {
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
    const [selectedHorseId, setSelectedHorseId] = useMedicalPatientSelection();
    const [records, setRecords] = useState([]);
    const [followUps, setFollowUps] = useState([]);

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
        let active = true;
        const loadHorses = async () => {
            try {
                setLoadingHorses(true);
                setError("");

                const data = await allMedicalPages(getMedicalHorses);

                if (!active) return;
                const items = listFromResponse(data);
                setHorses(items);

                if (items.length > 0) {
                    setSelectedHorseId(current => items.some(horse => idOf(horse) === current) ? current : idOf(items[0]));
                }
            } catch (err) {
                console.error(err);
                if (active) setError(getErrorMessage(err, msg(MSG.MEDICAL_KHONG_TAI_DUOC_DANH_SACH)));
            } finally {
                if (active) setLoadingHorses(false);
            }
        };

        loadHorses();
        return () => { active = false; };
    }, [setSelectedHorseId]);

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

            const [data, visits] = await Promise.all([
                allMedicalPages(params => getMedicalRecords(selectedHorseId, params)),
                allMedicalPages(params => getMedicalFollowUps(selectedHorseId, params)),
            ]);

            if(version === requestVersion.current) { setRecords(listFromResponse(data)); setFollowUps(listFromResponse(visits)); }
        } catch (err) {
            console.error(err);
            if(version === requestVersion.current) setError(getErrorMessage(err, msg(MSG.EXAM_KHONG_TAI_DUOC_HO_SO)));
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

    const cases = useMemo(() => medicalCases(records, followUps), [records, followUps]);
    const caseById = useMemo(() => new Map(cases.map(item => [item.id, item])), [cases]);
    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase();

        return cases.map(item => item.record).filter((record) => {
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
    }, [cases, search, healthFilter]);

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
            setError(msg(MSG.EXAM_HAY_CHON_NGUA_TRUOC_KHI));
            return;
        }

        if (!form.examinationAt) {
            setError(msg(MSG.EXAM_HAY_NHAP_NGAY_VA_GIO));
            return;
        }

        const examinationDate = new Date(form.examinationAt);

        if (Number.isNaN(examinationDate.getTime())) {
            setError(msg(MSG.MEDICAL_DATE_INVALID));
            return;
        }

        if (examinationDate > new Date()) {
            setError(msg(MSG.MEDICAL_DATE_FUTURE));
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
            setError(msg(MSG.EXAM_HAY_NHAP_DAY_DU_LY));
            return;
        }
        // Một vấn đề = một hồ sơ: chặn tạo hồ sơ mới khi đã có hồ sơ mở cùng lý do khám.
        const duplicate = !editingRecord && cases.find(item => !item.resolved && String(item.first.reason || '').trim().toLowerCase() === payload.reason.toLowerCase());
        if (duplicate) {
            setError(msg(MSG.MED_CASE_DUPLICATE, { reason: payload.reason, title: msg(MSG.MEDICAL_RECORD_NUMBER, { number: duplicate.number }) }));
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (editingRecord) {
                await correctMedicalRecord(selectedHorseId, idOf(editingRecord), payload);
                setSuccess(msg(MSG.EXAM_DA_LUU_BAN_DIEU_CHINH));
            } else {
                await createMedicalRecord(selectedHorseId, payload);
                setSuccess(msg(MSG.EXAM_DA_LUU_KET_QUA_THAM));
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
                        ? msg(MSG.EXAM_KHONG_LUU_DUOC_BAN_DIEU)
                        : msg(MSG.EXAM_KHONG_TAO_DUOC_HO_SO)
                )
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <MedicalLayout>
            <div className="medical-page-intro">{msg(MSG.EXAM_KHAM_VA_LUU_HO_SO)}</div>

            {error && <div className="medical-alert error">{error}</div>}
            {success && <div className="medical-alert success">{success}</div>}

            <section className="medical-record-header">
                <div>
                    <div className="medical-section-eyebrow">{msg(MSG.EXAM_CHON_NGUA)}</div>
                    <h2>{msg(MSG.EXAM_HO_SO_THAM_KHAM)}</h2>
                    <p>{msg(MSG.EXAM_BAC_SI_THU_Y_GHI)}</p>
                </div>

                <button
                    type="button"
                    className="medical-primary-button"
                    onClick={openCreate}
                    disabled={!selectedHorseId || loadingHorses || !selectedHorse}
                >
                    <Plus size={14} />{msg(MSG.EXAM_GHI_NHAN_THAM_KHAM)}</button>
            </section>

            <section className="medical-selector-card">
                <div className="medical-field">
                    <label htmlFor="medical-horse">{msg(MSG.EXAM_NGUA)}</label>
                    <select
                        id="medical-horse"
                        value={selectedHorseId}
                        onChange={(event) => setSelectedHorseId(event.target.value)}
                        disabled={loadingHorses || saving}
                    >
                        {loadingHorses && <option value="">{msg(MSG.EXAM_DANG_TAI_DANH_SACH_NGUA)}</option>}
                        {!loadingHorses && horses.length === 0 && (
                            <option value="">{msg(MSG.EXAM_CHUA_CO_NGUA_TRONG_PHAM)}</option>
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
                        <span>{msg(MSG.EXAM_NGUA_DANG_CHON)}</span>
                        <strong>{horseName(selectedHorse)}</strong>
                        <small>{horseRegistration(selectedHorse) || msg(MSG.MEDICAL_WORKSPACE_NO_CODE)}</small>
                    </div>
                )}
            </section>

            <section className="medical-table-card">
                <div className="medical-table-toolbar medical-record-toolbar">
                    <div className="medical-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder={msg(MSG.EXAM_TIM_CHAN_DOAN_LY_DO)}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <select
                        className="medical-inline-select"
                        value={healthFilter}
                        onChange={(event) => setHealthFilter(event.target.value)}
                    >
                        <option value="">{msg(MSG.EXAM_TAT_CA_TINH_TRANG_SUC)}</option>
                        {HEALTH_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {getMedicalLabel(status)}
                            </option>
                        ))}
                    </select>

                    <span className="medical-record-count">
                        {filteredRecords.length}{msg(MSG.EXAM_HO_SO)}
                    </span>
                </div>

                {loadingRecords ? (
                    <div className="medical-empty-state">{msg(MSG.EXAM_DANG_TAI_LICH_SU_KHAM)}</div>
                ) : filteredRecords.length === 0 ? (
                    <div className="medical-empty-state">
                        <ClipboardPlus size={24} />
                        <strong>{msg(MSG.EXAM_CHUA_CO_HO_SO_KHAM)}</strong>
                        <span>{msg(MSG.EXAM_KHONG_CO_HO_SO_KHAM)}</span>
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
                            const medicalCase = caseById.get(idOf(record));

                            return (
                                <article className="medical-record-item" key={idOf(record)}>
                                    <div className="medical-record-date">
                                        {formatDateTime(examinationAt)}
                                    </div>

                                    <div className="medical-record-card">
                                        <div className="medical-record-card-header">
                                            <div>
                                                <span className="medical-section-eyebrow">{msg(MSG.EXAM_THAM_KHAM)}</span>
                                                <h3>{medicalCase?.first?.reason || reason}</h3>
                                                {medicalCase && <small><span className={`badge ${medicalCase.resolved ? "text-bg-success" : "text-bg-warning"}`}>{msg(medicalCase.resolved ? MSG.MED_CASE_RESOLVED : MSG.MED_CASE_OPEN)}</span>{" "}{msg(MSG.MEDICAL_RECORD_NUMBER, { number: medicalCase.number })}{" · "}{msg(MSG.MED_CASE_VISITS, { count: medicalCase.visits.length })}</small>}
                                            </div>

                                            <span
                                                className={`status-badge ${healthClass(status)}`}
                                            >
                                                {getMedicalLabel(status)}
                                            </span>
                                        </div>

                                        <div className="medical-record-summary">
                                            <div>
                                                <span>{msg(MSG.EXAM_CHAN_DOAN)}</span>
                                                <strong>{diagnosis}</strong>
                                            </div>
                                            <div>
                                                <span>{msg(MSG.EXAM_KET_QUA_KHAM)}</span>
                                                <strong>{findings}</strong>
                                            </div>
                                            <div>
                                                <span>{msg(MSG.EXAM_TRIEU_CHUNG_QUAN_SAT)}</span>
                                                <strong>{symptoms}</strong>
                                            </div>
                                        </div>

                                        {notes && (
                                            <div className="medical-record-notes">
                                                <span>{msg(MSG.EXAM_GHI_CHU)}</span>
                                                <p>{notes}</p>
                                            </div>
                                        )}

                                        <MedicalRecordHistory record={record} records={records} onView={setViewingRecord} />
                                        <div className="medical-record-actions">
                                            <button
                                                type="button"
                                                className="medical-secondary-button"
                                                onClick={() => setViewingRecord(record)}
                                            >
                                                <Eye size={13} />{msg(MSG.EXAM_XEM_CHI_TIET)}</button>

                                            <button
                                                type="button"
                                                className="medical-secondary-button"
                                                onClick={() => openEdit(record)}
                                            >
                                                <Pencil size={13} />{msg(MSG.EXAM_DIEU_CHINH_HO_SO)}</button>
                                            {medicalCase && !medicalCase.resolved && <Link className="medical-primary-button" to={`/medical/follow-up?horseId=${encodeURIComponent(selectedHorseId)}&recordId=${encodeURIComponent(idOf(record))}`}>{msg(MSG.MED_CASE_FOLLOW_UP)}</Link>}
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
                        className="medical-modal" role="dialog" aria-modal="true" aria-label={editingRecord ? msg(MSG.EXAM_DIEU_CHINH_HO_SO_KHAM) : msg(MSG.MEDICAL_CREATE_EXAMINATION)}
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="medical-modal-header">
                            <div>
                                <span className="medical-section-eyebrow">
                                    {editingRecord ? msg(MSG.EXAM_DIEU_CHINH) : msg(MSG.EXAM_THAM_KHAM_MOI)}
                                </span>
                                <h2>
                                    {editingRecord
                                        ? msg(MSG.EXAM_DIEU_CHINH_HO_SO_KHAM)
                                        : msg(MSG.MEDICAL_CREATE_EXAMINATION)}
                                </h2>
<p className="medical-modal-patient"><span>{msg(MSG.MEDICAL_WORKSPACE_PATIENT_LABEL)}</span><strong>{selectedHorse ? horseName(selectedHorse) : ""}</strong><span>{selectedHorse ? horseRegistration(selectedHorse) || msg(MSG.MEDICAL_WORKSPACE_NO_CODE) : ""}</span></p>
                            </div>

                            <button
                                type="button"
                                className="medical-icon-button"
                                aria-label={msg(MSG.MEDICAL_WORKSPACE_CLOSE)}
                                onClick={() => setShowModal(false)}
                                disabled={saving}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {editingRecord && (
                            <div className="medical-correction-note">{msg(MSG.EXAM_DIEU_CHINH_TAO_MOT_BAN)}</div>
                        )}

                        <div className="px-4 pt-3"><p className="form-text mb-2">{msg(MSG.MED_CASE_HELP)}</p>
                        {error && <div className="medical-alert error">{error}</div>}</div>
                        {!editingRecord && cases.some(item => !item.resolved && ((form.reason && item.record.reason === form.reason) || (form.diagnosis && item.record.diagnosis === form.diagnosis))) && <div className="medical-alert medical-alert-info"><p>{msg(MSG.MED_EXISTING_CASE_HELP)}</p>{cases.filter(item => !item.resolved && ((form.reason && item.record.reason === form.reason) || (form.diagnosis && item.record.diagnosis === form.diagnosis))).map(item => <p key={item.id}><Link to={`/medical/follow-up?horseId=${encodeURIComponent(selectedHorseId)}&recordId=${encodeURIComponent(item.id)}`}>{msg(MSG.MED_EXISTING_CASE_ACTION)}{msg(MSG.MED_HISTORY_COLON)}{item.record.reason}{msg(MSG.MED_HISTORY_SEPARATOR)}{item.record.diagnosis}</Link></p>)}</div>}
                        <form className="medical-form" onSubmit={submitForm}>
                            <div className="medical-form-grid">
                                <div className="medical-field">
                                    <label htmlFor="examinationAt">{msg(MSG.EXAM_THOI_DIEM_KHAM)}</label>
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
                                    <label htmlFor="healthStatus">{msg(MSG.EXAM_TINH_TRANG_SUC_KHOE)}</label>
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
                                                {getMedicalLabel(status)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <MedicalChoiceField field="reason" label={msg(MSG.EXAM_LY_DO)} value={form.reason} onChange={value => updateField("reason", value)} disabled={saving} />
                                <MedicalChoiceField field="symptoms" label={msg(MSG.EXAM_TRIEU_CHUNG_QUAN_SAT_2)} value={form.symptoms} onChange={value => updateField("symptoms", value)} disabled={saving} />
                                <MedicalChoiceField field="findings" label={msg(MSG.EXAM_KET_QUA_KHAM_2)} value={form.findings} onChange={value => updateField("findings", value)} disabled={saving} />
                                <MedicalChoiceField field="diagnosis" label={msg(MSG.EXAM_CHAN_DOAN_2)} value={form.diagnosis} onChange={value => updateField("diagnosis", value)} disabled={saving} />
                                <div className="medical-field medical-field-full">
                                    <label htmlFor="notes">{msg(MSG.EXAM_GHI_CHU_2)}</label>
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
                                >{msg(MSG.EXAM_HUY)}</button>

                                <button
                                    type="submit"
                                    className="medical-primary-button"
                                    disabled={saving}
                                >
                                    <ClipboardPlus size={14} />
                                    {saving
                                        ? msg(MSG.MEDICAL_DANG_LUU)
                                        : editingRecord
                                            ? msg(MSG.EXAM_LUU_DIEU_CHINH)
                                            : msg(MSG.EXAM_LUU_THAM_KHAM)}
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
                                <span className="medical-section-eyebrow">{msg(MSG.EXAM_HO_SO_THU_Y)}</span>
                                <h2>{msg(MSG.EXAM_CHI_TIET_THAM_KHAM)}</h2><p className="medical-modal-patient"><span>{msg(MSG.MEDICAL_WORKSPACE_PATIENT_LABEL)}</span><strong>{selectedHorse ? horseName(selectedHorse) : ""}</strong><span>{selectedHorse ? horseRegistration(selectedHorse) || msg(MSG.MEDICAL_WORKSPACE_NO_CODE) : ""}</span></p>
                            </div>

                            <button
                                type="button"
                                className="medical-icon-button"
                                aria-label={msg(MSG.MEDICAL_WORKSPACE_CLOSE)}
                                onClick={() => setViewingRecord(null)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="medical-detail-grid">
                            <div>
                                <span>{msg(MSG.EXAM_THAM_KHAM_2)}</span>
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
                                <span>{msg(MSG.EXAM_TINH_TRANG_SUC_KHOE_2)}</span>
                                <strong>
                                    {getMedicalLabel(firstDefined(viewingRecord, ["healthStatus", "HealthStatus"], "Unknown"))}
                                </strong>
                            </div>

                            <div>
                                <span>{msg(MSG.EXAM_LY_DO_2)}</span>
                                <strong>
                                    {firstDefined(viewingRecord, ["reason", "Reason"], "—")}
                                </strong>
                            </div>

                            <div>
                                <span>{msg(MSG.EXAM_CHAN_DOAN_3)}</span>
                                <strong>
                                    {firstDefined(viewingRecord, ["diagnosis", "Diagnosis"], "—")}
                                </strong>
                            </div>

                            <div>
                                <span>{msg(MSG.EXAM_TRIEU_CHUNG_QUAN_SAT_3)}</span>
                                <p>
                                    {firstDefined(
                                        viewingRecord,
                                        ["symptoms", "Symptoms"],
                                        "—"
                                    )}
                                </p>
                            </div>

                            <div>
                                <span>{msg(MSG.EXAM_KET_QUA_KHAM_3)}</span>
                                <p>
                                    {firstDefined(
                                        viewingRecord,
                                        ["findings", "Findings"],
                                        "—"
                                    )}
                                </p>
                            </div>

                            <div className="medical-detail-full">
                                <span>{msg(MSG.EXAM_GHI_CHU_3)}</span>
                                <p>
                                    {firstDefined(viewingRecord, ["notes", "Notes"], "—")}
                                </p>
                            </div>
                        </div>
                        <MedicalCaseDetails key={viewingRecord.id} horseId={selectedHorseId} recordId={viewingRecord.id} cases={cases} onMerged={() => { setViewingRecord(null); loadRecords(); }} />
                    </div>
                </div>
            )}
        </MedicalLayout>
    );
}

export default MedicalExamination;
