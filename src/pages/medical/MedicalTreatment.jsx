import { useMedicalDialog } from '../../services/useMedicalDialog.js';
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
function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });
}
function statusOf(item) { return item?.completed ? "Completed" : "Active"; }

const emptyForm = {
    medicalRecordId: "",
    injuryId: "",
    startDate: "",
    endDate: "",
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
                    allPages('/api/care/tasks', { horseId: selectedHorseId }).catch(() => []),
                ]);
                if (!active) return;
                setRecords(unwrapList(r)); setInjuries(unwrapList(i)); setTreatments(unwrapList(t)); setCareTasks(c);
            } catch (err) {
                if (active) setError(err?.message || err?.response?.data?.message || msg(MSG.TREAT_KHONG_TAI_DUOC_PHAC_DO));
            } finally { if (active) setLoadingData(false); }
        })();
        return () => { active = false; };
    }, [selectedHorseId]);

    const openCreate = () => {
        const today = new Date().toISOString().slice(0, 10);
        setError(""); setSuccess("");
        setForm({ ...emptyForm, medicalRecordId: "", injuryId: "", startDate: today, endDate: today, followUpDate: today });
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
        if (!form.startDate || !form.endDate || !form.followUpDate) return setError(msg(MSG.TREAT_HAY_NHAP_NGAY_BAT_DAU));
        if (form.endDate < form.startDate) return setError(msg(MSG.MEDICAL_END_DATE_INVALID));
        if (form.followUpDate < form.startDate) return setError(msg(MSG.MEDICAL_FOLLOWUP_DATE_INVALID));
        if (!form.objective.trim() || !form.instructions.trim() || !form.frequency.trim()) return setError(msg(MSG.TREAT_HAY_NHAP_MUC_TIEU_DIEU));
        try {
            setSaving(true);
            const created = await createMedicalTreatment(selectedHorseId, {
                medicalRecordId: form.medicalRecordId,
                injuryId: form.injuryId || null,
                startDate: form.startDate,
                endDate: form.endDate,
                followUpDate: form.followUpDate,
                objective: form.objective.trim(),
                instructions: form.instructions.trim(),
                medication: form.medication.trim(),
                frequency: form.frequency.trim(),
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
                <label className="medical-field"><span>{msg(MSG.TREAT_TRANG_THAI)}</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>{msg(MSG.MEDICAL_TAT_CA)}</option><option>{msg(MSG.TREAT_DANG_HIEU_LUC)}</option><option>{msg(MSG.TREAT_DA_HOAN_THANH)}</option></select></label>
            </div>
        </section>
        {selectedHorseId && !loadingData && !loading && !error && !records.length && <div className="medical-alert">{msg(MSG.MEDICAL_RECORD_EMPTY)}{' '}<Link to={`/medical/examination?horseId=${encodeURIComponent(selectedHorseId)}`}>{msg(MSG.MEDICAL_RECORD_OPEN_EXAMINATION)}</Link></div>}
        <section className="medical-table-card">
            <div className="medical-section-title-row"><div><div className="medical-section-eyebrow">{msg(MSG.TREAT_PHAC_DO_DIEU_TRI_2)}</div><h3 className="medical-subheading">{selectedHorse ? horseNameOf(selectedHorse) : msg(MSG.TREAT_CHON_NGUA_2)}</h3></div><span className="medical-record-count">{loadingData ? msg(MSG.MEDICAL_DANG_TAI) : msg(MSG.TREAT_COUNT, { count: filteredTreatments.length })}</span></div>
            {!filteredTreatments.length ? <div className="medical-empty-state"><ClipboardList size={22}/><strong>{msg(MSG.TREAT_CHUA_CO_PHAC_DO_DIEU)}</strong><span>{msg(MSG.TREAT_CHON_HO_SO_KHAM_DE)}</span></div> : <div className="medical-table-wrapper"><table className="medical-table"><thead><tr><th>{msg(MSG.TREAT_THOI_GIAN)}</th><th>{msg(MSG.TREAT_MUC_TIEU)}</th><th>{msg(MSG.TREAT_HUONG_DAN)}</th><th>{msg(MSG.TREAT_THUOC)}</th><th>{msg(MSG.TREAT_TAN_SUAT)}</th><th>{msg(MSG.TREAT_TAI_KHAM)}</th><th>{msg(MSG.TREAT_TRANG_THAI_2)}</th><th>{msg(MSG.TREAT_CARE_PROGRESS)}</th><th>{msg(MSG.TREAT_ACTIONS)}</th></tr></thead><tbody>{filteredTreatments.map((item) => <tr key={item.id}><td>{formatDate(item.startDate)}{msg(MSG.TREAT_TEXT)}{formatDate(item.endDate)}</td><td>{item.objective || "—"}</td><td>{item.instructions || "—"}</td><td>{item.medication || "—"}</td><td>{item.frequency || "—"}</td><td>{formatDate(item.followUpDate)}</td><td><span className={`medical-treatment-status ${statusOf(item).toLowerCase()}`}>{getMedicalLabel(statusOf(item))}</span></td><td>{(() => { const p = progress(item); return <>{msg(MSG.TREAT_CARE_DONE, p)}{!item.completed && p.total > 0 && p.done === p.total && <div className="form-text">{msg(MSG.TREAT_READY)}</div>}</>; })()}</td><td><button type="button" className={item.completed ? "medical-secondary-button" : "medical-primary-button"} disabled={updatingId === item.id} onClick={() => setPlanStatus(item, !item.completed)}>{msg(item.completed ? MSG.TREAT_REOPEN : MSG.TREAT_MARK_DONE)}</button></td></tr>)}</tbody></table></div>}
        </section>
        {showModal && <div className="medical-modal-backdrop" onMouseDown={() => !saving && setShowModal(false)}><div className="medical-modal medical-wide-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-label={msg(MSG.MEDICAL_WORKSPACE_TREATMENTS)} onMouseDown={(e) => e.stopPropagation()}><div className="medical-modal-header"><div><span>{msg(MSG.TREAT_F03_D)}</span><h3>{msg(MSG.TREAT_TAO_PHAC_DO_DIEU_TRI)}</h3><p className="medical-modal-patient"><span>{msg(MSG.MEDICAL_WORKSPACE_PATIENT_LABEL)}</span><strong>{selectedHorse ? horseNameOf(selectedHorse) : ""}</strong><span>{selectedHorse?.registrationNumber || msg(MSG.MEDICAL_WORKSPACE_NO_CODE)}</span></p><p>{msg(MSG.TREAT_BAC_SI_THU_Y_LAP)}</p></div><button className="medical-icon-button" aria-label={msg(MSG.MEDICAL_WORKSPACE_CLOSE)} onClick={() => !saving && setShowModal(false)}>{msg(MSG.TREAT_TEXT_2)}</button></div><form className="medical-form" onSubmit={submit}><div className="medical-form-grid"><MedicalRecordPicker records={records} horseId={selectedHorseId} value={form.medicalRecordId} disabled={saving} onChange={(e) => setForm({...form, medicalRecordId:e.target.value, injuryId:""})} /><label className="medical-field"><span>{msg(MSG.TREAT_CHAN_THUONG_LIEN_QUAN)}</span><select name="injuryId" value={form.injuryId} onChange={(e) => setForm({...form, injuryId:e.target.value})}><option value="">{msg(MSG.TREAT_KHONG_CO)}</option>{injuries.filter((i) => !form.medicalRecordId || String(i.medicalRecordId) === String(form.medicalRecordId)).map((i) => <option key={i.id} value={i.id}>{formatDate(i.injuryDate)}{msg(MSG.TREAT_TEXT_3)}{getMedicalLabel(i.type)}{msg(MSG.TREAT_TEXT_4)}{i.bodyLocation}</option>)}</select></label><label className="medical-field"><span>{msg(MSG.TREAT_NGAY_BAT_DAU)}</span><input type="date" value={form.startDate} onChange={(e)=>setForm({...form,startDate:e.target.value})}/></label><label className="medical-field"><span>{msg(MSG.TREAT_NGAY_KET_THUC)}</span><input type="date" value={form.endDate} onChange={(e)=>setForm({...form,endDate:e.target.value})}/></label><label className="medical-field"><span>{msg(MSG.TREAT_NGAY_TAI_KHAM)}</span><input type="date" value={form.followUpDate} onChange={(e)=>setForm({...form,followUpDate:e.target.value})}/></label><label className="medical-field"><span>{msg(MSG.TREAT_TAN_SUAT_2)}</span><input value={form.frequency} onChange={(e)=>setForm({...form,frequency:e.target.value})} placeholder={msg(MSG.TREAT_VI_DU_2_LAN_NGAY)}/></label><label className="medical-field medical-field-full"><span>{msg(MSG.TREAT_MUC_TIEU_DIEU_TRI)}</span><textarea rows="2" value={form.objective} onChange={(e)=>setForm({...form,objective:e.target.value})}/></label><label className="medical-field medical-field-full"><span>{msg(MSG.TREAT_HUONG_DAN_2)}</span><textarea rows="3" value={form.instructions} onChange={(e)=>setForm({...form,instructions:e.target.value})}/></label><label className="medical-field medical-field-full"><span>{msg(MSG.TREAT_THUOC_2)}</span><textarea rows="2" value={form.medication} onChange={(e)=>setForm({...form,medication:e.target.value})} placeholder={msg(MSG.TREAT_THUOC_LIEU_DUNG_VA_HUONG)}/></label></div><div className="medical-modal-actions"><button type="button" className="medical-secondary-button" onClick={()=>!saving&&setShowModal(false)}>{msg(MSG.TREAT_HUY)}</button><button type="submit" className="medical-primary-button" disabled={saving}>{saving ? msg(MSG.MEDICAL_DANG_LUU) : msg(MSG.TREAT_TAO_PHAC_DO_DIEU_TRI_2)}</button></div></form></div></div>}
    </MedicalLayout>;
}
export default MedicalTreatment;
