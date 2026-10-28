import { systemRegistrationCode } from "../../services/horseIdentifiers.js";
import { useMedicalDialog } from '../../services/useMedicalDialog.js';
import { horseRegistrationCode } from '../../services/careUi.js';
import { useMedicalPatientSelection } from '../../services/medicalPatientSelection.js';
import { allMedicalPages } from '../../services/medicalValidation.js';
import { medicalRecordChoices } from '../../services/medicalRecordChoices.js';
import { useMedicalFollowUps } from '../../services/useMedicalFollowUps.js';
import { getMedicalLabel, getInjuryStatusLabel } from '../../constants/medicalLabels.js';
import { MSG, msg } from "../../messages/index.js";
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
    return horse?.name ?? horse?.horseName ?? horse?.Name ?? msg(MSG.MEDICAL_NGUA_CHUA_CO_TEN);
}

function horseCodeOf(horse) {
    return horseRegistrationCode(horse);
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("vi-VN", {
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
    const [selectedHorseId, setSelectedHorseId] = useMedicalPatientSelection();
    const [records, setRecords] = useState([]);
    const followUps = useMedicalFollowUps(selectedHorseId);
    const caseChoices = medicalRecordChoices(records, followUps, { openOnly: true });
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

    const dialogRef = useMedicalDialog(showModal, saving, () => setShowModal(false));
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
                const data = await allMedicalPages(getMedicalHorses);
                const list = unwrapList(data);
                if (!active) return;
                setHorses(list);
                if (list.length > 0) setSelectedHorseId(current => list.some(horse => String(horseIdOf(horse)) === current) ? current : String(horseIdOf(list[0])));
            } catch (err) {
                if (active) setError(err?.message || err?.response?.data?.message || msg(MSG.MEDICAL_KHONG_TAI_DUOC_DANH_SACH));
            } finally {
                if (active) setLoading(false);
            }
        };

        loadHorses();
        return () => {
            active = false;
        };
    }, [setSelectedHorseId]);

    useEffect(() => {
        if (!selectedHorseId) { let active=true; queueMicrotask(()=>{if(active){
            setRecords([]);
            setInjuries([]);
            }}); return ()=>{active=false;}; }

        let active = true;
        const loadMedicalData = async () => {
            try {
                setLoadingInjuries(true);
                setError("");
                const [recordsData, injuriesData] = await Promise.all([
                    allMedicalPages(params => getMedicalRecords(selectedHorseId, params)),
                    allMedicalPages(params => getMedicalInjuries(selectedHorseId, params)),
                ]);
                if (!active) return;
                setRecords(unwrapList(recordsData));
                setInjuries(unwrapList(injuriesData));
            } catch (err) {
                if (active) setError(err?.message || err?.response?.data?.message || msg(MSG.INJURY_KHONG_TAI_DUOC_HO_SO));
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
        setForm({ ...emptyForm, medicalRecordId: caseChoices[0]?.value ?? "", injuryDate: today, reviewDate: today });
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

        if (!selectedHorseId) { let active=true; queueMicrotask(()=>{if(active){
            setError(msg(MSG.INJURY_HAY_CHON_NGUA_TRUOC));
            }}); return ()=>{active=false;}; }
        if (!form.medicalRecordId) {
            setError(msg(MSG.INJURY_CAN_CO_HO_SO_KHAM));
            return;
        }
        if (!form.injuryDate || !form.reviewDate) {
            setError(msg(MSG.INJURY_HAY_NHAP_NGAY_CHAN_THUONG));
            return;
        }
        if (form.reviewDate < form.injuryDate) {
            setError(msg(MSG.MEDICAL_REVIEW_DATE_INVALID));
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
            setSuccess(msg(MSG.INJURY_DA_GHI_NHAN_CHAN_THUONG));
        } catch (err) {
            setError(err?.message || err?.response?.data?.message || msg(MSG.INJURY_KHONG_GHI_NHAN_DUOC_CHAN));
        } finally {
            setSaving(false);
        }
    };

    return (
        <MedicalLayout>
            <div className="medical-page-heading-row">
                <div>
                    <div className="medical-page-intro">{msg(MSG.INJURY_THEO_DOI_CHAN_THUONG)}</div>
                    <h2 className="medical-page-title">{msg(MSG.INJURY_GHI_NHAN_CHAN_THUONG)}</h2>
                    <p className="medical-page-subtitle">{msg(MSG.INJURY_GHI_NHAN_CHAN_THUONG_CUA)}</p>
                </div>
                <button className="medical-primary-button" onClick={openCreate} disabled={!selectedHorseId || records.length === 0}>
                    <Plus size={15} />{msg(MSG.INJURY_GHI_NHAN_CHAN_THUONG_2)}</button>
            </div>

            {error && <div className="medical-alert medical-alert-error">{error}</div>}
            {success && <div className="medical-alert medical-alert-success">{success}</div>}

            <section className="medical-table-card medical-injury-toolbar-card">
                <div className="medical-toolbar-grid">
                    <label className="medical-field">
                        <span>{msg(MSG.INJURY_NGUA)}</span>
                        <select value={selectedHorseId} onChange={(event) => setSelectedHorseId(event.target.value)} disabled={loading || saving}>
                            <option value="">{msg(MSG.INJURY_CHON_NGUA)}</option>
                            {horses.map((horse) => (
                                <option key={horseIdOf(horse)} value={horseIdOf(horse)}>
                                    {horseNameOf(horse)}{horseCodeOf(horse) ? ` · ${horseCodeOf(horse)}` : ""}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="medical-field">
                        <span>{msg(MSG.INJURY_TIM_KIEM)}</span>
                        <div className="medical-search medical-search-wide">
                            <Search size={14} />
                            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={msg(MSG.INJURY_LOAI_VI_TRI_MUC_DO)} />
                        </div>
                    </label>

                    <label className="medical-field">
                        <span>{msg(MSG.INJURY_TRANG_THAI)}</span>
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                            {statuses.map((status) => <option key={status} value={status}>{getInjuryStatusLabel(status)}</option>)}
                        </select>
                    </label>
                </div>
            </section>

            {selectedHorse && (
                <section className="medical-horse-context">
                    <div>
                        <span>{msg(MSG.INJURY_NGUA_DANG_CHON)}</span>
                        <strong>{horseNameOf(selectedHorse)}</strong>
                        <small>{horseCodeOf(selectedHorse) || msg(MSG.MEDICAL_WORKSPACE_NO_CODE)}</small>
                    </div>
                    <div>
                        <span>{msg(MSG.INJURY_HO_SO_KHAM)}</span>
                        <strong>{records.length}</strong>
                        <small>{msg(MSG.INJURY_CO_THE_LIEN_KET_VOI)}</small>
                    </div>
                    <div>
                        <span>{msg(MSG.INJURY_CHAN_THUONG_CHUA_HOI_PHUC)}</span>
                        <strong>{injuries.filter((item) => statusLabel(item.status) === "ACTIVE").length}</strong>
                        <small>{msg(MSG.INJURY_HO_SO_CHAN_THUONG_HIEN)}</small>
                    </div>
                </section>
            )}

            {selectedHorseId && records.length === 0 && !loadingInjuries && (
                <div className="medical-empty-warning">
                    <AlertTriangle size={18} />
                    <div>
                        <strong>{msg(MSG.INJURY_CHUA_CO_HO_SO_KHAM)}</strong>
                        <span>{msg(MSG.INJURY_HAY_GHI_NHAN_THAM_KHAM)}</span>
                    </div>
                </div>
            )}

            <section className="medical-table-card">
                <div className="medical-section-header">
                    <div>
                        <h3>{msg(MSG.INJURY_LICH_SU_CHAN_THUONG)}</h3>
                        <span>{filteredInjuries.length}{msg(MSG.INJURY_HO_SO)}</span>
                    </div>
                    {selectedHorse && <span className="medical-section-context">{horseNameOf(selectedHorse)}</span>}
                </div>

                <div className="medical-table-wrapper">
                    <table className="medical-table medical-injury-table">
                        <thead>
                            <tr>
                                <th>{msg(MSG.INJURY_NGAY_CHAN_THUONG)}</th>
                                <th>{msg(MSG.INJURY_LOAI)}</th>
                                <th>{msg(MSG.INJURY_VI_TRI_TREN_CO_THE)}</th>
                                <th>{msg(MSG.INJURY_MUC_DO)}</th>
                                <th>{msg(MSG.INJURY_NGUYEN_NHAN)}</th>
                                <th>{msg(MSG.INJURY_TRANG_THAI_2)}</th>
                                <th>{msg(MSG.INJURY_DU_KIEN_TAI_KIEM_TRA)}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingInjuries ? (
                                <tr><td colSpan="7" className="medical-empty-cell">{msg(MSG.INJURY_DANG_TAI_HO_SO_CHAN)}</td></tr>
                            ) : filteredInjuries.length === 0 ? (
                                <tr><td colSpan="7" className="medical-empty-cell">{msg(MSG.INJURY_KHONG_CO_HO_SO_CHAN)}</td></tr>
                            ) : (
                                filteredInjuries.map((injury) => (
                                    <tr key={injury.id}>
                                        <td><strong>{formatDate(injury.injuryDate)}</strong></td>
                                        <td>{getMedicalLabel(injury.type)}</td>
                                        <td>{injury.bodyLocation}</td>
                                        <td><span className={`injury-severity ${String(injury.severity ?? "").toLowerCase()}`}>{getMedicalLabel(injury.severity)}</span></td>
                                        <td>{injury.cause}</td>
                                        <td><span className={`injury-status ${String(injury.status ?? "").toLowerCase()}`}>{getInjuryStatusLabel(injury.status)}</span></td>
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
                    <div className="medical-modal medical-injury-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-label={msg(MSG.MEDICAL_WORKSPACE_INJURIES)} onMouseDown={(event) => event.stopPropagation()}>
                        <div className="medical-modal-header">
                            <div>
                                <span>{msg(MSG.MEDICAL_WORKSPACE_INJURIES)}</span>
                                <h3>{msg(MSG.INJURY_GHI_NHAN_CHAN_THUONG_3)}</h3><p className="medical-modal-patient"><span>{msg(MSG.MEDICAL_WORKSPACE_PATIENT_LABEL)}</span><strong>{selectedHorse ? horseNameOf(selectedHorse) : ""}</strong><span>{systemRegistrationCode(selectedHorse) || msg(MSG.MEDICAL_WORKSPACE_NO_CODE)}</span></p>

                            </div>
                            <button className="medical-icon-button" aria-label={msg(MSG.MEDICAL_WORKSPACE_CLOSE)} onClick={closeModal} disabled={saving}><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="medical-form-grid">
                            <label className="medical-field medical-field-full">
                                <span>{msg(MSG.INJURY_HO_SO_KHAM_2)}</span>
                                <select name="medicalRecordId" value={form.medicalRecordId} onChange={handleChange} required>
                                    <option value="">{msg(MSG.INJURY_CHON_HO_SO_KHAM)}</option>
                                    {caseChoices.map((choice) => (
                                        <option key={choice.value} value={choice.value}>{choice.label}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="medical-field">
                                <span>{msg(MSG.INJURY_NGAY_CHAN_THUONG_2)}</span>
                                <input type="date" name="injuryDate" value={form.injuryDate} onChange={handleChange} max={new Date().toISOString().slice(0, 10)} required />
                            </label>

                            <label className="medical-field">
                                <span>{msg(MSG.INJURY_NGAY_DU_KIEN_TAI_KIEM)}</span>
                                <input type="date" name="reviewDate" value={form.reviewDate} onChange={handleChange} min={form.injuryDate || undefined} required />
                            </label>

                            <label className="medical-field">
                                <span>{msg(MSG.INJURY_LOAI_CHAN_THUONG)}</span>
                                <select name="type" value={form.type} onChange={handleChange} required>
                                    {injuryTypes.map((type) => <option key={type} value={type}>{getMedicalLabel(type)}</option>)}
                                </select>
                            </label>

                            <label className="medical-field">
                                <span>{msg(MSG.INJURY_MUC_DO_2)}</span>
                                <select name="severity" value={form.severity} onChange={handleChange} required>
                                    {severities.map((severity) => <option key={severity} value={severity}>{getMedicalLabel(severity)}</option>)}
                                </select>
                            </label>

                            <label className="medical-field">
                                <span>{msg(MSG.INJURY_VI_TRI_TREN_CO_THE_2)}</span>
                                <input name="bodyLocation" value={form.bodyLocation} onChange={handleChange} placeholder={msg(MSG.INJURY_VI_DU_GAN_CHAN_TRUOC)} required />
                            </label>

                            <label className="medical-field">
                                <span>{msg(MSG.INJURY_NGUYEN_NHAN_2)}</span>
                                <input name="cause" value={form.cause} onChange={handleChange} placeholder={msg(MSG.INJURY_VI_DU_QUA_TAI_KHI)} required />
                            </label>

                            <div className="medical-form-note medical-field-full">
                                <AlertTriangle size={15} />
                                <span>{msg(MSG.INJURY_CHAN_THUONG_MOI_CO_TRANG)}<strong>{msg(MSG.INJURY_CHUA_HOI_PHUC)}</strong>{msg(MSG.INJURY_TINH_TRANG_SUC_KHOE_CUA)}<strong>{msg(MSG.INJURY_CHAN_THUONG)}</strong>{msg(MSG.INJURY_GHI_NHAN_HOI_PHUC_QUA)}</span>
                            </div>

                            {error && <div className="medical-alert medical-alert-error medical-field-full">{error}</div>}

                            <div className="medical-modal-actions medical-field-full">
                                <button type="button" className="medical-secondary-button" onClick={closeModal} disabled={saving}>{msg(MSG.INJURY_HUY)}</button>
                                <button type="submit" className="medical-primary-button" disabled={saving}>
                                    {saving ? msg(MSG.MEDICAL_DANG_LUU) : msg(MSG.INJURY_LUU_CHAN_THUONG)}
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
