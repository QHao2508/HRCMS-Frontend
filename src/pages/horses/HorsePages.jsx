import { ROLES } from "../../constants/roles.js";
import { isAssigned,clubToday } from "../../services/workflowHelpers.js";
import { useMutation } from "../../context/useMutation.js";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { listHorses,getHorse,assignStaff,staffDirectory,fetchHorsePhoto } from "../../services/clubService.js";
import { PageHeading,ResourceState,Pagination,BackLink,StateBadge,Field,MutationState} from "../../components/WorkflowUI.jsx";
export function HorseList() {
    const [filter,setFilter] = useState({page:1,pageSize:20,search:""});
    const load = useCallback(() => listHorses(filter),[filter]);
    const resource = useRegistrationResource(load);
    return <section><PageHeading title="Ngựa của tôi" description="Hồ sơ ngựa trong phạm vi sở hữu hoặc phân công của bạn." /><div className="surface-card"><label className="form-label" htmlFor="horse-search">Tìm theo tên hoặc mã đăng ký</label><input id="horse-search" className="form-control mb-3" value={filter.search} onChange={e => setFilter({...filter,search:e.target.value,page:1})} /><ResourceState resource={resource} />{resource.data && <><div className="table-responsive"><table className="table"><thead><tr><th>Tên ngựa</th><th>Mã đăng ký</th><th>Giống</th><th>Sức khỏe</th><th /></tr></thead><tbody>{resource.data.items.map(horse => <tr key={horse.id}><td>{horse.name}</td><td>{horse.registrationNumber || "—"}</td><td>{horse.breed}</td><td><StateBadge value={horse.healthStatus} /></td><td><Link className="btn btn-outline-primary" to={`/horses/${horse.id}`}>Xem hồ sơ</Link></td></tr>)}</tbody></table>{!resource.data.items.length && <p className="empty-state">Chưa có ngựa trong phạm vi của bạn.</p>}</div><Pagination data={resource.data} onChange={page => setFilter({...filter,page})} /></>}</div></section>;
}
function HorsePhoto({ id }) {
    const [url,setUrl] = useState(null);
    useEffect(() => { let active = true, objectUrl; fetchHorsePhoto(id).then(blob => { if (active) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); } }).catch(() => {}); return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); }; },[id]);
    return url ? <img className="horse-photo mb-3" src={url} alt="Ảnh nhận diện ngựa" /> : null;
}
function AssignmentForm({ horse,user,reload }) {
    const roles = user.role === ROLES.ClubManager ? [ROLES.HeadTrainer,ROLES.Groom,ROLES.Veterinarian] : [ROLES.Trainer];
    const [form,setForm] = useState({role:roles[0],staffId:"",startDate:clubToday(),notes:""});
    const load = useCallback(() => staffDirectory(form.role),[form.role]);
    const staff = useRegistrationResource(load);
    const mutation = useMutation();
    function change(e) { setForm({...form,[e.target.name]:e.target.value,...(e.target.name === "role" && {staffId:""})}); }
    async function submit(e) { e.preventDefault(); if (!form.staffId) return; await mutation.run(() => assignStaff(horse.horse.id,form),reload,"Đã phân công nhân sự. Lịch sử phân công được giữ lại."); }
    return <section className="surface-card"><h2>{user.role === ROLES.ClubManager ? "Phân công nhân sự chính thức" : "Chọn Trainer phụ trách"}</h2><p className="card-description">{user.role === ROLES.ClubManager ? "Manager xác nhận HeadTrainer, Groom và bác sĩ thú y. HeadTrainer được giao ngựa sẽ chọn Trainer." : "Chỉ HeadTrainer đang phụ trách ngựa được chọn Trainer."}</p><MutationState mutation={mutation} reload={reload} /><ResourceState resource={staff} /><form onSubmit={submit}><fieldset disabled={mutation.pending || mutation.uncertain || staff.loading || !!staff.error}><div className="row g-3"><Field label="Vai trò" name="role" value={form.role} onChange={change} options={roles} /><Field label="Nhân sự" name="staffId" value={form.staffId} onChange={change} required options={[{value:"",label:"Chọn nhân sự"},...(staff.data || []).map(person => ({value:person.id,label:[person.firstName,person.lastName].filter(Boolean).join(" ")}))]} /><Field label="Ngày bắt đầu" name="startDate" value={form.startDate} onChange={change} type="date" required /><Field label="Ghi chú" name="notes" value={form.notes} onChange={change} maxLength={2000} /></div><button className="btn btn-primary mt-3">Xác nhận phân công</button></fieldset></form></section>;
}
export function HorseDetail() {
    const {id} = useParams();
    const {user} = useAuth();
    const load = useCallback(async () => { const horse=await getHorse(id); const groups=await Promise.all([...new Set(horse.assignments.map(a=>a.role))].map(role=>staffDirectory(role))); return {...horse,staffNames:Object.fromEntries(groups.flat().map(person=>[person.id,[person.firstName,person.lastName].filter(Boolean).join(" ")]))}; },[id]);
    const resource = useRegistrationResource(load);
    const data = resource.data;
    return <section><BackLink to="/horses">Ngựa của tôi</BackLink><ResourceState resource={resource} />{data && <><PageHeading title={data.horse.name} action={<StateBadge value={data.horse.healthStatus} />} /><nav className="section-tabs" aria-label="Hồ sơ ngựa"><a href="#horse-overview">Tổng quan</a><a href="#horse-assignments">Nhân sự</a>{[ROLES.HorseOwner,ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer,ROLES.WorkRider,ROLES.Veterinarian].includes(user.role) && <Link to={`/training/plans?horseId=${id}`}>Huấn luyện</Link>}</nav><section id="horse-overview" className="surface-card"><h2>Thông tin ngựa</h2><HorsePhoto id={id} /><dl className="summary-grid">{[["Mã đăng ký",data.horse.registrationNumber],["Giống",data.horse.breed],["Ngày sinh",data.horse.dateOfBirth],["Giới tính",data.horse.gender],["Sire / Bố",data.horse.sire],["Dam / Mẹ",data.horse.dam],["Chiều cao gần nhất",data.latestMeasurement ? `${data.latestMeasurement.heightCm} cm` : "—"],["Cân nặng gần nhất",data.latestMeasurement ? `${data.latestMeasurement.weightKg} kg` : "—"]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl></section>
        {(user.role === ROLES.ClubManager || isAssigned(data,user,ROLES.HeadTrainer)) && <AssignmentForm key={`${id}-${user.id}`} horse={data} user={user} reload={resource.reload} />}
        <section id="horse-assignments" className="surface-card"><h2>Lịch sử phân công</h2><div className="table-responsive"><table className="table"><thead><tr><th>Vai trò</th><th>Nhân sự</th><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>{data.assignments.map(a => <tr key={a.id}><td>{a.role}</td><td>{a.staffId === user.id ? "Bạn" : data.staffNames?.[a.staffId] || "Nhân sự đã kết thúc phân công"}</td><td>{a.startDate}</td><td>{a.endDate || "—"}</td><td>{a.active ? "Đang phụ trách" : "Đã kết thúc"}</td><td>{a.notes}</td></tr>)}</tbody></table>{!data.assignments.length && <p className="empty-state">Chưa có phân công chính thức.</p>}</div></section></>}</section>;
}
