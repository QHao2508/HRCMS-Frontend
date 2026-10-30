import { ResourceState } from '../../components/WorkflowUI.jsx';
import { calendarDate, clubDateTimeInput } from '../../services/displayDate.js';
import { treatmentFrequency } from "../../services/treatmentFrequency.js";
import { systemRegistrationCode } from "../../services/horseIdentifiers.js";
import { useMedicalDialog, confirmMedicalClose } from '../../services/useMedicalDialog.js';
import { currentMedicalRecords } from '../../services/medicalRecordVersions.js';
import { Link } from 'react-router-dom';
import MedicalRecordPicker from '../../components/medical/MedicalRecordPicker.jsx';
import { useMedicalPatientSelection } from '../../services/medicalPatientSelection.js';
import { allMedicalPages } from '../../services/medicalValidation.js';
import { getMedicalLabel } from '../../constants/medicalLabels.js';
import { MSG, msg } from "../../messages/index.js";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, Search } from "lucide-react";
import MedicalLayout from "../../components/medical/MedicalLayout";
import {
    createMedicalTreatment,
    getMedicalHorses,
    getMedicalInjuries,
    getMedicalRecords,
    getMedicalTreatments,
    updateMedicalTreatmentStatus,
} from "../../services/medicalService";
import { allPages } from "../../services/supportService.js";

function unwrapList(data) {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.data ?? data?.results ?? data?.value ?? [];
}
function horseIdOf(horse) { return horse?.id ?? horse?.horseId; }
function horseNameOf(horse) { return horse?.name ?? horse?.horseName ?? horse?.Name ?? msg(MSG.MEDICAL_NGUA_CHUA_CO_TEN); }
const formatDate = calendarDate;
function statusOf(item) { return item?.completed ? "Completed" : "Active"; }

const emptyForm = {
    medicalRecordId: "",
    injuryId: "",
    startDate: "",
    followUpDate: "",
    objective: "",
    instructions: "",
    medication: "",
    frequency: "",
};

function MedicalTreatment() {
    const [horses, setHorses] = useState([]);
    const [selectedHorseId, setSelectedHorseId] = useMedicalPatientSelection();
    const [records, setRecords] = useState([]);
    const [injuries, setInjuries] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [careTasks, setCareTasks] = useState([]);
    const [careUnavailable,setCareUnavailable] = useState(false);
    const [updatingId, setUpdatingId] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const dialogRef = useMedicalDialog(showModal, saving, () => setShowModal(false));
    const selectedHorse = useMemo(() => horses.find((h) => String(horseIdOf(h)) === String(selectedHorseId)), [horses, selectedHorseId]);
    const filteredTreatments = useMemo(() => {
        const q = search.trim().toLowerCase();
        return treatments.filter((item) => {
            const status = statusOf(item);
            const text = [item.objective, item.instructions, item.medication, item.frequency, status].join(" ").toLowerCase();
            return (statusFilter === "All" || status === statusFilter) && (!q || text.includes(q));
        });
    }, [treatments, search, statusFilter]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setLoading(true);
                const data = await allMedicalPages(getMedicalHorses);
                const list = unwrapList(data);
                if (!active) return;
                setHorses(list);
                if (list.length) setSelectedHorseId(current => list.some(horse => String(horseIdOf(horse)) === current) ? current : String(horseIdOf(list[0])));
            } catch (err) {
                if (active) setError(err?.message || err?.response?.data?.message || msg(MSG.MEDICAL_KHONG_TAI_DUOC_DANH_SACH));
            } finally { if (active) setLoading(false); }
        })();
        return () => { active = false; };
    }, [setSelectedHorseId]);

    useEffect(() => {
        if (!selectedHorseId) { let active=true; queueMicrotask(()=>{if(active){ setRecords([]); setInjuries([]); setTreatments([]); }}); return ()=>{active=false;}; }
        let active = true;
        (async () => {
            try {
                setLoadingData(true); setError("");
                const [r, i, t, c] = await Promise.all([
                    allMedicalPages(params => getMedicalRecords(selectedHorseId, params)),
                    allMedicalPages(params => getMedicalInjuries(selectedHorseId, params)),
                    allMedicalPages(params => getMedicalTreatments(selectedHorseId, params)),
                    allPages('/api/care/tasks', { horseId: selectedHorseId }).catch(() => null),
                ]);
                if (!active) return;
                setRecords(unwrapList(r)); setInjuries(unwrapList(i)); setTreatments(unwrapList(t)); setCareTasks(c || []); setCareUnavailable(c === null);
            } catch (err) {
                if (active) setError(err?.message || err?.response?.data?.message || msg(MSG.TREAT_KHONG_TAI_DUOC_PHAC_DO));
            } finally { if (active) setLoadingData(false); }
        })();
        return () => { active = false; };
    }, [selectedHorseId]);

    const openCreate = () => {
        const today = clubDateTimeInput().slice(0, 10);
        setError(""); setSuccess("");
        setForm({ ...emptyForm, medicalRecordId: "", injuryId: "", startDate: today, followUpDate: today });
        setShowModal(true);
    };

    // Groom hoàn thành việc điều trị → vet xem tiến độ và cập nhật trạng thái phác đồ.
    const progress = (plan) => { const tasks = careTasks.filter(task => task.treatmentPlanId === plan.id && task.type === "Treatment"); return { total: tasks.length, done: tasks.filter(task => task.status === "Completed").length }; };
    const setPlanStatus = async (plan, completed) => {
        try {
            setUpdatingId(plan.id); setError(""); setSuccess("");
            const updated = await updateMedicalTreatmentStatus(selectedHorseId, plan.id, completed);
            setTreatments(current => current.map(item => item.id === plan.id ? { ...item, ...updated } : item));
            setSuccess(msg(MSG.TREAT_STATUS_SAVED));
        } catch (err) { setError(err?.message || msg(MSG.TREAT_KHONG_TAO_DUOC_PHAC_DO)); }
        finally { setUpdatingId(""); }
    };

    const submit = async (event) => {
        event.preventDefault(); setError(""); setSuccess("");
        if (!currentMedicalRecords(records).some(record => record.id === form.medicalRecordId)) return setError(msg(MSG.MEDICAL_HAY_CHON_HO_SO_KHAM));
        if (!form.startDate || !form.followUpDate) return setError(msg(MSG.TREAT_HAY_NHAP_NGAY_BAT_DAU));
        if (form.followUpDate < form.startDate) return setError(msg(MSG.MEDICAL_FOLLOWUP_DATE_INVALID));
        if (!form.objective.trim() || !form.instructions.trim() || !form.frequency.trim()) return setError(msg(MSG.TREAT_HAY_NHAP_MUC_TIEU_DIEU));
        try {
            setSaving(true);
            const created = await createMedicalTreatment(selectedHorseId, {
                medicalRecordId: form.medicalRecordId,
                injuryId: form.injuryId || null,
                startDate: form.startDate,
                followUpDate: form.followUpDate,
                objective: form.objective.trim(),
                instructions: form.instructions.trim(),
                medication: form.medication.trim(),
                frequency: treatmentFrequency(form.frequency),
            });
            setTreatments((current) => [created, ...current]);
            setShowModal(false); setSuccess(msg(MSG.TREAT_DA_TAO_PHAC_DO_DIEU));
        } catch (err) { setError(err?.message || err?.response?.data?.message || msg(MSG.TREAT_KHONG_TAO_DUOC_PHAC_DO)); }
        finally { setSaving(false); }
    };

    return <MedicalLayout>
        <div className="medical-page-heading-row">
            <div><div className="medical-page-intro">{msg(MSG.TREAT_THEO_DOI_DIEU_TRI)}</div><h2 className="medical-page-title">{msg(MSG.TREAT_PHAC_DO_DIEU_TRI)}</h2><p className="medical-page-subtitle">{msg(MSG.TREAT_TAO_VA_THEO_DOI_PHAC)}</p></div>
            <button className="medical-primary-button" onClick={openCreate} disabled={!selectedHorseId || !records.length || loadingData || !!error}><Plus size={15}/>{msg(MSG.TREAT_TAO_PHAC_DO)}</button>
        </div>
        {error && <div className="medical-alert medical-alert-error">{error}</div>}
        {success && <div className="medical-alert medical-alert-success">{success}</div>}
        <section className="medical-table-card medical-treatment-toolbar">
            <div className="medical-toolbar-grid">
                <label className="medical-field"><span>{msg(MSG.TREAT_NGUA)}</span><select value={selectedHorseId} onChange={(e) => setSelectedHorseId(e.target.value)} disabled={loading || saving}><option value="">{msg(MSG.TREAT_CHON_NGUA)}</option>{horses.map((h) => <option key={horseIdOf(h)} value={horseIdOf(h)}>{horseNameOf(h)}</option>)}</select></label>
                <label className="medical-field"><span>{msg(MSG.TREAT_TIM_KIEM)}</span><div className="medical-search medical-search-wide"><Search size={14}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={msg(MSG.TREAT_MUC_TIEU_THUOC_TAN_SUAT)}/></div></label>
                <label className="medical-field"><span>{msg(MSG.TREAT_TRANG_THAI)}</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">{msg(MSG.MEDICAL_TAT_CA)}</option><option value="Active">{msg(MSG.TREAT_DANG_HIEU_LUC)}</option><option value="Completed">{msg(MSG.TREAT_DA_HOAN_THANH)}</option></select></label>
            </div>
        </section>
        {selectedHorseId && !loadingData && !loading && !error && !records.length && <div className="medical-alert">{msg(MSG.MEDICAL_RECORD_EMPTY)}{' '}<Link className="action-link" to={`/medical/examination?horseId=${encodeURIComponent(selectedHorseId)}`}>{msg(MSG.MEDICAL_RECORD_OPEN_EXAMINATION)}</Link></div>}
        <section className="medical-table-card">
            <div className="medical-section-title-row"><div><div className="medical-section-eyebrow">{msg(MSG.TREAT_PHAC_DO_DIEU_TRI_2)}</div><h3 className="medical-subheading">{selectedHorse ? horseNameOf(selectedHorse) : msg(MSG.TREAT_CHON_NGUA_2)}</h3></div><span className="medical-record-count">{loadingData ? msg(MSG.MEDICAL_DANG_TAI) : msg(MSG.TREAT_COUNT, { count: filteredTreatments.length })}</span></div>
            {loading || loadingData ? <ResourceState resource={{loading:true}}/> : !filteredTreatments.length ? <div className="medical-empty-state"><ClipboardList size={22}/><strong>{msg(MSG.TREAT_CHUA_CO_PHAC_DO_DIEU)}</strong><span>{msg(MSG.TREAT_CHON_HO_SO_KHAM_DE)}</span></div> : <div className="medical-table-wrapper" role="region" aria-label={msg(MSG.TREAT_PHAC_DO_DIEU_TRI)} tabIndex={0}><table className="medical-table medical-treatment-table"><thead><tr><th scope="col">{msg(MSG.NGAY_BAT_DAU)}</th><th scope="col">{msg(MSG.TREAT_MUC_TIEU)}</th><th scope="col">{msg(MSG.TREAT_TAI_KHAM)}</th><th scope="col">{msg(MSG.TREAT_TRANG_THAI_2)}</th><th scope="col">{msg(MSG.TREAT_CARE_PROGRESS)}</th><th scope="col">{msg(MSG.TREAT_ACTIONS)}</th></tr></thead><tbody>{filteredTreatments.map((item) => <tr key={item.id}><td>{formatDate(item.startDate)}</td><td><strong>{item.objective || "—"}</strong><details><summary>{msg(MSG.CHI_TIET)}</summary><dl><dt>{msg(MSG.TREAT_HUONG_DAN)}</dt><dd>{item.instructions || "—"}</dd><dt>{msg(MSG.TREAT_THUOC)}</dt><dd>{item.medication || "—"}</dd><dt>{msg(MSG.TREAT_TAN_SUAT)}</dt><dd>{treatmentFrequency(item.frequency) || "—"}</dd></dl></details></td><td>{formatDate(item.followUpDate)}</td><td><span className={`medical-treatment-status ${statusOf(item).toLowerCase()}`}>{getMedicalLabel(statusOf(item))}</span></td><td>{careUnavailable ? <span className="form-text">{msg(MSG.UX_CARE_PROGRESS_UNAVAILABLE)}</span> : (() => { const p = progress(item); return <>{msg(MSG.TREAT_CARE_DONE, p)}{!item.completed && p.total > 0 && p.done === p.total && <div className="form-text">{msg(MSG.TREAT_READY)}</div>}</>; })()}</td><td><button type="button" className={item.completed ? "medical-secondary-button" : "medical-primary-button"} disabled={updatingId === item.id} onClick={() => setPlanStatus(item, !item.completed)}>{msg(item.completed ? MSG.TREAT_REOPEN : MSG.TREAT_MARK_DONE)}</button></td></tr>)}</tbody></table></div>}
        </section>
        {showModal && <div className="medical-modal-backdrop" onMouseDown={() => !saving && confirmMedicalClose(dialogRef,()=>setShowModal(false))}><div className="medical-modal medical-wide-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-label={msg(MSG.MEDICAL_WORKSPACE_TREATMENTS)} onMouseDown={(e) => e.stopPropagation()}><div className="medical-modal-header"><div><h3>{msg(MSG.TREAT_TAO_PHAC_DO_DIEU_TRI)}</h3><p className="medical-modal-patient"><span>{msg(MSG.MEDICAL_WORKSPACE_PATIENT_LABEL)}</span><strong>{selectedHorse ? horseNameOf(selectedHorse) : ""}</strong><span>{systemRegistrationCode(selectedHorse) || msg(MSG.MEDICAL_WORKSPACE_NO_CODE)}</span></p><p>{msg(MSG.TREAT_BAC_SI_THU_Y_LAP)}</p></div><button className="medical-icon-button" aria-label={msg(MSG.MEDICAL_WORKSPACE_CLOSE)} onClick={() => !saving && confirmMedicalClose(dialogRef,()=>setShowModal(false))}>{msg(MSG.TREAT_TEXT_2)}</button></div><form className="medical-form" onSubmit={submit}>{error && <p className="alert alert-danger" role="alert">{error}</p>}<div className="medical-form-grid"><MedicalRecordPicker records={records} horseId={selectedHorseId} value={form.medicalRecordId} disabled={saving} onChange={(e) => setForm({...form, medicalRecordId:e.target.value, injuryId:""})} /><label className="medical-field"><span>{msg(MSG.TREAT_CHAN_THUONG_LIEN_QUAN)}</span><select name="injuryId" value={form.injuryId} onChange={(e) => setForm({...form, injuryId:e.target.value})}><option value="">{msg(MSG.TREAT_KHONG_CO)}</option>{injuries.filter((i) => !form.medicalRecordId || String(i.medicalRecordId) === String(form.medicalRecordId)).map((i) => <option key={i.id} value={i.id}>{formatDate(i.injuryDate)}{msg(MSG.TREAT_TEXT_3)}{getMedicalLabel(i.type)}{msg(MSG.TREAT_TEXT_4)}{i.bodyLocation}</option>)}</select></label><label className="medical-field"><span>{msg(MSG.TREAT_NGAY_BAT_DAU)}</span><input type="date" value={form.startDate} onChange={(e)=>setForm({...form,startDate:e.target.value})}/></label><label className="medical-field"><span>{msg(MSG.TREAT_NGAY_TAI_KHAM)}</span><input type="date" value={form.followUpDate} onChange={(e)=>setForm({...form,followUpDate:e.target.value})}/></label><label className="medical-field"><span>{msg(MSG.TREAT_TAN_SUAT_2)}</span><input value={form.frequency} onChange={(e)=>setForm({...form,frequency:e.target.value})} onBlur={()=>setForm({...form,frequency:treatmentFrequency(form.frequency)})} placeholder={msg(MSG.TREAT_VI_DU_2_LAN_NGAY)}/><small className="form-text">{msg(MSG.TREAT_FREQUENCY_HELP)}</small></label><label className="medical-field medical-field-full"><span>{msg(MSG.TREAT_MUC_TIEU_DIEU_TRI)}</span><textarea rows="2" value={form.objective} onChange={(e)=>setForm({...form,objective:e.target.value})}/></label><label className="medical-field medical-field-full"><span>{msg(MSG.TREAT_HUONG_DAN_2)}</span><textarea rows="3" value={form.instructions} onChange={(e)=>setForm({...form,instructions:e.target.value})}/></label><label className="medical-field medical-field-full"><span>{msg(MSG.TREAT_THUOC_2)}</span><textarea rows="2" value={form.medication} onChange={(e)=>setForm({...form,medication:e.target.value})} placeholder={msg(MSG.TREAT_THUOC_LIEU_DUNG_VA_HUONG)}/></label></div><div className="medical-modal-actions"><button type="button" className="medical-secondary-button" onClick={()=>!saving&&confirmMedicalClose(dialogRef,()=>setShowModal(false))}>{msg(MSG.TREAT_HUY)}</button><button type="submit" className="medical-primary-button" disabled={saving}>{saving ? msg(MSG.MEDICAL_DANG_LUU) : msg(MSG.TREAT_TAO_PHAC_DO_DIEU_TRI_2)}</button></div></form></div></div>}
    </MedicalLayout>;
}
export default MedicalTreatment;
