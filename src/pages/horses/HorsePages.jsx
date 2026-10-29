import HorsePhoto from '../../components/HorsePhoto.jsx';
import { useListFilters } from '../../context/useListFilters.js';
import HorseRegistrationIdentifiers from "../../components/HorseRegistrationIdentifiers.jsx";
import { systemRegistrationCode } from "../../services/horseIdentifiers.js";
import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg } from "../../messages/index.js";

import HorseTrainingAvailability from '../../components/HorseTrainingAvailability.jsx';
import AssignmentForm from './AssignmentForm.jsx';
import { ROLES } from "../../constants/roles.js";
import { isAssigned } from "../../services/workflowHelpers.js";
import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { listHorses,getHorse } from "../../services/clubService.js";
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
    const [filter,setFilter] = useListFilters({page:1,pageSize:20,search:""});
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(() => listHorses(filter),[filter]);
    const resource = useRegistrationResource(load, { realtime: true });
    return <section><PageHeading title={msg(user.role === ROLES.HorseOwner ? MSG.NGUA_CUA_TOI : MSG.HORSES_LABEL)} description={msg(MSG.HO_SO_NGUA_TRONG_PHAM_VI_SO_HUU_HOAC_PHAN_CONG_CUA_BAN)} /><div className="surface-card"><form className="filter-row" onSubmit={event=>{event.preventDefault();setFilter({...filter,search:String(new FormData(event.currentTarget).get('search') || '').trim(),page:1});}}><div className="list-search-field"><label className="form-label" htmlFor="horse-search">{msg(MSG.TIM_THEO_TEN_HOAC_MA_DANG_KY)}</label><input type="search" id="horse-search" name="search" key={filter.search} defaultValue={filter.search} className="form-control" maxLength={100}/></div><button className="btn btn-primary" type="submit">{msg(MSG.SEARCH_ACTION)}</button><button type="reset" className="btn btn-outline-secondary" onClick={()=>setFilter({...filter,search:"",page:1})}>{msg(MSG.UX_SEARCH_CLEAR)}</button></form><ResourceState resource={resource} />{resource.data && <><div className="table-responsive" tabIndex={0} role="region" aria-label={msg(MSG.HORSES_LABEL)}><table className="table"><thead><tr><th scope="col">{msg(MSG.TEN_NGUA)}</th><th scope="col">{msg(MSG.HORSE_SYSTEM_CODE)}</th><th scope="col">{msg(MSG.GIONG)}</th><th scope="col">{msg(MSG.SUC_KHOE)}</th><th scope="col"><span className="visually-hidden">{msg(MSG.SUPPORT_ACTIONS)}</span></th></tr></thead><tbody>{resource.data.items.map(horse => <tr key={horse.id}><td>{horse.name}</td><td>{systemRegistrationCode(horse) || "—"}</td><td>{horse.breed}</td><td><StateBadge value={horse.healthStatus} /></td><td><Link className="btn btn-outline-primary" to={`/horses/${horse.id}`}>{msg(MSG.XEM_HO_SO)}</Link></td></tr>)}</tbody></table>{!resource.data.items.length && <p className="empty-state">{msg(MSG.CHUA_CO_NGUA_TRONG_PHAM_VI_CUA_BAN)}</p>}</div><Pagination data={resource.data} onChange={page => setFilter({...filter,page})} /></>}</div></section>;
}
/**
 * Tải ảnh ngựa qua endpoint kiểm phạm vi và tạo object URL; không dùng trực tiếp blob private.
 * Object URL chỉ là tài nguyên bộ nhớ browser; được revoke khi không còn dùng.
 * Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { id }. Các props/callback lấy từ caller.
 */
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
    return <section><BackLink to="/horses">{msg(user.role===ROLES.HorseOwner?MSG.NGUA_CUA_TOI:MSG.HORSES_LABEL)}</BackLink><ResourceState resource={resource} />{data && <><PageHeading title={data.horse.name} action={<StateBadge value={data.horse.healthStatus} />} /><nav className="section-tabs" aria-label={msg(MSG.HO_SO_NGUA)}><a href="#horse-overview">{msg(MSG.TONG_QUAN)}</a><a href="#horse-health">{msg(MSG.UX_HEALTH)}</a><a href="#horse-measurements">{msg(MSG.UX_MEASUREMENTS)}</a><a href="#horse-people">{msg(MSG.UX_PEOPLE)}</a><a href="#horse-history">{msg(MSG.UX_HISTORY)}</a>{[ROLES.HorseOwner,ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer,ROLES.WorkRider,ROLES.Veterinarian].includes(user.role) && <Link className="action-link" to={`/training/plans?horseId=${id}`}>{msg(MSG.HUAN_LUYEN)}</Link>}</nav><section id="horse-overview" className="surface-card horse-overview horse-section"><h2>{msg(MSG.THONG_TIN_NGUA)}</h2><div className="horse-overview-layout"><HorsePhoto key={id} id={id} name={data.horse.name} metadata={data.photo} /><dl className="summary-grid"><HorseRegistrationIdentifiers horse={data.horse} />{[[msg(MSG.GIONG),data.horse.breed],[msg(MSG.NGAY_SINH),data.horse.dateOfBirth],[msg(MSG.GIOI_TINH),getEnumLabel(data.horse.gender)],[msg(MSG.SIRE_BO),data.horse.sire],[msg(MSG.DAM_ME),data.horse.dam],[msg(MSG.CHIEU_CAO_GAN_NHAT),data.latestMeasurement ? msg(MSG.HEIGHT_VALUE, { value: data.latestMeasurement.heightCm }) : "—"],[msg(MSG.CAN_NANG_GAN_NHAT),data.latestMeasurement ? msg(MSG.WEIGHT_VALUE, { value: data.latestMeasurement.weightKg }) : "—"]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl></div></section>
        <div className="horse-section"><HorseHealthPanel horseId={id} user={user} /></div>
        <div className="horse-section"><HorseMeasurements horseId={id} user={user} reload={resource.reload} archived={data.horse.archived} /></div><div id="horse-people" className="horse-section"><h2 className="horse-section-heading">{msg(MSG.UX_PEOPLE)}</h2></div>
        {(!data.horse.archived && (user.role === ROLES.ClubManager || isAssigned(data,user,ROLES.HeadTrainer))) && <AssignmentForm key={`${id}-${user.id}`} horse={data} user={user} reload={resource.reload} />}
        {!data.horse.archived && [ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer].includes(user.role) && <HorseTrainingAvailability horseId={id}/>}
        {data.horse.archived && <section className="surface-card"><p>{msg(MSG.BR_ARCHIVED)}</p><p>{msg(MSG.BR_ARCHIVE_CATEGORY)}{' '}{archiveLabel(data.horse.archiveCategory)}</p><p>{data.horse.archiveReason || '—'}</p></section>}

        <section id="horse-history" className="surface-card horse-section"><h2>{msg(MSG.LICH_SU_PHAN_CONG)}</h2><div className="table-responsive"><table className="table"><thead><tr><th scope="col">{msg(MSG.VAI_TRO)}</th><th scope="col">{msg(MSG.NHAN_SU)}</th><th scope="col">{msg(MSG.BAT_DAU)}</th><th scope="col">{msg(MSG.KET_THUC)}</th><th scope="col">{msg(MSG.TRANG_THAI)}</th><th scope="col">{msg(MSG.GHI_CHU)}</th></tr></thead><tbody>{data.assignments.map(a => <tr key={a.id}><td>{getEnumLabel(a.role)}</td><td>{a.staffId === user.id ? msg(MSG.BAN) : (data.staffNames[a.staffId] || msg(MSG.NHAN_SU_DA_KET_THUC_PHAN_CONG))}</td><td>{a.startDate}</td><td>{a.endDate || (a.active ? msg(MSG.CHUA_CO_NGAY_KET_THUC) : "—")}</td><td>{a.active ? msg(MSG.DANG_PHU_TRACH) : msg(MSG.DA_KET_THUC)}</td><td>{a.notes}</td></tr>)}</tbody></table>{!data.assignments.length && <p className="empty-state">{msg(MSG.CHUA_CO_PHAN_CONG_CHINH_THUC)}</p>}</div></section><div className="danger-zone">{user.role === ROLES.ClubManager && !data.horse.archived && <SupportForm collapsible submitLabel={msg(MSG.BR_ARCHIVE)} title={msg(MSG.BR_ARCHIVE)} initial={{category:'LeftClub',reason:'',confirm:''}} reload={resource.reload} submit={f=>{if(f.confirm!==data.horse.name)throw Object.assign(new Error(msg(MSG.SUPPORT_CONFIRM_ERROR)),{status:400});return supportChange(`/api/horses/${supportId(id)}/archive`,{category:f.category,reason:f.reason.trim()});}} fields={[{name:'category',label:msg(MSG.BR_ARCHIVE_CATEGORY),options:archiveCategories.map(value=>({value,label:archiveLabel(value)})),required:true,help:msg(MSG.BR_ARCHIVE_HELP)},{name:'reason',label:msg(MSG.BR_REASON),multiline:true,maxLength:2000,required:true},{name:'confirm',label:msg(MSG.BR_ARCHIVE_CONFIRM),required:true}]}/>}</div></>}</section>;
}

const archiveCategories=['LeftClub','Transferred','Sold','Deceased','Other'];
const archiveLabel=value=>value?msg({LeftClub:MSG.BR_LEFT_CLUB,Transferred:MSG.BR_TRANSFERRED,Sold:MSG.BR_SOLD,Deceased:MSG.BR_DECEASED,Other:MSG.BR_OTHER}[value] || MSG.BR_OTHER):'—';
