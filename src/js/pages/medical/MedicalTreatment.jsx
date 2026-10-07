import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, Search } from "lucide-react";
import MedicalLayout from "../../components/medical/MedicalLayout";
import {
    createMedicalTreatment,
    getMedicalHorses,
    getMedicalInjuries,
    getMedicalRecords,
    getMedicalTreatments,
} from "../../services/medicalService";

function unwrapList(data) {
    if (Array.isArray(data)) return data;
    return data?.items ?? data?.data ?? data?.results ?? data?.value ?? [];
}
function horseIdOf(horse) { return horse?.id ?? horse?.horseId; }
function horseNameOf(horse) { return horse?.name ?? horse?.horseName ?? horse?.Name ?? "Unnamed horse"; }
function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
    const [selectedHorseId, setSelectedHorseId] = useState("");
    const [records, setRecords] = useState([]);
    const [injuries, setInjuries] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);

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
                const data = await getMedicalHorses({ page: 1, pageSize: 100 });
                const list = unwrapList(data);
                if (!active) return;
                setHorses(list);
                if (list.length) setSelectedHorseId(String(horseIdOf(list[0])));
            } catch (err) {
                if (active) setError(err?.response?.data?.message || "Unable to load horses.");
            } finally { if (active) setLoading(false); }
        })();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!selectedHorseId) { setRecords([]); setInjuries([]); setTreatments([]); return; }
        let active = true;
        (async () => {
            try {
                setLoadingData(true); setError("");
                const [r, i, t] = await Promise.all([
                    getMedicalRecords(selectedHorseId, { page: 1, pageSize: 100 }),
                    getMedicalInjuries(selectedHorseId, { page: 1, pageSize: 100 }),
                    getMedicalTreatments(selectedHorseId, { page: 1, pageSize: 100 }),
                ]);
                if (!active) return;
                setRecords(unwrapList(r)); setInjuries(unwrapList(i)); setTreatments(unwrapList(t));
            } catch (err) {
                if (active) setError(err?.response?.data?.message || "Unable to load treatment plans.");
            } finally { if (active) setLoadingData(false); }
        })();
        return () => { active = false; };
    }, [selectedHorseId]);

    const openCreate = () => {
        const today = new Date().toISOString().slice(0, 10);
        setError(""); setSuccess("");
        setForm({ ...emptyForm, medicalRecordId: records[0]?.id ?? "", injuryId: "", startDate: today, endDate: today, followUpDate: today });
        setShowModal(true);
    };

    const submit = async (event) => {
        event.preventDefault(); setError(""); setSuccess("");
        if (!form.medicalRecordId) return setError("A Medical Record is required.");
        if (!form.startDate || !form.endDate || !form.followUpDate) return setError("Start Date, End Date and Follow-up Date are required.");
        if (form.endDate < form.startDate) return setError("End Date cannot be earlier than Start Date.");
        if (form.followUpDate < form.startDate) return setError("Follow-up Date cannot be earlier than Start Date.");
        if (!form.objective.trim() || !form.instructions.trim() || !form.frequency.trim()) return setError("Objective, Instructions and Frequency are required.");
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
            setShowModal(false); setSuccess("Treatment plan created successfully.");
        } catch (err) { setError(err?.response?.data?.message || "Unable to create the treatment plan."); }
        finally { setSaving(false); }
    };

    return <MedicalLayout>
        <div className="medical-page-heading-row">
            <div><div className="medical-page-intro">F03-D · Treatment Management</div><h2 className="medical-page-title">Phác Đồ Điều Trị</h2><p className="medical-page-subtitle">Tạo và theo dõi treatment plan gắn với Medical Record hoặc Injury.</p></div>
            <button className="medical-primary-button" onClick={openCreate} disabled={!selectedHorseId || !records.length}><Plus size={15}/> Tạo phác đồ</button>
        </div>
        {error && <div className="medical-alert medical-alert-error">{error}</div>}
        {success && <div className="medical-alert medical-alert-success">{success}</div>}
        <section className="medical-table-card medical-treatment-toolbar">
            <div className="medical-toolbar-grid">
                <label className="medical-field"><span>Horse</span><select value={selectedHorseId} onChange={(e) => setSelectedHorseId(e.target.value)} disabled={loading}><option value="">Select horse...</option>{horses.map((h) => <option key={horseIdOf(h)} value={horseIdOf(h)}>{horseNameOf(h)}</option>)}</select></label>
                <label className="medical-field"><span>Search</span><div className="medical-search medical-search-wide"><Search size={14}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Objective, medication, frequency..."/></div></label>
                <label className="medical-field"><span>Status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option><option>Active</option><option>Completed</option></select></label>
            </div>
        </section>
        <section className="medical-table-card">
            <div className="medical-section-title-row"><div><div className="medical-section-eyebrow">TREATMENT PLANS</div><h3 className="medical-subheading">{selectedHorse ? horseNameOf(selectedHorse) : "Select a horse"}</h3></div><span className="medical-record-count">{loadingData ? "Loading..." : `${filteredTreatments.length} plan(s)`}</span></div>
            {!filteredTreatments.length ? <div className="medical-empty-state"><ClipboardList size={22}/><strong>No treatment plans found</strong><span>Create a plan after selecting a Medical Record.</span></div> : <div className="medical-table-wrapper"><table className="medical-table"><thead><tr><th>Period</th><th>Objective</th><th>Instructions</th><th>Medication</th><th>Frequency</th><th>Follow-up</th><th>Status</th></tr></thead><tbody>{filteredTreatments.map((item) => <tr key={item.id}><td>{formatDate(item.startDate)} → {formatDate(item.endDate)}</td><td>{item.objective || "—"}</td><td>{item.instructions || "—"}</td><td>{item.medication || "—"}</td><td>{item.frequency || "—"}</td><td>{formatDate(item.followUpDate)}</td><td><span className={`medical-treatment-status ${statusOf(item).toLowerCase()}`}>{statusOf(item)}</span></td></tr>)}</tbody></table></div>}
        </section>
        {showModal && <div className="medical-modal-backdrop" onMouseDown={() => !saving && setShowModal(false)}><div className="medical-modal medical-wide-modal" onMouseDown={(e) => e.stopPropagation()}><div className="medical-modal-header"><div><span>F03-D</span><h3>Create Treatment Plan</h3><p>Veterinarian creates the medical treatment plan.</p></div><button className="medical-icon-button" onClick={() => !saving && setShowModal(false)}>×</button></div><form className="medical-form" onSubmit={submit}><div className="medical-form-grid"><label className="medical-field"><span>Medical Record *</span><select name="medicalRecordId" value={form.medicalRecordId} onChange={(e) => setForm({...form, medicalRecordId:e.target.value})}><option value="">Select record...</option>{records.map((r) => <option key={r.id} value={r.id}>{formatDate(r.examinationAt)} · {r.diagnosis || r.reason || "Medical record"}</option>)}</select></label><label className="medical-field"><span>Related Injury</span><select name="injuryId" value={form.injuryId} onChange={(e) => setForm({...form, injuryId:e.target.value})}><option value="">None</option>{injuries.filter((i) => !form.medicalRecordId || String(i.medicalRecordId) === String(form.medicalRecordId)).map((i) => <option key={i.id} value={i.id}>{formatDate(i.injuryDate)} · {i.type} · {i.bodyLocation}</option>)}</select></label><label className="medical-field"><span>Start Date *</span><input type="date" value={form.startDate} onChange={(e)=>setForm({...form,startDate:e.target.value})}/></label><label className="medical-field"><span>End Date *</span><input type="date" value={form.endDate} onChange={(e)=>setForm({...form,endDate:e.target.value})}/></label><label className="medical-field"><span>Follow-up Date *</span><input type="date" value={form.followUpDate} onChange={(e)=>setForm({...form,followUpDate:e.target.value})}/></label><label className="medical-field"><span>Frequency *</span><input value={form.frequency} onChange={(e)=>setForm({...form,frequency:e.target.value})} placeholder="e.g. 2 times/day"/></label><label className="medical-field medical-field-full"><span>Treatment Objective *</span><textarea rows="2" value={form.objective} onChange={(e)=>setForm({...form,objective:e.target.value})}/></label><label className="medical-field medical-field-full"><span>Instructions *</span><textarea rows="3" value={form.instructions} onChange={(e)=>setForm({...form,instructions:e.target.value})}/></label><label className="medical-field medical-field-full"><span>Medication</span><textarea rows="2" value={form.medication} onChange={(e)=>setForm({...form,medication:e.target.value})} placeholder="Medication / dose / administration notes"/></label></div><div className="medical-modal-actions"><button type="button" className="medical-secondary-button" onClick={()=>!saving&&setShowModal(false)}>Cancel</button><button type="submit" className="medical-primary-button" disabled={saving}>{saving ? "Saving..." : "Create Treatment Plan"}</button></div></form></div></div>}
    </MedicalLayout>;
}
export default MedicalTreatment;
