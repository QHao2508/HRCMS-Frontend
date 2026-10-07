import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg, UI_LOCALE } from "../../messages/index.js";
import { PLAN_STATUS, SESSION_STATUS, INTENSITY, TRAINING_TYPE } from "../../constants/training.js";
import { ROLES } from "../../constants/roles.js";
import { sessionPayload } from "../../services/trainingPayload.js";
import { isAssigned,localDateTime } from "../../services/workflowHelpers.js";
import { useMutation } from "../../context/useMutation.js";
import { useCallback, useState } from "react";
import { Link,useNavigate,useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { getHorse,staffDirectory } from "../../services/clubService.js";
import { getPlan,createSession,listSessions,getSession,editSession,startSession,skipSession,submitResult,evaluateSession } from "../../services/trainingService.js";
import { PageHeading,ResourceState,Pagination,BackLink,Field,StateBadge,MutationState} from "../../components/WorkflowUI.jsx";
const trainingTypes=Object.values(TRAINING_TYPE);
const intensityOptions=Object.values(INTENSITY);

/**
 * Các trường controlled lịch, bài tập, quãng đường, cường độ và người cưỡi dùng chung tạo/sửa buổi tập.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {form,change,riders,disabled,min,max}. Các props/callback lấy từ caller.
 */
function SessionFields({form,change,riders,disabled,min,max}) {return <fieldset disabled={disabled}><div className="row g-3"><Field label={msg(MSG.THOI_GIAN_GIO_VIET_NAM_UTC_7)} name="scheduledAt" value={form.scheduledAt} onChange={change} type="datetime-local" min={min && `${min}T00:00`} max={max && `${max}T23:59`} required/><Field label={msg(MSG.LOAI_BAI_TAP)} name="trainingType" value={form.trainingType} onChange={change} options={trainingTypes}/><Field label={msg(MSG.QUANG_DUONG_M)} name="distanceMetres" value={form.distanceMetres} onChange={change} type="number" min={1} max={100000} step="any" required/><Field label={msg(MSG.CUONG_DO)} name="intensity" value={form.intensity} onChange={change} options={intensityOptions}/><Field label={msg(MSG.MAT_SAN)} name="surface" value={form.surface} onChange={change} required/><Field label={msg(MSG.MUC_TIEU_BUOI_TAP)} name="target" value={form.target} onChange={change} required/><Field label={msg(MSG.WORK_RIDER)} name="riderId" value={form.riderId} onChange={change} options={[{value:"",label:msg(MSG.CHUA_PHAN_CONG_PLANNED)},...riders.map(r=>({value:r.id,label:[r.firstName,r.lastName].filter(Boolean).join(" ")}))]}/><Field label={msg(MSG.GHI_CHU)} name="notes" value={form.notes} onChange={change} multiline/></div></fieldset>;}
/**
 * Chỉ hiển thị tạo buổi tập cho huấn luyện viên được giao ngựa và kế hoạch Active; gửi payload qua helper chuẩn hóa.
 * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function SessionCreate() {
    const {id}=useParams();const navigate=useNavigate();const {user}=useAuth();
    const [form,setForm]=useState({scheduledAt:"",trainingType:TRAINING_TYPE.Trot,distanceMetres:1000,intensity:INTENSITY.Light,surface:msg(MSG.SURFACE_SAND),target:"",notes:"",riderId:""});
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load=useCallback(async()=>{const data=await getPlan(id);return {plan:data.plan,horse:await getHorse(data.plan.horseId),riders:await staffDirectory(ROLES.WorkRider),restrictions:data.restrictions};},[id]);
    const resource=useRegistrationResource(load);const mutation=useMutation();
    return <section className="training-page"><BackLink to={`/training/plans/${id}`}>{msg(MSG.KE_HOACH_HUAN_LUYEN)}</BackLink><PageHeading title={msg(MSG.TAO_BUOI_TAP)} description={msg(MSG.CO_THE_GIAO_RIDER_NGAY_HOAC_LUU_BUOI_TAP_O_TRANG_THAI_PLANNED)}/><ResourceState resource={resource}/><MutationState mutation={mutation} reload={resource.reload}/>{resource.data && (isAssigned(resource.data.horse,user,ROLES.Trainer) && resource.data.plan.status === PLAN_STATUS.Active ? <form className="surface-card" onSubmit={e=>{e.preventDefault();mutation.run(()=>createSession(id,sessionPayload(form)),s=>navigate(`/training/sessions/${s.id}`));}}><SessionFields form={form} change={e=>setForm({...form,[e.target.name]:e.target.value})} riders={resource.data.riders} min={resource.data.plan.startDate} max={resource.data.plan.endDate} disabled={mutation.pending || mutation.uncertain}/><div className="wizard-actions"><button className="btn btn-success" disabled={mutation.pending || mutation.uncertain}>{msg(MSG.LUU_BUOI_TAP)}</button></div></form> : <p className="alert alert-warning">{msg(MSG.CHI_TRAINER_DANG_DUOC_PHAN_CONG_CO_THE_TAO_BUOI_TAP_KHI_PLAN_DANG_ACTIVE)}</p>)}</section>;
}
/**
 * Lọc/phân trang buổi tập theo trạng thái, hiển thị enum tiếng Việt và liên kết chi tiết.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function SessionList() {
    const [filter,setFilter]=useState({page:1,pageSize:20,status:""});
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load=useCallback(()=>listSessions({...filter,status:filter.status || undefined}),[filter]);const resource=useRegistrationResource(load);
    return <section className="training-page"><PageHeading title={msg(MSG.CAC_BUOI_TAP)} description={msg(MSG.THEO_DOI_BUOI_TAP_TRONG_PHAM_VI_CUA_BAN)}/><section className="surface-card"><label htmlFor="session-filter" className="form-label">{msg(MSG.TRANG_THAI)}</label><select id="session-filter" className="form-select mb-3" value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value,page:1})}>{["",SESSION_STATUS.Planned,SESSION_STATUS.Assigned,SESSION_STATUS.InProgress,SESSION_STATUS.Completed,SESSION_STATUS.Skipped,SESSION_STATUS.IssueReported].map(s=><option key={s} value={s}>{s ? getEnumLabel(s) : msg(MSG.TAT_CA)}</option>)}</select><ResourceState resource={resource}/>{resource.data && <><div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.THOI_GIAN)}</th><th>{msg(MSG.BAI_TAP)}</th><th>{msg(MSG.QUANG_DUONG)}</th><th>{msg(MSG.TRANG_THAI)}</th><th/></tr></thead><tbody>{resource.data.items.map(s=><tr key={s.id}><td>{new Date(s.scheduledAt).toLocaleString(UI_LOCALE,{timeZone:"Asia/Ho_Chi_Minh"})}</td><td>{getEnumLabel(s.trainingType)}</td><td>{s.distanceMetres}{' '}{msg(MSG.M)}</td><td><StateBadge value={s.status}/></td><td><Link className="btn btn-outline-primary" to={`/training/sessions/${s.id}`}>{msg(MSG.CHI_TIET)}</Link></td></tr>)}</tbody></table>{!resource.data.items.length && <p className="empty-state">{msg(MSG.KHONG_CO_BUOI_TAP_O_TRANG_THAI_NAY)}</p>}</div><Pagination data={resource.data} onChange={page=>setFilter({...filter,page})}/></>}</section></section>;
}
/**
 * Điều phối sửa/giao, bắt đầu/bỏ qua, nhập kết quả và đánh giá; mỗi action kiểm role, phân công và trạng thái UI.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {data,reload,user}. Các props/callback lấy từ caller.
 */
function SessionContent({data,reload,user}) {
    const s=data.session;const plan=data.plan;const writer=isAssigned(data.horse,user,ROLES.Trainer);
    const rider=user.role === ROLES.WorkRider && s.riderId === user.id;
    const [editing,setEditing]=useState(false);const [reason,setReason]=useState("");
    const [form,setForm]=useState({...s,scheduledAt:localDateTime(s.scheduledAt),riderId:s.riderId || ""});
    const [result,setResult]=useState({distanceMetres:s.distanceMetres,timeSeconds:"",heartRate:"",intensity:s.intensity,feedback:"",abnormalObservation:false});
    const [evaluation,setEvaluation]=useState({comment:"",adjustFutureSessions:false});
    const mutation=useMutation();const locked=mutation.pending || mutation.uncertain;
    return <><PageHeading title={msg(MSG.SESSION_TITLE, { horse: data.horse.horse.name, type: getEnumLabel(s.trainingType) })} description={new Date(s.scheduledAt).toLocaleString(UI_LOCALE,{timeZone:"Asia/Ho_Chi_Minh"})} action={<StateBadge value={s.status}/>}/><MutationState mutation={mutation} reload={reload}/><section className="surface-card"><h2>{msg(MSG.THONG_TIN_BUOI_TAP)}</h2><dl className="summary-grid">{[[msg(MSG.QUANG_DUONG),msg(MSG.DISTANCE_VALUE, { value: s.distanceMetres })],[msg(MSG.CUONG_DO),getEnumLabel(s.intensity)],[msg(MSG.MAT_SAN),s.surface],[msg(MSG.MUC_TIEU),s.target],[msg(MSG.WORK_RIDER),s.riderId ? (s.riderId === user.id ? msg(MSG.BAN) : msg(MSG.DA_DUOC_PHAN_CONG)) : msg(MSG.CHUA_PHAN_CONG)],[msg(MSG.GHI_CHU),s.notes]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl></section>
        {writer && [SESSION_STATUS.Planned,SESSION_STATUS.Assigned].includes(s.status) && plan.status === PLAN_STATUS.Active && <section className="surface-card"><h2>{msg(MSG.DIEU_CHINH_VA_PHAN_CONG_RIDER)}</h2><button className="btn btn-outline-primary" disabled={locked} onClick={()=>setEditing(!editing)}>{msg(MSG.CHINH_SUA_BUOI_TAP)}</button>{editing && <form className="mt-3" onSubmit={e=>{e.preventDefault();mutation.run(()=>editSession(s.id,sessionPayload(form)),reload);}}><SessionFields form={form} change={e=>setForm({...form,[e.target.name]:e.target.value})} riders={data.riders} min={plan.startDate} max={plan.endDate} disabled={locked}/><button className="btn btn-success mt-3" disabled={locked}>{msg(MSG.LUU_DIEU_CHINH)}</button></form>}</section>}
        {rider && s.status === SESSION_STATUS.Assigned && <section className="surface-card"><h2>{msg(MSG.THUC_HIEN_BUOI_TAP)}</h2><p>{msg(MSG.KIEM_TRA_THONG_TIN_BUOI_TAP_TRUOC_KHI_BAT_DAU)}</p><button className="btn btn-success" disabled={locked || plan.status !== PLAN_STATUS.Active} onClick={()=>mutation.run(()=>startSession(s.id),reload,msg(MSG.DA_BAT_DAU_BUOI_TAP))}>{msg(MSG.BAT_DAU_BUOI_TAP)}</button></section>}
        {rider && s.status === SESSION_STATUS.InProgress && !data.result && <section className="surface-card"><h2>{msg(MSG.GHI_NHAN_KET_QUA)}</h2><form onSubmit={e=>{e.preventDefault();mutation.run(()=>submitResult(s.id,{...result,distanceMetres:Number(result.distanceMetres),timeSeconds:Number(result.timeSeconds),heartRate:result.heartRate === "" ? null : Number(result.heartRate)}),reload,msg(MSG.DA_LUU_KET_QUA_BUOI_TAP));}}><fieldset disabled={locked}><div className="row g-3"><Field label={msg(MSG.QUANG_DUONG_THUC_TE_M)} name="distanceMetres" value={result.distanceMetres} onChange={e=>setResult({...result,[e.target.name]:e.target.value})} type="number" min={0} max={100000} step="any" required/><Field label={msg(MSG.THOI_GIAN_GIAY)} name="timeSeconds" value={result.timeSeconds} onChange={e=>setResult({...result,[e.target.name]:e.target.value})} type="number" min={0.001} max={86400} step="any" required/><Field label={msg(MSG.NHIP_TIM_KHONG_BAT_BUOC)} name="heartRate" value={result.heartRate} onChange={e=>setResult({...result,[e.target.name]:e.target.value})} type="number" min={1} max={300}/><Field label={msg(MSG.CUONG_DO_THUC_TE)} name="intensity" value={result.intensity} onChange={e=>setResult({...result,[e.target.name]:e.target.value})} options={intensityOptions}/><Field label={msg(MSG.NHAN_XET_CUA_RIDER)} name="feedback" value={result.feedback} onChange={e=>setResult({...result,feedback:e.target.value})} multiline wide required/></div><label className="d-flex gap-2 mt-3"><input type="checkbox" checked={result.abnormalObservation} onChange={e=>setResult({...result,abnormalObservation:e.target.checked})}/>{msg(MSG.GHI_NHAN_BIEU_HIEN_BAT_THUONG)}</label><button className="btn btn-success mt-3">{msg(MSG.GUI_KET_QUA)}</button></fieldset></form></section>}
        {data.result && <section className="surface-card"><h2>{msg(MSG.KET_QUA_BUOI_TAP)}</h2><dl className="summary-grid">{[[msg(MSG.QUANG_DUONG),msg(MSG.DISTANCE_VALUE, { value: data.result.distanceMetres })],[msg(MSG.THOI_GIAN),msg(MSG.GIAY, { p0: data.result.timeSeconds })],[msg(MSG.TOC_DO),msg(MSG.SPEED_VALUE, { value: data.result.speedMetresPerSecond })],[msg(MSG.NHIP_TIM),data.result.heartRate || "—"],[msg(MSG.PHAN_HOI),data.result.feedback],[msg(MSG.BAT_THUONG),data.result.abnormalObservation ? msg(MSG.CO) : msg(MSG.KHONG)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>}
        {writer && data.result && [SESSION_STATUS.Completed,SESSION_STATUS.IssueReported].includes(s.status) && !data.evaluation && <section className="surface-card"><h2>{msg(MSG.DANH_GIA_CUA_TRAINER)}</h2><form onSubmit={e=>{e.preventDefault();mutation.run(()=>evaluateSession(s.id,evaluation),reload,msg(MSG.DA_LUU_DANH_GIA));}}><fieldset disabled={locked}><label htmlFor="evaluation-comment" className="form-label">{msg(MSG.NHAN_XET_VA_QUYET_DINH)}</label><textarea id="evaluation-comment" className="form-control" required rows={4} value={evaluation.comment} onChange={e=>setEvaluation({...evaluation,comment:e.target.value})}/><label className="d-flex gap-2 mt-3"><input type="checkbox" checked={evaluation.adjustFutureSessions} onChange={e=>setEvaluation({...evaluation,adjustFutureSessions:e.target.checked})}/>{msg(MSG.DE_NGHI_DIEU_CHINH_CAC_BUOI_TAP_TUONG_LAI)}</label><p className="muted-caption mt-2">{msg(MSG.LUA_CHON_NAY_GHI_NHAN_Y_DINH_DIEU_CHINH_TRAINER_CAN_SUA_TUNG_BUOI_TAP_TU)}</p><button className="btn btn-success">{msg(MSG.LUU_DANH_GIA)}</button></fieldset></form></section>}
        {data.evaluation && <section className="surface-card"><h2>{msg(MSG.DANH_GIA_DA_LUU)}</h2><p style={{whiteSpace:"pre-wrap"}}>{data.evaluation.comment}</p><p className="muted-caption">{data.evaluation.adjustFutureSessions ? msg(MSG.CO_DE_NGHI_DIEU_CHINH_CAC_BUOI_TAP_TUONG_LAI) : msg(MSG.TIEP_TUC_THEO_KE_HOACH_HIEN_TAI)}</p></section>}
        {(writer || rider) && [SESSION_STATUS.Planned,SESSION_STATUS.Assigned,SESSION_STATUS.InProgress].includes(s.status) && <section className="surface-card"><h2>{msg(MSG.BO_QUA_BUOI_TAP)}</h2><form onSubmit={e=>{e.preventDefault();if(reason.trim())mutation.run(()=>skipSession(s.id,reason.trim()),reload);}}><label htmlFor="skip-reason" className="form-label">{msg(MSG.LY_DO)}</label><textarea id="skip-reason" className="form-control mb-3" value={reason} onChange={e=>setReason(e.target.value)} maxLength={2000} required disabled={locked}/><button className="btn btn-outline-danger" disabled={locked || !reason.trim()}>{msg(MSG.XAC_NHAN_BO_QUA)}</button></form></section>}
    </>;
}
/**
 * Tải buổi tập, kế hoạch, ngựa và danh bạ người cưỡi cần thiết; dựng nội dung theo version.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function SessionDetail() {
    const {id}=useParams();const {user}=useAuth();
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load=useCallback(async()=>{const data=await getSession(id);const horse=await getHorse(data.session.horseId);const plan=await getPlan(data.session.planId);const riders=isAssigned(horse,user,ROLES.Trainer) ? await staffDirectory(ROLES.WorkRider) : [];return {...data,horse,plan:plan.plan,riders};},[id,user]);
    const resource=useRegistrationResource(load);
    return <section className="training-page"><BackLink to="/training/sessions">{msg(MSG.DANH_SACH_BUOI_TAP)}</BackLink><ResourceState resource={resource}/>{resource.data && <SessionContent key={`${id}-${resource.data.session.version}`} data={resource.data} user={user} reload={resource.reload}/>}</section>;
}
