import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg, UI_LOCALE } from "../../messages/index.js";
import { PLAN_STATUS } from "../../constants/training.js";
import { ROLES } from "../../constants/roles.js";
import { historyView } from "../../services/historyView.js";
import { isAssigned,clubToday } from "../../services/workflowHelpers.js";
import { useMutation } from "../../context/useMutation.js";
import { useCallback, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { listHorses,getHorse } from "../../services/clubService.js";
import { listPlans,listTemplates,createPlan,getPlan,editPlan,changePlanStatus,planHistory } from "../../services/trainingService.js";
import { PageHeading,ResourceState,Pagination,BackLink,StateBadge,Field,MutationState} from "../../components/WorkflowUI.jsx";
/**
 * Đọc hết các trang danh sách để dựng lựa chọn ngựa/giáo án; dừng theo tổng/pageSize và trang rỗng.
 * @param load Giá trị load truyền vào collect; tham chiếu phần thân để xem cách dùng.
 */
async function collect(load) { const items = []; for(let page=1;;page++) {const data = await load({page,pageSize:100});items.push(...data.items);if(!data.items.length || data.page*data.pageSize>=data.total) return items;} }
/**
 * Tải và phân trang kế hoạch, tùy chọn lọc theo ngựa và action tạo theo role.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function PlanList() {
    const {user} = useAuth(); const [search] = useSearchParams(); const [page,setPage] = useState(1);
    const horseId = search.get("horseId") || undefined;
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(() => listPlans({page,pageSize:20,...(horseId && {horseId})}),[page,horseId]);
    const resource = useRegistrationResource(load, { realtime: true });
    return <section className="training-page"><PageHeading title={msg(MSG.KE_HOACH_HUAN_LUYEN)} description={msg(MSG.KE_HOACH_CA_NHAN_HOA_VA_TIEN_DO_CAC_BUOI_TAP)} action={user.role === ROLES.Trainer && <Link className="btn btn-primary" to={`/training/plans/new${horseId ? `?horseId=${horseId}` : ""}`}>{msg(MSG.TAO_KE_HOACH)}</Link>} /><section className="surface-card"><ResourceState resource={resource} />{resource.data && <><div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.MUC_TIEU)}</th><th>{msg(MSG.GIAI_DOAN)}</th><th>{msg(MSG.TU_NGAY)}</th><th>{msg(MSG.DEN_NGAY)}</th><th>{msg(MSG.TRANG_THAI)}</th><th /></tr></thead><tbody>{resource.data.items.map(plan => <tr key={plan.id}><td>{plan.goal}</td><td>{plan.phase}</td><td>{plan.startDate}</td><td>{plan.endDate}</td><td><StateBadge value={plan.status} /></td><td><Link className="btn btn-outline-primary" to={`/training/plans/${plan.id}`}>{msg(MSG.XEM_KE_HOACH)}</Link></td></tr>)}</tbody></table>{!resource.data.items.length && <p className="empty-state">{msg(MSG.CHUA_CO_KE_HOACH_TRONG_PHAM_VI_CUA_BAN)}</p>}</div><Pagination data={resource.data} onChange={setPage} /></>}</section></section>;
}
/**
 * Tải lựa chọn ngựa/giáo án, giữ form kế hoạch cá nhân hóa và tạo qua API.
 * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function PlanCreate() {
    const navigate = useNavigate(); const [search] = useSearchParams();
    const [form,setForm] = useState({horseId:search.get("horseId") || "",templateId:"",goal:"",phase:"",startDate:clubToday(),endDate:clubToday(),notes:""});
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(async () => ({horses:await collect(listHorses),templates:await collect(listTemplates)}),[]);
    const resource = useRegistrationResource(load); const mutation = useMutation();
    /**
     * Cập nhật form theo name/value và reset lựa chọn phụ thuộc khi cần, không tự sửa dữ liệu server.
     * @param e Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm.
     */
    function change(e) { const {name,value} = e.target; if(name === "templateId") {const t = resource.data.templates.find(t => t.id === value);setForm({...form,templateId:value,goal:t?.goal || "",phase:t?.phase || ""});}else setForm({...form,[name]:value}); }
    /**
     * Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.
     * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
     * @param e Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm.
     */
    async function submit(e) {e.preventDefault(); await mutation.run(() => createPlan(form),plan => navigate(`/training/plans/${plan.id}`));}
    return <section className="training-page"><BackLink to="/training/plans">{msg(MSG.KE_HOACH_HUAN_LUYEN)}</BackLink><PageHeading title={msg(MSG.TAO_KE_HOACH_CA_NHAN_HOA)} description={msg(MSG.CHON_NGUA_DANG_PHU_TRACH_VA_GIAO_AN_THAM_KHAO)} /><ResourceState resource={resource} /><MutationState mutation={mutation} reload={resource.reload} />{resource.data && <form className="surface-card" onSubmit={submit}><fieldset disabled={mutation.pending || mutation.uncertain}><div className="row g-3"><Field label={msg(MSG.NGUA_DUOC_PHAN_CONG)} name="horseId" value={form.horseId} onChange={change} required options={[{value:"",label:msg(MSG.CHON_NGUA)},...resource.data.horses.map(h => ({value:h.id,label:h.name}))]} /><Field label={msg(MSG.GIAO_AN_THAM_KHAO)} name="templateId" value={form.templateId} onChange={change} required options={[{value:"",label:msg(MSG.CHON_GIAO_AN)},...resource.data.templates.map(t => ({value:t.id,label:t.name}))]} /><PlanFields form={form} onChange={change} /></div><div className="wizard-actions"><Link className="btn btn-outline-primary" to="/training/plans">{msg(MSG.HUY)}</Link><button className="btn btn-success">{msg(MSG.TAO_KE_HOACH)}</button></div></fieldset></form>}</section>;
}
/**
 * Các trường controlled mục tiêu/giai đoạn/ngày/ghi chú dùng chung tạo và sửa kế hoạch.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {form,onChange}. Các props/callback lấy từ caller.
 */
function PlanFields({form,onChange}) {return <><Field label={msg(MSG.MUC_TIEU)} name="goal" value={form.goal} onChange={onChange} required /><Field label={msg(MSG.GIAI_DOAN)} name="phase" value={form.phase} onChange={onChange} required /><Field label={msg(MSG.NGAY_BAT_DAU)} name="startDate" value={form.startDate} onChange={onChange} type="date" required /><Field label={msg(MSG.NGAY_KET_THUC)} name="endDate" value={form.endDate} onChange={onChange} type="date" min={form.startDate} required /><Field label={msg(MSG.GHI_CHU)} name="notes" value={form.notes} onChange={onChange} multiline wide /></>;}
/**
 * Phân trang lịch sử huấn luyện và đọc snapshot theo từng sự kiện.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {id}. Các props/callback lấy từ caller.
 */
function History({id}) {const [page,setPage]=useState(1);
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load=useCallback(()=>planHistory(id,{page,pageSize:20}),[id,page]);const resource=useRegistrationResource(load);return <section className="surface-card"><h2>{msg(MSG.LICH_SU_HUAN_LUYEN)}</h2><ResourceState resource={resource}/>{resource.data && <>{resource.data.items.map(item => <div className="history-item" key={item.id}><div className="muted-caption">{new Date(item.createdAt).toLocaleString(UI_LOCALE,{timeZone:"Asia/Ho_Chi_Minh"})}{' '}{msg(MSG.SYMBOL_5)}{' '}{item.sessionId ? msg(MSG.BUOI_TAP) : msg(MSG.KE_HOACH)}</div><HistorySnapshot snapshot={item.snapshot} /></div>)}{!resource.data.items.length && <p>{msg(MSG.CHUA_CO_LICH_SU)}</p>}<Pagination data={resource.data} onChange={setPage}/></>}</section>;}
/**
 * Render snapshot đã parse cùng badge trạng thái; fallback khi dữ liệu lịch sử không đọc được.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {snapshot}. Các props/callback lấy từ caller.
 */
function HistorySnapshot({snapshot}) {const view=historyView(snapshot);return view ? <details><summary>{view.title}{' '}{msg(MSG.SYMBOL_5)}{' '}<StateBadge value={view.status}/></summary><dl className="summary-grid mt-3">{view.rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></details> : <p>{msg(MSG.THONG_TIN_LICH_SU_CHUA_DOC_DUOC)}</p>;}
/**
 * Render kế hoạch, hạn chế vận động, sửa/trạng thái và tab buổi tập/lịch sử theo phân công.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {data,horse,user,id,reload}. Các props/callback lấy từ caller.
 */
function PlanContent({data,horse,user,id,reload}) {
    const [tab,setTab]=useState("sessions");const [editing,setEditing]=useState(false);const [status,setStatus]=useState("");
    const plan=data.plan; const canWrite=isAssigned(horse,user,ROLES.Trainer) && [PLAN_STATUS.Active,PLAN_STATUS.Paused].includes(plan.status);
    const [form,setForm]=useState({horseId:plan.horseId,templateId:plan.templateId,goal:plan.goal,phase:plan.phase,startDate:plan.startDate,endDate:plan.endDate,notes:plan.notes});
    const mutation=useMutation();
    return <><PageHeading title={plan.goal} description={`${horse.horse.name} · ${plan.phase} · ${plan.startDate} → ${plan.endDate}`} action={<StateBadge value={plan.status}/>} /><MutationState mutation={mutation} reload={reload}/>
        {!!data.restrictions.length && <section className="surface-card restriction-card"><h2>{msg(MSG.HAN_CHE_VAN_DONG)}</h2>{data.restrictions.map(r=><p key={r.id}>{r.reason}{' '}{msg(MSG.SYMBOL_5)}{' '}{r.validFrom?.slice(0,10)}{' '}{msg(MSG.SYMBOL_8)}{' '}{r.validUntil?.slice(0,10) || msg(MSG.CHUA_CO_NGAY_KET_THUC)}</p>)}<p className="muted-caption">{msg(MSG.DIEU_KIEN_VAN_DONG_DUOC_KIEM_TRA_LAI_KHI_TAO_SUA_VA_BAT_DAU_BUOI_TAP)}</p></section>}
        {canWrite && <section className="surface-card"><div className="inline-actions"><button className="btn btn-outline-primary" disabled={mutation.pending} onClick={()=>setEditing(!editing)}>{msg(MSG.CHINH_SUA_KE_HOACH)}</button>{plan.status === PLAN_STATUS.Active && <Link className="btn btn-primary" to={`/training/plans/${id}/sessions/new`}>{msg(MSG.TAO_BUOI_TAP)}</Link>}</div>{editing && <form className="mt-3" onSubmit={e=>{e.preventDefault();mutation.run(()=>editPlan(id,form),()=>{setEditing(false);reload();});}}><fieldset disabled={mutation.pending || mutation.uncertain}><div className="row g-3"><PlanFields form={form} onChange={e=>setForm({...form,[e.target.name]:e.target.value})}/></div><button className="btn btn-success mt-3">{msg(MSG.LUU_KE_HOACH)}</button></fieldset></form>}<form className="filter-row mt-3" onSubmit={e=>{e.preventDefault();if(status)mutation.run(()=>changePlanStatus(id,status),reload);}}><div><label className="form-label" htmlFor="plan-status">{msg(MSG.DOI_TRANG_THAI)}</label><select id="plan-status" className="form-select" value={status} onChange={e=>setStatus(e.target.value)} disabled={mutation.pending || mutation.uncertain}><option value="">{msg(MSG.CHON_TRANG_THAI)}</option>{[PLAN_STATUS.Active,PLAN_STATUS.Paused,PLAN_STATUS.Completed,PLAN_STATUS.Archived].filter(s=>s!==plan.status).map(s=><option key={s} value={s}>{getEnumLabel(s)}</option>)}</select></div><button className="btn btn-outline-primary" disabled={!status || mutation.pending || mutation.uncertain}>{msg(MSG.XAC_NHAN)}</button></form></section>}
        <nav className="section-tabs" aria-label={msg(MSG.KE_HOACH)}><button className={`btn ${tab === "sessions" ? "btn-primary" : "btn-outline-primary"}`} onClick={()=>setTab("sessions")}>{msg(MSG.CAC_BUOI_TAP)}</button>{user.role !== ROLES.WorkRider && <button className={`btn ${tab === "history" ? "btn-primary" : "btn-outline-primary"}`} onClick={()=>setTab("history")}>{msg(MSG.LICH_SU)}</button>}</nav>
        {tab === "sessions" ? <SessionTable data={data}/> : <History id={id}/>}
    </>;
}
/**
 * Hiển thị buổi tập của kế hoạch với giờ Việt Nam, nhãn enum và đường dẫn chi tiết.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {data}. Các props/callback lấy từ caller.
 */
function SessionTable({data}) {return <div className="surface-card"><div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.THOI_GIAN_VIET_NAM)}</th><th>{msg(MSG.LOAI_TAP)}</th><th>{msg(MSG.QUANG_DUONG)}</th><th>{msg(MSG.CUONG_DO)}</th><th>{msg(MSG.TRANG_THAI)}</th><th/></tr></thead><tbody>{data.sessions.map(s=><tr key={s.id}><td>{new Date(s.scheduledAt).toLocaleString(UI_LOCALE,{timeZone:"Asia/Ho_Chi_Minh"})}</td><td>{getEnumLabel(s.trainingType)}</td><td>{s.distanceMetres}{' '}{msg(MSG.M)}</td><td>{getEnumLabel(s.intensity)}</td><td><StateBadge value={s.status}/></td><td><Link className="btn btn-outline-primary" to={`/training/sessions/${s.id}`}>{msg(MSG.CHI_TIET)}</Link></td></tr>)}</tbody></table>{!data.sessions.length && <p className="empty-state">{msg(MSG.CHUA_CO_BUOI_TAP_O_TRANG_NAY)}</p>}</div></div>;}
/**
 * Tải kế hoạch cùng hồ sơ ngựa, giữ phân trang buổi tập và key theo version để tránh form stale.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function PlanDetail() {
    const {id}=useParams();const {user}=useAuth();const [page,setPage]=useState(1);
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load=useCallback(async()=>{const plan=await getPlan(id,{sessionPage:page,sessionPageSize:20});return {plan,horse:await getHorse(plan.plan.horseId)};},[id,page]);
    const resource=useRegistrationResource(load);
    return <section className="training-page"><BackLink to="/training/plans">{msg(MSG.KE_HOACH_HUAN_LUYEN)}</BackLink><ResourceState resource={resource}/>{resource.data && <><PlanContent key={`${id}-${resource.data.plan.plan.version}`} id={id} data={resource.data.plan} horse={resource.data.horse} user={user} reload={resource.reload}/><Pagination data={{page:resource.data.plan.sessionPage,pageSize:resource.data.plan.sessionPageSize,total:resource.data.plan.sessionTotal}} onChange={setPage}/></>}</section>;
}
