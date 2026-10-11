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
                if (active) setError(err?.message || err?.response?.data?.message || "Unable to load horses.");
            } finally { if (active) setLoading(false); }
        })();
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!selectedHorseId) { let active=true; queueMicrotask(()=>{if(active){ setRecords([]); setInjuries([]); setTreatments([]); }}); return ()=>{active=false;}; }
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
                if (active) setError(err?.message || err?.response?.data?.message || "Unable to load treatment plans.");
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
        } catch (err) { setError(err?.message || err?.response?.data?.message || "Unable to create the treatment plan."); }
        finally { setSaving(false); }
    };

    return <MedicalLayout>
        <div className="medical-page-heading-row">
            <div><div className="medical-page-intro">{msg(MSG.MERGED_UI_490)}</div><h2 className="medical-page-title">{msg(MSG.MERGED_UI_491)}</h2><p className="medical-page-subtitle">{msg(MSG.MERGED_UI_492)}</p></div>
            <button className="medical-primary-button" onClick={openCreate} disabled={!selectedHorseId || !records.length}><Plus size={15}/>{msg(MSG.MERGED_UI_493)}</button>
        </div>
        {error && <div className="medical-alert medical-alert-error">{error}</div>}
        {success && <div className="medical-alert medical-alert-success">{success}</div>}
        <section className="medical-table-card medical-treatment-toolbar">
            <div className="medical-toolbar-grid">
                <label className="medical-field"><span>{msg(MSG.MERGED_UI_494)}</span><select value={selectedHorseId} onChange={(e) => setSelectedHorseId(e.target.value)} disabled={loading || saving}><option value="">{msg(MSG.MERGED_UI_495)}</option>{horses.map((h) => <option key={horseIdOf(h)} value={horseIdOf(h)}>{horseNameOf(h)}</option>)}</select></label>
                <label className="medical-field"><span>{msg(MSG.MERGED_UI_496)}</span><div className="medical-search medical-search-wide"><Search size={14}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={msg(MSG.MERGED_UI_497)}/></div></label>
                <label className="medical-field"><span>{msg(MSG.MERGED_UI_498)}</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>{msg(MSG.MERGED_UI_499)}</option><option>{msg(MSG.MERGED_UI_500)}</option><option>{msg(MSG.MERGED_UI_501)}</option></select></label>
            </div>
        </section>
        <section className="medical-table-card">
            <div className="medical-section-title-row"><div><div className="medical-section-eyebrow">{msg(MSG.MERGED_UI_502)}</div><h3 className="medical-subheading">{selectedHorse ? horseNameOf(selectedHorse) : "Select a horse"}</h3></div><span className="medical-record-count">{loadingData ? "Loading..." : `${filteredTreatments.length} plan(s)`}</span></div>
            {!filteredTreatments.length ? <div className="medical-empty-state"><ClipboardList size={22}/><strong>{msg(MSG.MERGED_UI_503)}</strong><span>{msg(MSG.MERGED_UI_504)}</span></div> : <div className="medical-table-wrapper"><table className="medical-table"><thead><tr><th>{msg(MSG.MERGED_UI_505)}</th><th>{msg(MSG.MERGED_UI_506)}</th><th>{msg(MSG.MERGED_UI_507)}</th><th>{msg(MSG.MERGED_UI_508)}</th><th>{msg(MSG.MERGED_UI_509)}</th><th>{msg(MSG.MERGED_UI_510)}</th><th>{msg(MSG.MERGED_UI_511)}</th></tr></thead><tbody>{filteredTreatments.map((item) => <tr key={item.id}><td>{formatDate(item.startDate)}{msg(MSG.MERGED_UI_512)}{formatDate(item.endDate)}</td><td>{item.objective || "—"}</td><td>{item.instructions || "—"}</td><td>{item.medication || "—"}</td><td>{item.frequency || "—"}</td><td>{formatDate(item.followUpDate)}</td><td><span className={`medical-treatment-status ${statusOf(item).toLowerCase()}`}>{statusOf(item)}</span></td></tr>)}</tbody></table></div>}
        </section>
        {showModal && <div className="medical-modal-backdrop" onMouseDown={() => !saving && setShowModal(false)}><div className="medical-modal medical-wide-modal" onMouseDown={(e) => e.stopPropagation()}><div className="medical-modal-header"><div><span>{msg(MSG.MERGED_UI_513)}</span><h3>{msg(MSG.MERGED_UI_514)}</h3><p>{msg(MSG.MERGED_UI_515)}</p></div><button className="medical-icon-button" onClick={() => !saving && setShowModal(false)}>{msg(MSG.MERGED_UI_516)}</button></div><form className="medical-form" onSubmit={submit}><div className="medical-form-grid"><label className="medical-field"><span>{msg(MSG.MERGED_UI_517)}</span><select name="medicalRecordId" value={form.medicalRecordId} onChange={(e) => setForm({...form, medicalRecordId:e.target.value})}><option value="">{msg(MSG.MERGED_UI_518)}</option>{records.map((r) => <option key={r.id} value={r.id}>{formatDate(r.examinationAt)}{msg(MSG.MERGED_UI_519)}{r.diagnosis || r.reason || "Medical record"}</option>)}</select></label><label className="medical-field"><span>{msg(MSG.MERGED_UI_520)}</span><select name="injuryId" value={form.injuryId} onChange={(e) => setForm({...form, injuryId:e.target.value})}><option value="">{msg(MSG.MERGED_UI_521)}</option>{injuries.filter((i) => !form.medicalRecordId || String(i.medicalRecordId) === String(form.medicalRecordId)).map((i) => <option key={i.id} value={i.id}>{formatDate(i.injuryDate)}{msg(MSG.MERGED_UI_522)}{i.type}{msg(MSG.MERGED_UI_523)}{i.bodyLocation}</option>)}</select></label><label className="medical-field"><span>{msg(MSG.MERGED_UI_524)}</span><input type="date" value={form.startDate} onChange={(e)=>setForm({...form,startDate:e.target.value})}/></label><label className="medical-field"><span>{msg(MSG.MERGED_UI_525)}</span><input type="date" value={form.endDate} onChange={(e)=>setForm({...form,endDate:e.target.value})}/></label><label className="medical-field"><span>{msg(MSG.MERGED_UI_526)}</span><input type="date" value={form.followUpDate} onChange={(e)=>setForm({...form,followUpDate:e.target.value})}/></label><label className="medical-field"><span>{msg(MSG.MERGED_UI_527)}</span><input value={form.frequency} onChange={(e)=>setForm({...form,frequency:e.target.value})} placeholder={msg(MSG.MERGED_UI_528)}/></label><label className="medical-field medical-field-full"><span>{msg(MSG.MERGED_UI_529)}</span><textarea rows="2" value={form.objective} onChange={(e)=>setForm({...form,objective:e.target.value})}/></label><label className="medical-field medical-field-full"><span>{msg(MSG.MERGED_UI_530)}</span><textarea rows="3" value={form.instructions} onChange={(e)=>setForm({...form,instructions:e.target.value})}/></label><label className="medical-field medical-field-full"><span>{msg(MSG.MERGED_UI_531)}</span><textarea rows="2" value={form.medication} onChange={(e)=>setForm({...form,medication:e.target.value})} placeholder={msg(MSG.MERGED_UI_532)}/></label></div><div className="medical-modal-actions"><button type="button" className="medical-secondary-button" onClick={()=>!saving&&setShowModal(false)}>{msg(MSG.MERGED_UI_533)}</button><button type="submit" className="medical-primary-button" disabled={saving}>{saving ? "Saving..." : "Create Treatment Plan"}</button></div></form></div></div>}
    </MedicalLayout>;
}
export default MedicalTreatment;