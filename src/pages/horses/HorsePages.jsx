import HorseRegistrationIdentifiers from "../../components/HorseRegistrationIdentifiers.jsx";
import { systemRegistrationCode } from "../../services/horseIdentifiers.js";
import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg } from "../../messages/index.js";

import HorseTrainingAvailability from '../../components/HorseTrainingAvailability.jsx';
import AssignmentForm from './AssignmentForm.jsx';
import { ROLES } from "../../constants/roles.js";
import { isAssigned } from "../../services/workflowHelpers.js";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { listHorses,getHorse,fetchHorsePhoto } from "../../services/clubService.js";
import { SupportForm } from '../../components/SupportUI.jsx';
import { HorseHealthPanel, HorseMeasurements } from '../../components/HorseHealthPanel.jsx';
import { change as supportChange, id as supportId } from '../../services/supportService.js';
import { PageHeading,ResourceState,Pagination,BackLink,StateBadge} from "../../components/WorkflowUI.jsx";
/**
 * Tải/lọc/phân trang ngựa trong phạm vi API cấp; trình bày sức khỏe bằng enum và liên kết hồ sơ.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function HorseList() {
    const {user}=useAuth();
    const [filter,setFilter] = useState({page:1,pageSize:20,search:""});
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(() => listHorses(filter),[filter]);
    const resource = useRegistrationResource(load, { realtime: true });
    return <section><PageHeading title={msg(user.role === ROLES.HorseOwner ? MSG.NGUA_CUA_TOI : MSG.HORSES_LABEL)} description={msg(MSG.HO_SO_NGUA_TRONG_PHAM_VI_SO_HUU_HOAC_PHAN_CONG_CUA_BAN)} /><div className="surface-card"><label className="form-label" htmlFor="horse-search">{msg(MSG.TIM_THEO_TEN_HOAC_MA_DANG_KY)}</label><input id="horse-search" className="form-control mb-3" value={filter.search} onChange={e => setFilter({...filter,search:e.target.value,page:1})} /><ResourceState resource={resource} />{resource.data && <><div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.TEN_NGUA)}</th><th>{msg(MSG.HORSE_SYSTEM_CODE)}</th><th>{msg(MSG.GIONG)}</th><th>{msg(MSG.SUC_KHOE)}</th><th /></tr></thead><tbody>{resource.data.items.map(horse => <tr key={horse.id}><td>{horse.name}</td><td>{systemRegistrationCode(horse) || "—"}</td><td>{horse.breed}</td><td><StateBadge value={horse.healthStatus} /></td><td><Link className="btn btn-outline-primary" to={`/horses/${horse.id}`}>{msg(MSG.XEM_HO_SO)}</Link></td></tr>)}</tbody></table>{!resource.data.items.length && <p className="empty-state">{msg(MSG.CHUA_CO_NGUA_TRONG_PHAM_VI_CUA_BAN)}</p>}</div><Pagination data={resource.data} onChange={page => setFilter({...filter,page})} /></>}</div></section>;
}
/**
 * Tải ảnh ngựa qua endpoint kiểm phạm vi và tạo object URL; không dùng trực tiếp blob private.
 * Object URL chỉ là tài nguyên bộ nhớ browser; được revoke khi không còn dùng.
 * Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { id }. Các props/callback lấy từ caller.
 */
function HorsePhoto({ id }) {
    const [url,setUrl] = useState(null);
    useEffect(() => { let active = true, objectUrl; fetchHorsePhoto(id).then(blob => { if (active) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); } }).catch(() => {}); return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); }; },[id]);
    return url ? <img className="horse-photo mb-3" src={url} alt={msg(MSG.ANH_NHAN_DIEN_NGUA)} /> : null;
}
/**
 * Tải hồ sơ ngựa, số đo/phân công và danh bạ cần thiết; chỉ render form phân công khi role/phạm vi phù hợp.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function HorseDetail() {
    const {id} = useParams();
    const {user} = useAuth();
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    // Backend trả sẵn tên nhân sự (staffNames) trong hồ sơ ngựa: một request, không cần gọi danh bạ.
    const load = useCallback(() => getHorse(id),[id]);
    const resource = useRegistrationResource(load);
    const data = resource.data && {...resource.data, staffNames: resource.data.staffNames || {}};
    return <section><BackLink to="/horses">{msg(user.role===ROLES.HorseOwner?MSG.NGUA_CUA_TOI:MSG.HORSES_LABEL)}</BackLink><ResourceState resource={resource} />{data && <><PageHeading title={data.horse.name} action={<StateBadge value={data.horse.healthStatus} />} /><nav className="section-tabs" aria-label={msg(MSG.HO_SO_NGUA)}><a href="#horse-overview">{msg(MSG.TONG_QUAN)}</a><a href="#horse-assignments">{msg(MSG.NHAN_SU)}</a>{[ROLES.HorseOwner,ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer,ROLES.WorkRider,ROLES.Veterinarian].includes(user.role) && <Link to={`/training/plans?horseId=${id}`}>{msg(MSG.HUAN_LUYEN)}</Link>}</nav><section id="horse-overview" className="surface-card"><h2>{msg(MSG.THONG_TIN_NGUA)}</h2><HorsePhoto id={id} /><dl className="summary-grid"><HorseRegistrationIdentifiers horse={data.horse} />{[[msg(MSG.GIONG),data.horse.breed],[msg(MSG.NGAY_SINH),data.horse.dateOfBirth],[msg(MSG.GIOI_TINH),getEnumLabel(data.horse.gender)],[msg(MSG.SIRE_BO),data.horse.sire],[msg(MSG.DAM_ME),data.horse.dam],[msg(MSG.CHIEU_CAO_GAN_NHAT),data.latestMeasurement ? msg(MSG.HEIGHT_VALUE, { value: data.latestMeasurement.heightCm }) : "—"],[msg(MSG.CAN_NANG_GAN_NHAT),data.latestMeasurement ? msg(MSG.WEIGHT_VALUE, { value: data.latestMeasurement.weightKg }) : "—"]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl></section>
        <HorseHealthPanel horseId={id} user={user} />
        <HorseMeasurements horseId={id} user={user} reload={resource.reload} archived={data.horse.archived} />
        {(!data.horse.archived && (user.role === ROLES.ClubManager || isAssigned(data,user,ROLES.HeadTrainer))) && <AssignmentForm key={`${id}-${user.id}`} horse={data} user={user} reload={resource.reload} />}
        {!data.horse.archived && [ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer].includes(user.role) && <HorseTrainingAvailability horseId={id}/>}
        {data.horse.archived && <section className="surface-card"><p>{msg(MSG.BR_ARCHIVED)}</p><p>{msg(MSG.BR_ARCHIVE_CATEGORY)}{' '}{archiveLabel(data.horse.archiveCategory)}</p><p>{data.horse.archiveReason || '—'}</p></section>}
        {user.role === ROLES.ClubManager && !data.horse.archived && <SupportForm title={msg(MSG.BR_ARCHIVE)} initial={{category:'LeftClub',reason:'',confirm:''}} reload={resource.reload} submit={f=>{if(f.confirm!==data.horse.name)throw Object.assign(new Error(msg(MSG.SUPPORT_CONFIRM_ERROR)),{status:400});return supportChange(`/api/horses/${supportId(id)}/archive`,{category:f.category,reason:f.reason.trim()});}} fields={[{name:'category',label:msg(MSG.BR_ARCHIVE_CATEGORY),options:archiveCategories.map(value=>({value,label:archiveLabel(value)})),required:true,help:msg(MSG.BR_ARCHIVE_HELP)},{name:'reason',label:msg(MSG.BR_REASON),multiline:true,maxLength:2000,required:true},{name:'confirm',label:msg(MSG.BR_ARCHIVE_CONFIRM),required:true}]}/>}
        <section id="horse-assignments" className="surface-card"><h2>{msg(MSG.LICH_SU_PHAN_CONG)}</h2><div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.VAI_TRO)}</th><th>{msg(MSG.NHAN_SU)}</th><th>{msg(MSG.BAT_DAU)}</th><th>{msg(MSG.KET_THUC)}</th><th>{msg(MSG.TRANG_THAI)}</th><th>{msg(MSG.GHI_CHU)}</th></tr></thead><tbody>{data.assignments.map(a => <tr key={a.id}><td>{getEnumLabel(a.role)}</td><td>{a.staffId === user.id ? msg(MSG.BAN) : (data.staffNames[a.staffId] || msg(MSG.NHAN_SU_DA_KET_THUC_PHAN_CONG))}</td><td>{a.startDate}</td><td>{a.endDate || (a.active ? msg(MSG.CHUA_CO_NGAY_KET_THUC) : "—")}</td><td>{a.active ? msg(MSG.DANG_PHU_TRACH) : msg(MSG.DA_KET_THUC)}</td><td>{a.notes}</td></tr>)}</tbody></table>{!data.assignments.length && <p className="empty-state">{msg(MSG.CHUA_CO_PHAN_CONG_CHINH_THUC)}</p>}</div></section></>}</section>;
}

const archiveCategories=['LeftClub','Transferred','Sold','Deceased','Other'];
const archiveLabel=value=>value?msg({LeftClub:MSG.BR_LEFT_CLUB,Transferred:MSG.BR_TRANSFERRED,Sold:MSG.BR_SOLD,Deceased:MSG.BR_DECEASED,Other:MSG.BR_OTHER}[value] || MSG.BR_OTHER):'—';
