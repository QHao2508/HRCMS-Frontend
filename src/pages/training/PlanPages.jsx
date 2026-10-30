import { formatMetres } from '../../services/numberFormat.js';
import { clubDateTime, displayDate } from '../../services/displayDate.js';
import { useListFilters } from '../../context/useListFilters.js';
import { planOptions, choosePlanOption, initialPlanForm } from '../../services/templateCurriculum.js';
import TemplatePlanChoice from '../../components/TemplatePlanChoice.jsx';
import PlanStatusBadge from "../../components/PlanStatusBadge.jsx";
import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg } from "../../messages/index.js";
import { PLAN_STATUS, phaseLabel } from "../../constants/training.js";
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
import { Plus, TriangleAlert } from 'lucide-react';
import PageHeader from "../../components/ui/PageHeader.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Tabs from "../../components/ui/Tabs.jsx";
import Drawer from "../../components/ui/Drawer.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { EmptyState } from "../../components/ui/States.jsx";
import '../../style/lists.css';
import '../../style/horses.css';
/**
 * Đọc hết các trang danh sách để dựng lựa chọn ngựa/giáo án; dừng theo tổng/pageSize và trang rỗng.
 * @param load Giá trị load truyền vào collect; tham chiếu phần thân để xem cách dùng.
 */
import TrainingSearch from '../../components/TrainingSearch.jsx';
import { trainingHorse } from '../../services/trainingHistoryAccess.js';

async function collect(load) { const items = []; for(let page=1;;page++) {const data = await load({page,pageSize:100});items.push(...data.items);if(!data.items.length || data.page*data.pageSize>=data.total) return items;} }
/**
 * Tải và phân trang kế hoạch, tùy chọn lọc theo ngựa và action tạo theo role.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function PlanList() {
    const {user} = useAuth(); const [search] = useSearchParams(); const [listFilter,setListFilter] = useListFilters({page:1,search:""}); const page=listFilter.page; const setPage=page=>setListFilter({...listFilter,page});
    const horseId = search.get("horseId") || undefined; const query=listFilter.search;
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(() => listPlans({page,pageSize:20,search:query || undefined,...(horseId && {horseId})}),[page,horseId,query]);
    const resource = useRegistrationResource(load, { realtime: true });
    const open = plan => `/training/plans/${encodeURIComponent(plan.id)}`;
    return <section className="training-page list-page"><PageHeader title={msg(MSG.KE_HOACH_HUAN_LUYEN)} description={msg(MSG.KE_HOACH_CA_NHAN_HOA_VA_TIEN_DO_CAC_BUOI_TAP)} actions={user.role === ROLES.Trainer && <Link className="btn btn-primary" to={`/training/plans/new${horseId ? `?horseId=${horseId}` : ""}`}><Plus size={16} aria-hidden="true" />{msg(MSG.TAO_KE_HOACH)}</Link>} />
        <section className="hc-card is-flush list-card"><div className="list-filters training-search-row"><TrainingSearch key={query} initialValue={query} onSearch={value=>{setListFilter({...listFilter,search:value,page:1});}}/></div><ResourceState resource={resource} />
            {resource.data && <><DataTable caption={msg(MSG.KE_HOACH_HUAN_LUYEN)} rows={resource.data.items} empty={<EmptyState title={msg(MSG.CHUA_CO_KE_HOACH_TRONG_PHAM_VI_CUA_BAN)} />} columns={[
                {key:'horse',label:msg(MSG.TRAINING_HORSE),render:plan => <Link className="hc-row-title" to={open(plan)}><Avatar name={plan.horseName || '?'} /><span><strong>{plan.horseName || msg(MSG.CHUA_CO_THONG_TIN)}</strong><small>{plan.goal}</small></span></Link>},
                {key:'trainer',label:msg(MSG.TRAINING_TRAINER),render:plan => plan.trainerName || msg(MSG.CHUA_CO_THONG_TIN)},
                {key:'phase',label:msg(MSG.GIAI_DOAN),render:plan => phaseLabel(plan.phase)},
                {key:'period',label:`${msg(MSG.TU_NGAY)} → ${msg(MSG.DEN_NGAY)}`,nowrap:true,render:plan => `${displayDate(plan.startDate)} → ${displayDate(plan.endDate)}`},
                {key:'status',label:msg(MSG.TRANG_THAI),render:plan => <PlanStatusBadge plan={plan} />},
                {key:'open',label:<span className="visually-hidden">{msg(MSG.SUPPORT_ACTIONS)}</span>,align:'end',render:plan => <Link className="btn btn-outline-primary btn-sm" to={open(plan)}>{msg(MSG.XEM_KE_HOACH)}</Link>}]} />
            <Pagination data={resource.data} onChange={setPage} /></>}
        </section></section>;
}
/**
 * Tải lựa chọn ngựa/giáo án, giữ form kế hoạch cá nhân hóa và tạo qua API.
 * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function PlanCreate() {
    const navigate = useNavigate(); const [search] = useSearchParams();
    const [form,setForm] = useState({horseId:search.get("horseId") || "",templateId:"",templatePlanOptionKey:null,useCustomPlan:false,goal:"",phase:"",startDate:clubToday(),endDate:clubToday(),notes:""});
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(async () => { const [horses,templates]=await Promise.all([collect(listHorses),collect(listTemplates)]); return {horses,templates}; },[]);
    const resource = useRegistrationResource(load); const mutation = useMutation();
    /**
     * Cập nhật form theo name/value và reset lựa chọn phụ thuộc khi cần, không tự sửa dữ liệu server.
     * @param e Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm.
     */
    function change(e) { const {name,value} = e.target; const template = resource.data.templates.find(t => t.id === (name === "templateId" ? value : form.templateId)); if(name === "templateId") setForm(choosePlanOption({...form,templateId:value},template,planOptions(template)[0]?.key)); else if(name === "templatePlanOptionKey") setForm(choosePlanOption(form,template,value)); else setForm({...form,[name]:value}); }
    /**
     * Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.
     * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
     * @param e Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm.
     */
    async function submit(e) {e.preventDefault(); await mutation.run(() => createPlan(form),plan => navigate(`/training/plans/${plan.id}`));}
    return <section className="training-page form-page"><BackLink to="/training/plans">{msg(MSG.KE_HOACH_HUAN_LUYEN)}</BackLink><PageHeading title={msg(MSG.TAO_KE_HOACH_CA_NHAN_HOA)} description={msg(MSG.CHON_NGUA_DANG_PHU_TRACH_VA_GIAO_AN_THAM_KHAO)} /><ResourceState resource={resource} /><MutationState mutation={mutation} reload={resource.reload} />{resource.data && <form className="surface-card" onSubmit={submit}><fieldset disabled={mutation.pending || mutation.uncertain}><div className="row g-3"><Field label={msg(MSG.NGUA_DUOC_PHAN_CONG)} name="horseId" value={form.horseId} onChange={change} required options={[{value:"",label:msg(MSG.CHON_NGUA)},...resource.data.horses.map(h => ({value:h.id,label:h.name}))]} /><Field label={msg(MSG.GIAO_AN_THAM_KHAO)} name="templateId" value={form.templateId} onChange={change} required options={[{value:"",label:msg(MSG.CHON_GIAO_AN)},...resource.data.templates.map(t => ({value:t.id,label:t.name}))]} /><PlanFields form={form} onChange={change} template={resource.data.templates.find(t => t.id === form.templateId)} /></div><div className="wizard-actions"><Link className="btn btn-outline-primary" to="/training/plans">{msg(MSG.HUY)}</Link><button className="btn btn-success">{msg(MSG.TAO_KE_HOACH)}</button></div></fieldset></form>}</section>;
}
/**
 * Các trường controlled mục tiêu/giai đoạn/ngày/ghi chú dùng chung tạo và sửa kế hoạch.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {form,onChange}. Các props/callback lấy từ caller.
 */
function PlanFields({form,onChange,template}) {return <><TemplatePlanChoice template={template} form={form} onChange={onChange}/><Field label={msg(MSG.MUC_TIEU)} name="goal" value={form.goal} onChange={onChange} disabled={!!template && !form.useCustomPlan} required /><Field label={msg(MSG.GIAI_DOAN)} name="phase" value={form.phase} onChange={onChange} disabled={!!template && !form.useCustomPlan} required /><Field label={msg(MSG.NGAY_BAT_DAU)} name="startDate" value={form.startDate} onChange={onChange} type="date" required /><Field label={msg(MSG.NGAY_KET_THUC)} name="endDate" value={form.endDate} onChange={onChange} type="date" min={form.startDate} required /><Field label={msg(MSG.GHI_CHU)} name="notes" value={form.notes} onChange={onChange} multiline wide /></>;}
/**
 * Phân trang lịch sử huấn luyện và đọc snapshot theo từng sự kiện.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {id}. Các props/callback lấy từ caller.
 */
function History({id}) {const [page,setPage]=useState(1);
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load=useCallback(()=>planHistory(id,{page,pageSize:20}),[id,page]);const resource=useRegistrationResource(load);return <section className="surface-card"><h2>{msg(MSG.LICH_SU_HUAN_LUYEN)}</h2><ResourceState resource={resource}/>{resource.data && <>{resource.data.items.map(item => <div className="history-item" key={item.id}><div className="muted-caption">{clubDateTime(item.createdAt)}{' '}{msg(MSG.SYMBOL_SEPARATOR_DOT)}{' '}{item.sessionId ? msg(MSG.BUOI_TAP) : msg(MSG.KE_HOACH)}</div><HistorySnapshot snapshot={item.snapshot} /></div>)}{!resource.data.items.length && <p>{msg(MSG.CHUA_CO_LICH_SU)}</p>}<Pagination data={resource.data} onChange={setPage}/></>}</section>;}
/**
 * Render snapshot đã parse cùng badge trạng thái; fallback khi dữ liệu lịch sử không đọc được.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {snapshot}. Các props/callback lấy từ caller.
 */
function HistorySnapshot({snapshot}) {const view=historyView(snapshot);return view ? <details><summary>{view.title}{' '}{msg(MSG.SYMBOL_SEPARATOR_DOT)}{' '}<StateBadge value={view.status}/></summary><dl className="summary-grid mt-3">{view.rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></details> : <p>{msg(MSG.THONG_TIN_LICH_SU_CHUA_DOC_DUOC)}</p>;}
/**
 * Render kế hoạch, hạn chế vận động, sửa/trạng thái và tab buổi tập/lịch sử theo phân công.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {data,horse,user,id,reload}. Các props/callback lấy từ caller.
 */
function PlanContent({data,horse,user,id,reload}) {
    const [tab,setTab]=useState("sessions");const [editing,setEditing]=useState(false);const [status,setStatus]=useState("");
    const plan=data.plan; const canWrite=isAssigned(horse,user,ROLES.Trainer) && [PLAN_STATUS.Active,PLAN_STATUS.Paused].includes(plan.status);
    const [form,setForm]=useState(() => initialPlanForm({horseId:plan.horseId,templateId:plan.templateId,goal:plan.goal,phase:plan.phase,startDate:plan.startDate,endDate:plan.endDate,notes:plan.notes,templatePlanOptionKey:plan.templatePlanOptionKey,useCustomPlan:plan.useCustomPlan},data.template));
    const mutation=useMutation();
    const tabs=[{id:'sessions',label:msg(MSG.CAC_BUOI_TAP),count:data.sessionTotal ?? data.sessions.length},...(user.role !== ROLES.WorkRider ? [{id:'history',label:msg(MSG.LICH_SU)}] : [])];
    const saveEdit=e=>{e.preventDefault();mutation.run(()=>editPlan(id,form),()=>{setEditing(false);reload();});};
    return <>
        <section className="hc-card plan-hero">
            <div className="plan-hero-row">
                <div className="plan-hero-main">
                    <div className="hd-title-row"><h1>{`${horse.horse.name} · ${plan.goal}`}</h1><PlanStatusBadge plan={plan}/></div>
                </div>
                {canWrite && <div className="hd-actions plan-actions">{plan.status === PLAN_STATUS.Active && <Link className="btn btn-primary" to={`/training/plans/${id}/sessions/new`}><Plus size={16} aria-hidden="true" />{msg(MSG.TAO_BUOI_TAP)}</Link>}<button className="btn btn-outline-primary" aria-haspopup="dialog" disabled={mutation.pending} onClick={()=>setEditing(true)}>{msg(MSG.CHINH_SUA_KE_HOACH)}</button>
                    <form className="plan-status-form" onSubmit={e=>{e.preventDefault();if(status)mutation.run(()=>changePlanStatus(id,status),reload);}}><label className="visually-hidden" htmlFor="plan-status">{msg(MSG.DOI_TRANG_THAI)}</label><select id="plan-status" className="form-select" value={status} onChange={e=>setStatus(e.target.value)} disabled={mutation.pending || mutation.uncertain}><option value="">{msg(MSG.DOI_TRANG_THAI)}</option>{[PLAN_STATUS.Active,PLAN_STATUS.Paused,PLAN_STATUS.Completed,PLAN_STATUS.Archived].filter(s=>s!==plan.status).map(s=><option key={s} value={s}>{getEnumLabel(s)}</option>)}</select><button className="btn btn-outline-primary" disabled={!status || mutation.pending || mutation.uncertain}>{msg(MSG.XAC_NHAN)}</button></form>
                </div>}
                <dl className="hd-facts plan-facts">{[[msg(MSG.TRAINING_TRAINER),data.trainerName || msg(MSG.CHUA_CO_THONG_TIN)],[msg(MSG.GIAI_DOAN),phaseLabel(plan.phase)],[msg(MSG.TU_NGAY),displayDate(plan.startDate)],[msg(MSG.DEN_NGAY),displayDate(plan.endDate)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            </div>
            <Tabs label={msg(MSG.KE_HOACH)} tabs={tabs} active={tab} onChange={setTab} />
        </section>
        {!editing && <MutationState mutation={mutation} reload={reload}/>}{(horse.historyOnly || horse.horse.archived) && <p className="alert alert-info">{msg(MSG.TRAINING_HISTORY_READ_ONLY)}</p>}
        {!!data.restrictions.length && <div className="hd-alert restriction-card" role="note"><TriangleAlert size={20} aria-hidden="true"/><div><strong>{msg(MSG.HAN_CHE_VAN_DONG)}</strong><ul>{data.restrictions.map(r=><li key={r.id}>{r.reason}{' '}{msg(MSG.SYMBOL_SEPARATOR_DOT)}{' '}{displayDate(r.validFrom)}{' '}{msg(MSG.SYMBOL_ARROW_NEXT)}{' '}{r.validUntil ? displayDate(r.validUntil) : msg(MSG.CHUA_CO_NGAY_KET_THUC)}</li>)}</ul><p className="mb-0">{msg(MSG.DIEU_KIEN_VAN_DONG_DUOC_KIEM_TRA_LAI_KHI_TAO_SUA_VA_BAT_DAU_BUOI_TAP)}</p></div></div>}
        <Drawer open={canWrite && editing} size="lg" busy={mutation.pending} title={msg(MSG.CHINH_SUA_KE_HOACH)} onClose={()=>setEditing(false)}>
            <MutationState mutation={mutation} reload={reload}/>
            <form onSubmit={saveEdit}><fieldset disabled={mutation.pending || mutation.uncertain}><div className="row g-3"><PlanFields template={data.template} form={form} onChange={e=>setForm(e.target.name === "templatePlanOptionKey" ? choosePlanOption(form,data.template,e.target.value) : {...form,[e.target.name]:e.target.value})}/></div>
                <div className="hc-drawer-actions"><button type="button" className="btn btn-outline-primary" onClick={()=>setEditing(false)}>{msg(MSG.HUY)}</button><button className="btn btn-success ms-auto">{msg(MSG.LUU_KE_HOACH)}</button></div></fieldset></form>
        </Drawer>
        {tab === "sessions" ? <SessionTable data={data}/> : <History id={id}/>}
    </>;
}
/**
 * Hiển thị buổi tập của kế hoạch với giờ Việt Nam, nhãn enum và đường dẫn chi tiết.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {data}. Các props/callback lấy từ caller.
 */
function SessionTable({data}) {return <section className="hc-card is-flush list-card"><DataTable caption={msg(MSG.CAC_BUOI_TAP)} rows={data.sessions} empty={<EmptyState title={msg(MSG.CHUA_CO_BUOI_TAP_O_TRANG_NAY)} />} columns={[
    {key:'time',label:msg(MSG.THOI_GIAN_VIET_NAM),nowrap:true,render:s=><Link className="hc-row-title" to={`/training/sessions/${encodeURIComponent(s.id)}`}><span><strong>{clubDateTime(s.scheduledAt)}</strong><small>{getEnumLabel(s.trainingType)}</small></span></Link>},
    {key:'rider',label:msg(MSG.TRAINING_RIDER),render:s=>data.sessionNames?.find(n=>n.id===s.id)?.riderName || msg(MSG.CHUA_PHAN_CONG)},
    {key:'distance',label:msg(MSG.QUANG_DUONG),align:'end',nowrap:true,render:s=>formatMetres(s.distanceMetres)},
    {key:'intensity',label:msg(MSG.CUONG_DO),render:s=>getEnumLabel(s.intensity)},
    {key:'status',label:msg(MSG.TRANG_THAI),render:s=><StateBadge value={s.status}/>},
    {key:'open',label:<span className="visually-hidden">{msg(MSG.SUPPORT_ACTIONS)}</span>,align:'end',render:s=><Link className="btn btn-outline-primary btn-sm" to={`/training/sessions/${encodeURIComponent(s.id)}`}>{msg(MSG.CHI_TIET)}</Link>}]} /></section>;}
/**
 * Tải kế hoạch cùng hồ sơ ngựa, giữ phân trang buổi tập và key theo version để tránh form stale.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function PlanDetail() {
    const {id}=useParams();const {user}=useAuth();const [page,setPage]=useState(1);
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load=useCallback(async()=>{const plan=await getPlan(id,{sessionPage:page,sessionPageSize:20});return {plan,horse:await trainingHorse(getHorse,plan.plan.horseId,plan)};},[id,page]);
    const resource=useRegistrationResource(load);
    return <section className="training-page plan-detail"><BackLink to="/training/plans">{msg(MSG.KE_HOACH_HUAN_LUYEN)}</BackLink><ResourceState resource={resource}/>{resource.data && <><PlanContent key={`${id}-${resource.data.plan.plan.version}`} id={id} data={resource.data.plan} horse={resource.data.horse} user={user} reload={resource.reload}/><Pagination data={{page:resource.data.plan.sessionPage,pageSize:resource.data.plan.sessionPageSize,total:resource.data.plan.sessionTotal}} onChange={setPage}/></>}</section>;
}
