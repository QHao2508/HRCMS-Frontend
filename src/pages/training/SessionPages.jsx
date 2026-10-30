import { formatMetres } from '../../services/numberFormat.js';
import { clubDateTime } from '../../services/displayDate.js';
import { useListFilters } from '../../context/useListFilters.js';
import ProgressSteps from '../../components/ProgressSteps.jsx';
import TrainingSurfaceField from '../../components/TrainingSurfaceField.jsx';
import { requiredTypes, chooseExercise, initialSessionForm } from '../../services/templateCurriculum.js';
import TemplateExerciseChoice from '../../components/TemplateExerciseChoice.jsx';
import { sessionPlanLimits, planDateText } from '../../services/trainingSchedulingHelpers.js';
import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg } from "../../messages/index.js";
import { PLAN_STATUS, SESSION_STATUS, INTENSITY, TRAINING_TYPE, TRAINING_SURFACE } from "../../constants/training.js";
import { ROLES } from "../../constants/roles.js";
import { sessionPayload } from "../../services/trainingPayload.js";
import { isAssigned,localDateTime } from "../../services/workflowHelpers.js";
import { useMutation } from "../../context/useMutation.js";
import { useCallback, useState } from "react";
import { Link,useNavigate,useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { getHorse,staffDirectory } from "../../services/clubService.js";
import { trainingHorse } from '../../services/trainingHistoryAccess.js';
import { getPlan,createSession,listSessions,getSession,editSession,startSession,skipSession,submitResult,evaluateSession } from "../../services/trainingService.js";
import { PageHeading,ResourceState,Pagination,BackLink,Field,StateBadge,MutationState} from "../../components/WorkflowUI.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Drawer from "../../components/ui/Drawer.jsx";
import Modal from "../../components/ui/Modal.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { KeyValueList } from "../../components/ui/KeyValueList.jsx";
import { DataTable, FilterChips } from "../../components/ui/DataTable.jsx";
import { EmptyState } from "../../components/ui/States.jsx";
import { sessionTone } from "../../utils/statusTone.js";
import '../../style/lists.css';
import '../../style/horses.css';
import TrainingSearch from '../../components/TrainingSearch.jsx';
import TrainingAvailability from '../../components/TrainingAvailability.jsx';
const trainingTypes=Object.values(TRAINING_TYPE);
const intensityOptions=Object.values(INTENSITY);

/**
 * Các trường controlled lịch, bài tập, quãng đường, cường độ và người cưỡi dùng chung tạo/sửa buổi tập.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {form,change,riders,disabled,min,max}. Các props/callback lấy từ caller.
 */
function SessionFields({form,change,riders,disabled,min,max,template}) {
    const limits=sessionPlanLimits(min,max); const types=requiredTypes(template);
    return <fieldset disabled={disabled}><div className="row g-3">
        <TemplateExerciseChoice template={template} form={form} onChange={change}/>
        <Field label={msg(MSG.THOI_GIAN_GIO_VIET_NAM_UTC_7)} name="scheduledAt" value={form.scheduledAt} onChange={change} type="datetime-local" min={limits.min} max={limits.max} help={min && max ? msg(MSG.SCHED_PLAN_DATE_HELP,{start:planDateText(min),end:planDateText(max)}) : undefined} required/>
        <Field label={msg(MSG.WORK_RIDER)} name="riderId" value={form.riderId} onChange={change} options={[{value:"",label:msg(MSG.CHUA_PHAN_CONG_PLANNED)},...riders.map(r=>({value:r.id,label:[r.firstName,r.lastName].filter(Boolean).join(" ")}))]}/>
        <fieldset className="col-12" disabled={!!template && !form.useCustomExercise}><div className="row g-3">
            <Field label={msg(MSG.LOAI_BAI_TAP)} name="trainingType" value={form.trainingType} onChange={change} options={types.length ? types : trainingTypes}/>
            <Field label={msg(MSG.BR_DURATION)} name="durationMinutes" value={form.durationMinutes ?? ""} onChange={change} type="number" min={1} max={480} step={1} required/>
            <Field label={msg(MSG.QUANG_DUONG_M)} name="distanceMetres" value={form.distanceMetres} onChange={change} type="number" min={1} max={100000} step="any" required/>
            <Field label={msg(MSG.CUONG_DO)} name="intensity" value={form.intensity} onChange={change} options={intensityOptions}/>
            <TrainingSurfaceField key={form.templateExerciseKey || "custom"} value={form.surface} onChange={change}/>
            <Field label={msg(MSG.MUC_TIEU_BUOI_TAP)} name="target" value={form.target} onChange={change} required/>
        </div></fieldset>
        <Field label={msg(MSG.GHI_CHU)} name="notes" value={form.notes} onChange={change} multiline/>
    </div></fieldset>;
}
/**
 * Chỉ hiển thị tạo buổi tập cho huấn luyện viên được giao ngựa và kế hoạch Active; gửi payload qua helper chuẩn hóa.
 * Có điều hướng router; thông tin nhạy cảm không được đưa lên query URL.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function SessionCreate() {
    const {id}=useParams();const navigate=useNavigate();const {user}=useAuth();
    const [form,setForm]=useState({scheduledAt:"",trainingType:TRAINING_TYPE.Trot,durationMinutes:"",distanceMetres:1000,intensity:INTENSITY.Light,surface:TRAINING_SURFACE.Sand,target:"",notes:"",riderId:""});
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load=useCallback(async()=>{const ridersRequest=staffDirectory(ROLES.WorkRider);ridersRequest.catch(()=>{});const data=await getPlan(id);const [horse,riders]=await Promise.all([getHorse(data.plan.horseId),ridersRequest]);return {plan:data.plan,horse,riders,restrictions:data.restrictions,template:data.template};},[id]);
    const resource=useRegistrationResource(load);const mutation=useMutation();
    return <section className="training-page form-page"><BackLink to={`/training/plans/${id}`}>{msg(MSG.KE_HOACH_HUAN_LUYEN)}</BackLink><PageHeading title={msg(MSG.TAO_BUOI_TAP)} description={msg(MSG.CO_THE_GIAO_RIDER_NGAY_HOAC_LUU_BUOI_TAP_O_TRANG_THAI_PLANNED)}/><ResourceState resource={resource}/><MutationState mutation={mutation} reload={resource.reload}/>{resource.data && <div className="alert alert-info"><p className="mb-2">{msg(MSG.SCHED_PLAN_DATE_HELP,{start:planDateText(resource.data.plan.startDate),end:planDateText(resource.data.plan.endDate)})}</p>{resource.data.plan.startDate === resource.data.plan.endDate && <p className="mb-2">{msg(MSG.SCHED_PLAN_SINGLE_DAY)}</p>}<Link className="action-link" to={`/training/plans/${id}`}>{msg(MSG.SCHED_PLAN_EXTEND)}</Link></div>}{resource.data && (isAssigned(resource.data.horse,user,ROLES.Trainer) && resource.data.plan.status === PLAN_STATUS.Active ? <form className="surface-card" onSubmit={e=>{e.preventDefault();mutation.run(()=>createSession(id,sessionPayload(form)),s=>navigate(`/training/sessions/${s.id}`));}}><SessionFields template={resource.data.template} form={form} change={e=>setForm(e.target.name === "templateExerciseKey" ? chooseExercise(form,resource.data.template,e.target.value) : {...form,[e.target.name]:e.target.value})} riders={resource.data.riders} min={resource.data.plan.startDate} max={resource.data.plan.endDate} disabled={mutation.pending || mutation.uncertain}/><TrainingAvailability horseId={resource.data.plan.horseId} form={form} onPick={scheduledAt=>setForm({...form,scheduledAt})} min={resource.data.plan.startDate} max={resource.data.plan.endDate} disabled={mutation.pending || mutation.uncertain}/><div className="wizard-actions"><button className="btn btn-success" disabled={mutation.pending || mutation.uncertain}>{msg(MSG.LUU_BUOI_TAP)}</button></div></form> : <p className="alert alert-warning">{msg(MSG.CHI_TRAINER_DANG_DUOC_PHAN_CONG_CO_THE_TAO_BUOI_TAP_KHI_PLAN_DANG_ACTIVE)}</p>)}</section>;
}
/**
 * Lọc/phân trang buổi tập theo trạng thái, hiển thị enum tiếng Việt và liên kết chi tiết.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function SessionList() {
    const [filter,setFilter]=useListFilters({page:1,pageSize:20,status:"",search:""});
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load=useCallback(()=>listSessions({...filter,status:filter.status || undefined}),[filter]);const resource=useRegistrationResource(load, { realtime: true });
    const open=s=>`/training/sessions/${encodeURIComponent(s.id)}`;
    const statuses=["",SESSION_STATUS.Planned,SESSION_STATUS.Assigned,SESSION_STATUS.InProgress,SESSION_STATUS.Completed,SESSION_STATUS.Skipped,SESSION_STATUS.IssueReported].map(v=>({value:v,label:v ? getEnumLabel(v) : msg(MSG.TAT_CA),dot:v ? sessionTone(v) : undefined}));
    return <section className="training-page list-page"><PageHeader title={msg(MSG.CAC_BUOI_TAP)} description={msg(MSG.THEO_DOI_BUOI_TAP_TRONG_PHAM_VI_CUA_BAN)}/>
        <section className="hc-card is-flush list-card"><div className="list-filters training-search-row"><TrainingSearch key={filter.search} initialValue={filter.search} onSearch={search=>setFilter({...filter,search,page:1})}/></div>
            <div className="list-filters"><FilterChips label={msg(MSG.TRANG_THAI)} options={statuses} value={filter.status} onChange={status=>setFilter({...filter,status,page:1})}/></div>
            <ResourceState resource={resource}/>{resource.data && <><DataTable caption={msg(MSG.CAC_BUOI_TAP)} rows={resource.data.items} empty={<EmptyState title={msg(MSG.KHONG_CO_BUOI_TAP_O_TRANG_THAI_NAY)} />} columns={[
                {key:'time',label:msg(MSG.THOI_GIAN),nowrap:true,render:s=><Link className="hc-row-title" to={open(s)}><span><strong>{clubDateTime(s.scheduledAt)}</strong><small>{getEnumLabel(s.trainingType)}</small></span></Link>},
                {key:'horse',label:msg(MSG.TRAINING_HORSE),render:s=>s.horseName || msg(MSG.CHUA_CO_THONG_TIN)},
                {key:'rider',label:msg(MSG.TRAINING_RIDER),render:s=>s.riderName || <span className="hl-muted">{msg(MSG.CHUA_PHAN_CONG)}</span>},
                {key:'trainer',label:msg(MSG.TRAINING_TRAINER),render:s=>s.trainerName || msg(MSG.CHUA_CO_THONG_TIN)},
                {key:'distance',label:msg(MSG.QUANG_DUONG),align:'end',nowrap:true,render:s=>formatMetres(s.distanceMetres)},
                {key:'status',label:msg(MSG.TRANG_THAI),render:s=><StateBadge value={s.status}/>},
                {key:'open',label:<span className="visually-hidden">{msg(MSG.SUPPORT_ACTIONS)}</span>,align:'end',render:s=><Link className="btn btn-outline-primary btn-sm" to={open(s)}>{msg(MSG.CHI_TIET)}</Link>}]} />
            <Pagination data={resource.data} onChange={page=>setFilter({...filter,page})}/></>}
        </section></section>;
}
/**
 * Điều phối sửa/giao, bắt đầu/bỏ qua, nhập kết quả và đánh giá; mỗi action kiểm role, phân công và trạng thái UI.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {data,reload,user}. Các props/callback lấy từ caller.
 */
function SessionContent({data,reload,user}) {
    const s=data.session;const plan=data.plan;const writer=isAssigned(data.horse,user,ROLES.Trainer);
    const rider=user.role === ROLES.WorkRider && s.riderId === user.id && !data.horse.horse.archived;
    const [reason,setReason]=useState("");
    const [form,setForm]=useState(() => ({...initialSessionForm(s,data.template),scheduledAt:localDateTime(s.scheduledAt),riderId:s.riderId || ""}));
    const [result,setResult]=useState({distanceMetres:s.distanceMetres,timeSeconds:"",heartRate:"",intensity:s.intensity,feedback:"",abnormalObservation:false});
    const [evaluation,setEvaluation]=useState({comment:"",adjustFutureSessions:false});
    const mutation=useMutation();const locked=mutation.pending || mutation.uncertain;
    const [panel,setPanel]=useState(null);
    const canEdit=writer && [SESSION_STATUS.Planned,SESSION_STATUS.Assigned].includes(s.status) && plan.status === PLAN_STATUS.Active;
    const canStart=rider && s.status === SESSION_STATUS.Assigned;
    const canRecord=rider && s.status === SESSION_STATUS.InProgress && !data.result;
    const canEvaluate=writer && data.result && [SESSION_STATUS.Completed,SESSION_STATUS.IssueReported].includes(s.status) && !data.evaluation;
    const canSkip=(writer || rider) && [SESSION_STATUS.Planned,SESSION_STATUS.Assigned,SESSION_STATUS.InProgress].includes(s.status);
    const resultChange=e=>setResult({...result,[e.target.name]:e.target.value});
    return <>
        <section className="hc-card plan-hero">
            <div className="plan-hero-row"><div className="plan-hero-main">
                <div className="hd-title-row"><h1>{msg(MSG.SESSION_TITLE, { horse: data.horse.horse.name, type: getEnumLabel(s.trainingType) })}</h1><StateBadge value={s.status}/></div>
                <dl className="hd-facts plan-facts">{[[msg(MSG.THOI_GIAN),clubDateTime(s.scheduledAt)],[msg(MSG.WORK_RIDER),data.riderName || msg(MSG.CHUA_PHAN_CONG)],[msg(MSG.TRAINING_TRAINER),data.trainerName || msg(MSG.CHUA_CO_THONG_TIN)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            </div></div>
            {s.status !== SESSION_STATUS.Skipped && <div className="session-progress"><ProgressSteps steps={[msg(MSG.UX_SESSION_READY),msg(MSG.UX_SESSION_EXECUTE),msg(MSG.UX_SESSION_REVIEW)]} current={[SESSION_STATUS.Planned,SESSION_STATUS.Assigned].includes(s.status)?0:s.status===SESSION_STATUS.InProgress?1:2}/></div>}
        </section>
        {!panel && <MutationState mutation={mutation} reload={reload}/>}{(data.horse.historyOnly || data.horse.horse.archived) && <p className="alert alert-info">{msg(MSG.TRAINING_HISTORY_READ_ONLY)}</p>}
        <div className="session-layout">
            <div className="session-main">
                <Card title={msg(MSG.THONG_TIN_BUOI_TAP)}><KeyValueList items={[[msg(MSG.BR_DURATION),s.durationMinutes ?? msg(MSG.BR_DURATION_UNKNOWN)],[msg(MSG.BR_END),s.scheduledEndAt ? clubDateTime(s.scheduledEndAt) : null],[msg(MSG.QUANG_DUONG),formatMetres(s.distanceMetres)],[msg(MSG.CUONG_DO),getEnumLabel(s.intensity)],[msg(MSG.MAT_SAN),Object.hasOwn(TRAINING_SURFACE,s.surface)?TRAINING_SURFACE[s.surface]:(s.surface||null)],[msg(MSG.MUC_TIEU),s.target],[msg(MSG.WORK_RIDER),s.riderId ? (data.riderName || msg(MSG.DA_DUOC_PHAN_CONG)) : msg(MSG.CHUA_PHAN_CONG)],[msg(MSG.GHI_CHU),s.notes]]} /></Card>
                {data.result && <Card title={msg(MSG.KET_QUA_BUOI_TAP)}><KeyValueList items={[[msg(MSG.QUANG_DUONG),formatMetres(data.result.distanceMetres)],[msg(MSG.THOI_GIAN),msg(MSG.GIAY, { p0: data.result.timeSeconds })],[msg(MSG.TOC_DO),msg(MSG.SPEED_VALUE, { value: data.result.speedMetresPerSecond })],[msg(MSG.NHIP_TIM),data.result.heartRate || null],[msg(MSG.PHAN_HOI),data.result.feedback],[msg(MSG.BAT_THUONG),data.result.abnormalObservation ? msg(MSG.CO) : msg(MSG.KHONG)]]} /></Card>}
                {data.evaluation && <Card title={msg(MSG.DANH_GIA_DA_LUU)}><p style={{whiteSpace:"pre-wrap"}}>{data.evaluation.comment}</p><p className="muted-caption mb-0">{data.evaluation.adjustFutureSessions ? msg(MSG.CO_DE_NGHI_DIEU_CHINH_CAC_BUOI_TAP_TUONG_LAI) : msg(MSG.TIEP_TUC_THEO_KE_HOACH_HIEN_TAI)}</p></Card>}
            </div>
            {(canEdit || canStart || canRecord || canEvaluate || canSkip) && <aside className="session-side">
                {canStart && <Card title={msg(MSG.THUC_HIEN_BUOI_TAP)} className="session-next"><p>{msg(MSG.KIEM_TRA_THONG_TIN_BUOI_TAP_TRUOC_KHI_BAT_DAU)}</p><button className="btn btn-success w-100" disabled={locked || plan.status !== PLAN_STATUS.Active} onClick={()=>mutation.run(()=>startSession(s.id),reload,msg(MSG.DA_BAT_DAU_BUOI_TAP))}>{msg(MSG.BAT_DAU_BUOI_TAP)}</button></Card>}
                {canRecord && <Card title={msg(MSG.GHI_NHAN_KET_QUA)} className="session-next"><button className="btn btn-success w-100" aria-haspopup="dialog" disabled={locked} onClick={()=>setPanel('result')}>{msg(MSG.GHI_NHAN_KET_QUA)}</button></Card>}
                {canEvaluate && <Card title={msg(MSG.DANH_GIA_CUA_TRAINER)} className="session-next"><button className="btn btn-success w-100" aria-haspopup="dialog" disabled={locked} onClick={()=>setPanel('evaluate')}>{msg(MSG.DANH_GIA_CUA_TRAINER)}</button></Card>}
                {canEdit && <Card title={msg(MSG.DIEU_CHINH_VA_PHAN_CONG_RIDER)}><button className="btn btn-outline-primary w-100" aria-haspopup="dialog" disabled={locked} onClick={()=>setPanel('edit')}>{msg(MSG.CHINH_SUA_BUOI_TAP)}</button></Card>}
                {canSkip && <button type="button" className="btn btn-outline-danger session-skip-button" aria-haspopup="dialog" disabled={locked} onClick={()=>setPanel('skip')}>{msg(MSG.BO_QUA_BUOI_TAP)}</button>}
            </aside>}
        </div>
        <Modal open={canSkip && panel === 'skip'} busy={mutation.pending} title={msg(MSG.BO_QUA_BUOI_TAP)} onClose={()=>setPanel(null)} footer={<><button type="button" className="btn btn-outline-primary" onClick={()=>setPanel(null)}>{msg(MSG.HUY)}</button><button type="submit" form="skip-session-form" className="btn btn-danger" disabled={locked || !reason.trim()}>{msg(MSG.XAC_NHAN_BO_QUA)}</button></>}>
            <MutationState mutation={mutation} reload={reload}/>
            <form id="skip-session-form" onSubmit={e=>{e.preventDefault();if(reason.trim())mutation.run(()=>skipSession(s.id,reason.trim()),reload);}}><label htmlFor="skip-reason" className="form-label">{msg(MSG.LY_DO)}</label><textarea id="skip-reason" className="form-control" rows={4} value={reason} onChange={e=>setReason(e.target.value)} maxLength={2000} required disabled={locked}/></form>
        </Modal>
        <Drawer open={canEdit && panel === 'edit'} size="lg" busy={mutation.pending} title={msg(MSG.CHINH_SUA_BUOI_TAP)} onClose={()=>setPanel(null)}>
            <MutationState mutation={mutation} reload={reload}/>
            <form onSubmit={e=>{e.preventDefault();mutation.run(()=>editSession(s.id,sessionPayload(form)),reload);}}><SessionFields template={data.template} form={form} change={e=>setForm(e.target.name === "templateExerciseKey" ? chooseExercise(form,data.template,e.target.value) : {...form,[e.target.name]:e.target.value})} riders={data.riders} min={plan.startDate} max={plan.endDate} disabled={locked}/><TrainingAvailability horseId={s.horseId} form={form} onPick={scheduledAt=>setForm({...form,scheduledAt})} exceptSessionId={s.id} min={plan.startDate} max={plan.endDate} disabled={locked}/>
                <div className="hc-drawer-actions"><button type="button" className="btn btn-outline-primary" onClick={()=>setPanel(null)}>{msg(MSG.HUY)}</button><button className="btn btn-success ms-auto" disabled={locked}>{msg(MSG.LUU_DIEU_CHINH)}</button></div></form>
        </Drawer>
        <Drawer open={canRecord && panel === 'result'} busy={mutation.pending} title={msg(MSG.GHI_NHAN_KET_QUA)} onClose={()=>setPanel(null)}>
            <MutationState mutation={mutation} reload={reload}/>
            <form onSubmit={e=>{e.preventDefault();mutation.run(()=>submitResult(s.id,{...result,distanceMetres:Number(result.distanceMetres),timeSeconds:Number(result.timeSeconds),heartRate:result.heartRate === "" ? null : Number(result.heartRate)}),reload,msg(MSG.DA_LUU_KET_QUA_BUOI_TAP));}}><fieldset disabled={locked}><div className="row g-3"><Field label={msg(MSG.QUANG_DUONG_THUC_TE_M)} name="distanceMetres" value={result.distanceMetres} onChange={resultChange} type="number" min={0} max={100000} step="any" required/><Field label={msg(MSG.THOI_GIAN_GIAY)} name="timeSeconds" value={result.timeSeconds} onChange={resultChange} type="number" min={0.001} max={86400} step="any" required/><Field label={msg(MSG.NHIP_TIM_KHONG_BAT_BUOC)} name="heartRate" value={result.heartRate} onChange={resultChange} type="number" min={1} max={300}/><Field label={msg(MSG.CUONG_DO_THUC_TE)} name="intensity" value={result.intensity} onChange={resultChange} options={intensityOptions}/><Field label={msg(MSG.NHAN_XET_CUA_RIDER)} name="feedback" value={result.feedback} onChange={e=>setResult({...result,feedback:e.target.value})} multiline wide required/></div><label className="d-flex gap-2 mt-3"><input type="checkbox" checked={result.abnormalObservation} onChange={e=>setResult({...result,abnormalObservation:e.target.checked})}/>{msg(MSG.GHI_NHAN_BIEU_HIEN_BAT_THUONG)}</label>
                <div className="hc-drawer-actions"><button type="button" className="btn btn-outline-primary" onClick={()=>setPanel(null)}>{msg(MSG.HUY)}</button><button className="btn btn-success ms-auto">{msg(MSG.GUI_KET_QUA)}</button></div></fieldset></form>
        </Drawer>
        <Drawer open={!!canEvaluate && panel === 'evaluate'} busy={mutation.pending} title={msg(MSG.DANH_GIA_CUA_TRAINER)} onClose={()=>setPanel(null)}>
            <MutationState mutation={mutation} reload={reload}/>
            <form onSubmit={e=>{e.preventDefault();mutation.run(()=>evaluateSession(s.id,evaluation),reload,msg(MSG.DA_LUU_DANH_GIA));}}><fieldset disabled={locked}><label htmlFor="evaluation-comment" className="form-label">{msg(MSG.NHAN_XET_VA_QUYET_DINH)}</label><textarea id="evaluation-comment" className="form-control" required rows={5} value={evaluation.comment} onChange={e=>setEvaluation({...evaluation,comment:e.target.value})}/><label className="d-flex gap-2 mt-3"><input type="checkbox" checked={evaluation.adjustFutureSessions} onChange={e=>setEvaluation({...evaluation,adjustFutureSessions:e.target.checked})}/>{msg(MSG.DE_NGHI_DIEU_CHINH_CAC_BUOI_TAP_TUONG_LAI)}</label><p className="muted-caption mt-2">{msg(MSG.LUA_CHON_NAY_GHI_NHAN_Y_DINH_DIEU_CHINH_TRAINER_CAN_SUA_TUNG_BUOI_TAP_TU)}</p>
                <div className="hc-drawer-actions"><button type="button" className="btn btn-outline-primary" onClick={()=>setPanel(null)}>{msg(MSG.HUY)}</button><button className="btn btn-success ms-auto">{msg(MSG.LUU_DANH_GIA)}</button></div></fieldset></form>
        </Drawer>
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
    const load=useCallback(async()=>{const ridersRequest=user?.role===ROLES.Trainer ? staffDirectory(ROLES.WorkRider).catch(()=>[]) : Promise.resolve([]);const data=await getSession(id);const [horse,plan]=await Promise.all([trainingHorse(getHorse,data.session.horseId,data),getPlan(data.session.planId)]);const riders=isAssigned(horse,user,ROLES.Trainer) ? await ridersRequest : [];return {...data,horse,plan:plan.plan,riders};},[id,user]);
    const resource=useRegistrationResource(load);
    return <section className="training-page plan-detail"><BackLink to="/training/sessions">{msg(MSG.DANH_SACH_BUOI_TAP)}</BackLink><ResourceState resource={resource}/>{resource.data && <SessionContent key={`${id}-${resource.data.session.version}`} data={resource.data} user={user} reload={resource.reload}/>}</section>;
}
