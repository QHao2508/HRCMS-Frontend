import { Plus, Search, TriangleAlert } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { DataTable, FilterChips, Pagination } from '../../components/ui/DataTable.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { KeyValueList } from '../../components/ui/KeyValueList.jsx';
import { listSessions } from '../../services/trainingService.js';
import { restrictionText } from '../../services/restrictionText.js';
import { can, PERMISSIONS } from '../../constants/permissions.js';
import { clubTime } from '../../services/displayDate.js';
import { ageInYears, relativeClubDay } from '../../utils/clubDay.js';
import { HEALTH_ORDER, healthTone } from '../../utils/statusTone.js';
import '../../style/horses.css';
import Drawer from '../../components/ui/Drawer.jsx';
import { displayDate } from '../../services/displayDate.js';
import HorsePhoto from '../../components/HorsePhoto.jsx';
import { useListFilters } from '../../context/useListFilters.js';
import { systemRegistrationCode } from "../../services/horseIdentifiers.js";
import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg } from "../../messages/index.js";

import HorseTrainingAvailability from '../../components/HorseTrainingAvailability.jsx';
import AssignmentForm from './AssignmentForm.jsx';
import { ROLES } from "../../constants/roles.js";
import { isAssigned } from "../../services/workflowHelpers.js";
import { useCallback, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { listHorses,getHorse,horseSummary } from "../../services/clubService.js";
import { SupportForm } from '../../components/SupportUI.jsx';
import { HorseHealthPanel, HorseMeasurements } from '../../components/HorseHealthPanel.jsx';
import { change as supportChange, id as supportId, read as supportRead } from '../../services/supportService.js';
import { ResourceState,BackLink } from "../../components/WorkflowUI.jsx";
/**
 * Danh sách ngựa (#11): tìm, lọc giống / chuồng / sức khỏe, bảng có chuồng, HLV và buổi tập kế tiếp.
 * Bộ lọc nằm trên URL để giữ khi mở hồ sơ rồi quay lại. Cột cần dữ liệu backend mới tự ẩn khi API cũ chưa trả.
 */
export function HorseList() {
    const {user}=useAuth(); const owner = user.role === ROLES.HorseOwner;
    const [filter,setFilter] = useListFilters({page:1,pageSize:20,search:"",healthStatus:"",breed:"",stallId:""});
    const load = useCallback(() => listHorses({...filter, healthStatus: filter.healthStatus || undefined, breed: filter.breed || undefined, stallId: filter.stallId || undefined}),[filter]);
    const resource = useRegistrationResource(load, { realtime: true });
    const loadSummary = useCallback(() => horseSummary().catch(() => null), []);
    const summary = useRegistrationResource(loadSummary, { realtime: true }).data;
    const health = summary?.health || {};
    const allCount = HEALTH_ORDER.reduce((sum, key) => sum + (health[key] || 0), 0);
    const items = resource.data?.items || [];
    const enriched = items.some(horse => Object.hasOwn(horse, 'stallName'));
    const filtered = Boolean(filter.search || filter.healthStatus || filter.breed || filter.stallId);
    const update = values => setFilter({...filter, ...values, page:1});
    const columns = [
        {key:'name',label:msg(MSG.HL_COL_HORSE),render:horse => <Link className="hl-horse" to={`/horses/${encodeURIComponent(horse.id)}`}><Avatar name={horse.name} /><span><strong>{horse.name}</strong><small>{systemRegistrationCode(horse) || '—'}</small></span></Link>},
        {key:'breed',label:msg(MSG.HL_COL_BREED_AGE),render:horse => breedAge(horse)},
        ...(enriched ? [{key:'stall',label:msg(MSG.HL_STALL),render:horse => horse.stallName || '—'},
            {key:'trainer',label:msg(MSG.HL_COL_TRAINER),render:horse => horse.leadTrainerName || <span className="hl-muted">{msg(MSG.HL_NO_TRAINER)}</span>}] : []),
        {key:'health',label:msg(MSG.SUC_KHOE),render:horse => <StatusBadge tone={healthTone(horse.healthStatus)} dot>{getEnumLabel(horse.healthStatus)}</StatusBadge>},
        ...(enriched ? [{key:'next',label:msg(MSG.HL_COL_NEXT),nowrap:true,render:horse => horse.nextSessionAt ? <time dateTime={horse.nextSessionAt}>{nextSession(horse.nextSessionAt)}</time> : <span className="hl-muted">{'—'}</span>}] : []),
        {key:'open',label:<span className="visually-hidden">{msg(MSG.SUPPORT_ACTIONS)}</span>,align:'end',render:horse => <Link className="btn btn-outline-primary btn-sm" to={`/horses/${encodeURIComponent(horse.id)}`}>{msg(MSG.XEM_HO_SO)}</Link>},
    ];
    return <section className="hl">
        <PageHeader title={msg(owner ? MSG.NGUA_CUA_TOI : MSG.HORSES_LABEL)} description={resource.data ? msg(MSG.HL_SUBTITLE, {count: resource.data.total ?? items.length}) : msg(MSG.HO_SO_NGUA_TRONG_PHAM_VI_SO_HUU_HOAC_PHAN_CONG_CUA_BAN)}
            actions={owner && <Link className="btn btn-primary" to="/registrations/new"><Plus size={16} aria-hidden="true" />{msg(MSG.HL_NEW_REGISTRATION)}</Link>} />
        <div className="hc-card is-flush hl-card">
            <form className="hc-toolbar hl-toolbar" role="search" onSubmit={event=>{event.preventDefault();update({search:String(new FormData(event.currentTarget).get('search') || '').trim()});}}>
                <label className="hl-search" htmlFor="horse-search"><Search size={16} aria-hidden="true" /><span className="visually-hidden">{msg(MSG.HL_SEARCH_LABEL)}</span>
                    <input type="search" id="horse-search" name="search" key={filter.search} defaultValue={filter.search} placeholder={msg(MSG.HL_SEARCH_PLACEHOLDER)} maxLength={100}/></label>
                <button className="btn btn-primary" type="submit">{msg(MSG.SEARCH_ACTION)}</button>
                {summary?.breeds?.length > 0 && <label className="hl-select">{msg(MSG.HL_BREED)}<select className="form-select" value={filter.breed} onChange={event => update({breed:event.target.value})}><option value="">{msg(MSG.TAT_CA)}</option>{summary.breeds.map(breed => <option key={breed} value={breed}>{breed}</option>)}</select></label>}
                {summary?.stalls?.length > 0 && <label className="hl-select">{msg(MSG.HL_STALL)}<select className="form-select" value={filter.stallId} onChange={event => update({stallId:event.target.value})}><option value="">{msg(MSG.TAT_CA)}</option>{summary.stalls.map(stall => <option key={stall.id} value={stall.id}>{stall.name}</option>)}</select></label>}
            </form>
            <div className="hl-chips"><FilterChips label={msg(MSG.HL_HEALTH_FILTER)} value={filter.healthStatus} onChange={healthStatus => update({healthStatus})}
                options={[{value:'',label:msg(MSG.TAT_CA),count:summary ? allCount : null}, ...HEALTH_ORDER.map(key => ({value:key,label:getEnumLabel(key),dot:healthTone(key),count:summary ? health[key] || 0 : null}))]} /></div>
            <ResourceState resource={resource} />
            {resource.data && <>
                <DataTable caption={msg(MSG.HORSES_LABEL)} columns={columns} rows={items}
                    empty={<EmptyState title={msg(filtered ? MSG.HL_EMPTY_FILTERED : MSG.CHUA_CO_NGUA_TRONG_PHAM_VI_CUA_BAN)} action={filtered && <button type="button" className="btn btn-outline-primary" onClick={() => setFilter({page:1,pageSize:filter.pageSize,search:'',healthStatus:'',breed:'',stallId:''})}>{msg(MSG.HL_CLEAR_FILTERS)}</button>} />} />
                <Pagination page={resource.data.page} pageSize={resource.data.pageSize} total={resource.data.total} onChange={page => setFilter({...filter,page})} />
            </>}
        </div>
    </section>;
}

function breedAge(horse) {
    const age = ageInYears(horse.dateOfBirth);
    if (age === null) return horse.breed || '—';
    return horse.breed ? msg(MSG.HL_BREED_AGE, {breed: horse.breed, age}) : msg(MSG.HL_AGE, {age});
}

function nextSession(value) {
    const day = relativeClubDay(value); const time = clubTime(value);
    return day === 'today' ? msg(MSG.HL_TODAY_AT, {time}) : day === 'tomorrow' ? msg(MSG.HL_TOMORROW_AT, {time}) : msg(MSG.HL_DATE_AT, {date: displayDate(value), time});
}
/**
 * Tải ảnh ngựa qua endpoint kiểm phạm vi và tạo object URL; không dùng trực tiếp blob private.
 * Object URL chỉ là tài nguyên bộ nhớ browser; được revoke khi không còn dùng.
 * Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { id }. Các props/callback lấy từ caller.
 */
/**
 * Hồ sơ ngựa (#12): phần đầu có ảnh, trạng thái, mã, thao tác chính và chỉ số nhanh; nội dung chia tab giữ trên URL (?tab=).
 * Chỉ đổi phần trình bày: phân công, số đo, sức khỏe, lưu trữ vẫn dùng đúng component và API cũ.
 */
export function HorseDetail() {
    const {id} = useParams();
    const {user} = useAuth();
    const [params, setParams] = useSearchParams();
    const [assigning, setAssigning] = useState(false);
    // Backend trả sẵn tên nhân sự (staffNames) trong hồ sơ ngựa: một request, không cần gọi danh bạ.
    const load = useCallback(() => getHorse(id),[id]);
    const resource = useRegistrationResource(load);
    const data = resource.data && {...resource.data, staffNames: resource.data.staffNames || {}};
    const tab = detailTabs.includes(params.get('tab')) ? params.get('tab') : 'overview';
    const selectTab = next => setParams(previous => { const search = new URLSearchParams(previous); if (next === 'overview') search.delete('tab'); else search.set('tab', next); return search; }, { replace: true });
    const back = msg(user.role===ROLES.HorseOwner?MSG.NGUA_CUA_TOI:MSG.HORSES_LABEL);
    if (!data) return <section className="hd"><BackLink to="/horses">{back}</BackLink><ResourceState resource={resource} /></section>;
    const horse = data.horse;
    const canAssign = !horse.archived && (user.role === ROLES.ClubManager || isAssigned(data,user,ROLES.HeadTrainer));
    const training = PERMISSIONS.trainingMenu.includes(user.role);
    const age = ageInYears(horse.dateOfBirth);
    const facts = [[msg(MSG.HD_FACT_AGE), age ?? '—'], [msg(MSG.GIOI_TINH), getEnumLabel(horse.gender) || '—'],
        [msg(MSG.HD_FACT_HEIGHT), data.latestMeasurement ? msg(MSG.HEIGHT_VALUE, { value: data.latestMeasurement.heightCm }) : '—'],
        [msg(MSG.HD_FACT_WEIGHT), data.latestMeasurement ? msg(MSG.WEIGHT_VALUE, { value: data.latestMeasurement.weightKg }) : '—'],
        ...(Object.hasOwn(horse, 'stallName') ? [[msg(MSG.HL_STALL), horse.stallName || '—']] : [])];
    const tabs = [{id:'overview',label:msg(MSG.TONG_QUAN)},{id:'health',label:msg(MSG.UX_HEALTH)},{id:'measurements',label:msg(MSG.UX_MEASUREMENTS)},{id:'people',label:msg(MSG.UX_PEOPLE)},
        ...(training ? [{id:'training',label:msg(MSG.HUAN_LUYEN),to:`/training/plans?horseId=${encodeURIComponent(id)}`}] : [])];
    return <section className="hd">
        <BackLink to="/horses">{back}</BackLink>
        <section className="hc-card hd-hero" aria-labelledby="horse-title">
            <div className="hd-hero-row">
                <div className="hd-photo"><HorsePhoto key={id} id={id} name={horse.name} metadata={data.photo} /></div>
                <div className="hd-hero-main">
                    <div className="hd-title-row"><h1 id="horse-title">{horse.name}</h1>
                        <StatusBadge tone={healthTone(horse.healthStatus)} dot>{getEnumLabel(horse.healthStatus)}</StatusBadge>
                        {horse.archived && <StatusBadge>{msg(MSG.HD_ARCHIVED)}</StatusBadge>}</div>
                    <p className="hd-ids">{msg(MSG.HD_ID_LINE_SYSTEM)}{' '}<strong>{systemRegistrationCode(horse) || '—'}</strong>{' · '}{msg(MSG.HD_ID_LINE_DOCUMENT)}{' '}<strong>{horse.externalRegistrationNumber || msg(MSG.HORSE_EXTERNAL_MISSING)}</strong></p>
                    <div className="hd-actions">
                        {!horse.archived && user.role === ROLES.Trainer && <Link className="btn btn-primary" to={`/training/plans/new?horseId=${encodeURIComponent(id)}`}>{msg(MSG.HD_PLAN_TRAINING)}</Link>}
                        {!horse.archived && can(user, 'incidentReport') && <Link className="btn btn-outline-primary" to="/care/incidents">{msg(MSG.HD_REPORT_INCIDENT)}</Link>}
                        {canAssign && <button type="button" className="btn btn-outline-primary" aria-haspopup="dialog" onClick={() => setAssigning(true)}>{msg(user.role === ROLES.ClubManager ? MSG.PHAN_CONG_NHAN_SU_CHINH_THUC : MSG.CHON_TRAINER_PHU_TRACH)}</button>}
                    </div>
                </div>
                <dl className="hd-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            </div>
            <Tabs label={msg(MSG.HO_SO_NGUA)} tabs={tabs} active={tab} onChange={selectTab} />
        </section>
        <RestrictionAlert horseId={id} user={user} onOpen={() => selectTab('health')} />
        <Drawer open={assigning} title={horse.name} size="lg" onClose={() => setAssigning(false)}><AssignmentForm key={`${id}-${user.id}`} horse={data} user={user} reload={() => { setAssigning(false); resource.reload(); }} /></Drawer>

        {tab === 'overview' && <div className="hd-columns">
            <div className="hd-main">
                <Card title={msg(MSG.THONG_TIN_NGUA)}>
                    <KeyValueList items={[[msg(MSG.HORSE_SYSTEM_CODE), systemRegistrationCode(horse)], [msg(MSG.HORSE_EXTERNAL_CODE), horse.externalRegistrationNumber || msg(MSG.HORSE_EXTERNAL_MISSING)],
                        [msg(MSG.GIONG), horse.breed], [msg(MSG.NGAY_SINH), displayDate(horse.dateOfBirth)], [msg(MSG.GIOI_TINH), getEnumLabel(horse.gender)],
                        [msg(MSG.SIRE_BO), horse.sire], [msg(MSG.DAM_ME), horse.dam],
                        [msg(MSG.CHIEU_CAO_GAN_NHAT), data.latestMeasurement ? msg(MSG.HEIGHT_VALUE, { value: data.latestMeasurement.heightCm }) : null],
                        [msg(MSG.CAN_NANG_GAN_NHAT), data.latestMeasurement ? msg(MSG.WEIGHT_VALUE, { value: data.latestMeasurement.weightKg }) : null]]} />
                </Card>
                {horse.archived && <Card title={msg(MSG.BR_ARCHIVED)}><KeyValueList columns={1} items={[[msg(MSG.BR_ARCHIVE_CATEGORY), archiveLabel(horse.archiveCategory)], [msg(MSG.BR_REASON), horse.archiveReason]]} /></Card>}
                {user.role === ROLES.ClubManager && !horse.archived && <div className="danger-zone"><SupportForm collapsible danger submitLabel={msg(MSG.BR_ARCHIVE)} title={msg(MSG.BR_ARCHIVE)} initial={{category:'LeftClub',reason:'',confirm:''}} reload={resource.reload} submit={f=>{if(f.confirm!==horse.name)throw Object.assign(new Error(msg(MSG.SUPPORT_CONFIRM_ERROR)),{status:400});return supportChange(`/api/horses/${supportId(id)}/archive`,{category:f.category,reason:f.reason.trim()});}} fields={[{name:'category',label:msg(MSG.BR_ARCHIVE_CATEGORY),options:archiveCategories.map(value=>({value,label:archiveLabel(value)})),required:true,help:msg(MSG.BR_ARCHIVE_HELP)},{name:'reason',label:msg(MSG.BR_REASON),multiline:true,maxLength:2000,required:true},{name:'confirm',label:msg(MSG.BR_ARCHIVE_CONFIRM),required:true}]}/></div>}
            </div>
            <div className="hd-side">
                <TeamCard data={data} user={user} canAssign={canAssign} onAssign={() => setAssigning(true)} />
                {training && <UpcomingCard horseId={id} />}
            </div>
        </div>}
        {tab === 'health' && <HorseHealthPanel horseId={id} user={user} />}
        {tab === 'measurements' && <HorseMeasurements horseId={id} user={user} reload={resource.reload} archived={horse.archived} />}
        {tab === 'people' && <>
            {!horse.archived && [ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer].includes(user.role) && <details className="surface-card horse-availability"><summary>{msg(MSG.SCHED_TITLE)}</summary><HorseTrainingAvailability horseId={id}/></details>}
            <Card title={msg(MSG.LICH_SU_PHAN_CONG)} flush>
                <DataTable caption={msg(MSG.LICH_SU_PHAN_CONG)} rows={data.assignments} empty={<EmptyState title={msg(MSG.CHUA_CO_PHAN_CONG_CHINH_THUC)} />} columns={[
                    {key:'role',label:msg(MSG.VAI_TRO),render:a => getEnumLabel(a.role)},
                    {key:'staff',label:msg(MSG.NHAN_SU),render:a => staffName(data, user, a)},
                    {key:'start',label:msg(MSG.BAT_DAU),render:a => displayDate(a.startDate)},
                    {key:'end',label:msg(MSG.KET_THUC),render:a => (a.endDate && displayDate(a.endDate)) || (a.active ? msg(MSG.CHUA_CO_NGAY_KET_THUC) : '—')},
                    {key:'status',label:msg(MSG.TRANG_THAI),render:a => <StatusBadge tone={a.active ? 'success' : 'neutral'}>{msg(a.active ? MSG.DANG_PHU_TRACH : MSG.DA_KET_THUC)}</StatusBadge>},
                    {key:'notes',label:msg(MSG.GHI_CHU),render:a => a.notes || '—'}]} />
            </Card>
        </>}
    </section>;
}

const detailTabs = ['overview', 'health', 'measurements', 'people'];
const staffName = (data, user, a) => a.staffId === user.id ? msg(MSG.BAN) : (data.staffNames[a.staffId] || msg(MSG.NHAN_SU_DA_KET_THUC_PHAN_CONG));

/** Nhân sự đang phụ trách (phân công còn hiệu lực), có ảnh chữ cái đầu và vai trò. */
function TeamCard({ data, user, canAssign, onAssign }) {
    const active = data.assignments.filter(a => a.active);
    return <Card title={msg(MSG.HD_TEAM)} action={canAssign && <button type="button" className="hc-link-button" aria-haspopup="dialog" onClick={onAssign}>{msg(MSG.UX_PEOPLE)}</button>}>
        {!active.length ? <p className="hd-muted">{msg(MSG.HD_TEAM_EMPTY)}</p> : <ul className="hd-team">{active.map(a => {
            const name = staffName(data, user, a);
            return <li key={a.id}><Avatar name={data.staffNames[a.staffId] || name} round /><span><strong>{name}</strong><small>{getEnumLabel(a.role)}</small></span></li>;
        })}</ul>}
    </Card>;
}

/** 4 buổi tập kế tiếp của ngựa (chưa diễn ra, chưa kết thúc), theo phạm vi API buổi tập. */
function UpcomingCard({ horseId }) {
    const load = useCallback(() => listSessions({ horseId, from: new Date().toISOString(), page: 1, pageSize: 10 }), [horseId]);
    const resource = useRegistrationResource(load, { realtime: true });
    const items = (resource.data?.items || []).filter(item => ['Planned', 'Assigned', 'InProgress'].includes(item.status))
        .sort((a, b) => String(a.scheduledAt).localeCompare(String(b.scheduledAt))).slice(0, 4);
    return <Card title={msg(MSG.HD_UPCOMING)} action={<Link to={`/training/sessions?horseId=${encodeURIComponent(horseId)}`}>{msg(MSG.DASH_SEE_ALL)}</Link>}>
        {resource.loading ? <Skeleton lines={2} /> : resource.error ? <ErrorState onRetry={resource.reload} /> : !items.length ? <p className="hd-muted">{msg(MSG.HD_UPCOMING_EMPTY)}</p>
            : <ul className="hd-upcoming">{items.map(item => <li key={item.id}>
                <span className="hd-date" aria-hidden="true">{dayMonth(item.scheduledAt)}</span>
                <Link to={`/training/sessions/${encodeURIComponent(item.id)}`}>{getEnumLabel(item.trainingType)}{' · '}{clubTime(item.scheduledAt)}</Link>
            </li>)}</ul>}
    </Card>;
}

/** Cảnh báo hạn chế vận động đang hiệu lực ngay dưới phần đầu; lỗi tải thì im lặng vì tab Sức khỏe vẫn hiện đầy đủ. */
function RestrictionAlert({ horseId, user, onOpen }) {
    const overview = can(user, 'medicalOverview');
    const load = useCallback(() => supportRead(`/api/horses/${supportId(horseId)}/medical/${overview ? 'overview' : 'summary'}`).catch(() => null), [horseId, overview]);
    const items = useRegistrationResource(load, { realtime: true }).data?.restrictions || [];
    if (!items.length) return null;
    return <div className="hd-alert" role="note"><TriangleAlert size={20} aria-hidden="true" />
        <div><strong>{msg(MSG.HD_RESTRICTION_TITLE)}</strong>
            <ul>{items.map(r => <li key={r.id}>{restrictionText(r) || msg(MSG.HD_RESTRICTED)}{r.reason && ` — ${r.reason}`}{' ('}{msg(MSG.HMED_UNTIL, { value: r.validUntil ? displayDate(r.validUntil) : msg(MSG.HMED_NO_END) })}{')'}</li>)}</ul></div>
        <button type="button" className="hc-link-button" onClick={onOpen}>{msg(MSG.HD_VIEW_HEALTH)}</button>
    </div>;
}

function dayMonth(value) {
    const text = displayDate(value);
    return text === '—' ? text : text.slice(0, 5);
}

const archiveCategories=['LeftClub','Transferred','Sold','Deceased','Other'];
const archiveLabel=value=>value?msg({LeftClub:MSG.BR_LEFT_CLUB,Transferred:MSG.BR_TRANSFERRED,Sold:MSG.BR_SOLD,Deceased:MSG.BR_DECEASED,Other:MSG.BR_OTHER}[value] || MSG.BR_OTHER):'—';
