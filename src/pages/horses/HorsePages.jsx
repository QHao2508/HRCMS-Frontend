import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg } from "../../messages/index.js";
import { ROLES } from "../../constants/roles.js";
import { isAssigned,clubToday } from "../../services/workflowHelpers.js";
import { useMutation } from "../../context/useMutation.js";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { listHorses,getHorse,assignStaff,staffDirectory,fetchHorsePhoto } from "../../services/clubService.js";
import { PageHeading,ResourceState,Pagination,BackLink,StateBadge,Field,MutationState} from "../../components/WorkflowUI.jsx";
/**
 * Tải/lọc/phân trang ngựa trong phạm vi API cấp; trình bày sức khỏe bằng enum và liên kết hồ sơ.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function HorseList() {
    const [filter,setFilter] = useState({page:1,pageSize:20,search:""});
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(() => listHorses(filter),[filter]);
    const resource = useRegistrationResource(load);
    return <section><PageHeading title={msg(MSG.NGUA_CUA_TOI)} description={msg(MSG.HO_SO_NGUA_TRONG_PHAM_VI_SO_HUU_HOAC_PHAN_CONG_CUA_BAN)} /><div className="surface-card"><label className="form-label" htmlFor="horse-search">{msg(MSG.TIM_THEO_TEN_HOAC_MA_DANG_KY)}</label><input id="horse-search" className="form-control mb-3" value={filter.search} onChange={e => setFilter({...filter,search:e.target.value,page:1})} /><ResourceState resource={resource} />{resource.data && <><div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.TEN_NGUA)}</th><th>{msg(MSG.MA_DANG_KY)}</th><th>{msg(MSG.GIONG)}</th><th>{msg(MSG.SUC_KHOE)}</th><th /></tr></thead><tbody>{resource.data.items.map(horse => <tr key={horse.id}><td>{horse.name}</td><td>{horse.registrationNumber || "—"}</td><td>{horse.breed}</td><td><StateBadge value={horse.healthStatus} /></td><td><Link className="btn btn-outline-primary" to={`/horses/${horse.id}`}>{msg(MSG.XEM_HO_SO)}</Link></td></tr>)}</tbody></table>{!resource.data.items.length && <p className="empty-state">{msg(MSG.CHUA_CO_NGUA_TRONG_PHAM_VI_CUA_BAN)}</p>}</div><Pagination data={resource.data} onChange={page => setFilter({...filter,page})} /></>}</div></section>;
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
 * Quản lý chọn nhân sự chính thức hoặc huấn luyện viên trưởng chọn huấn luyện viên; gửi role/staff/date theo contract.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { horse,user,reload }. Các props/callback lấy từ caller.
 */
function AssignmentForm({ horse,user,reload }) {
    const roles = user.role === ROLES.ClubManager ? [ROLES.HeadTrainer,ROLES.Groom,ROLES.Veterinarian] : [ROLES.Trainer];
    const [form,setForm] = useState({role:roles[0],staffId:"",startDate:clubToday(),notes:""});
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(() => staffDirectory(form.role),[form.role]);
    const staff = useRegistrationResource(load);
    const mutation = useMutation();
    /**
     * Cập nhật form theo name/value và reset lựa chọn phụ thuộc khi cần, không tự sửa dữ liệu server.
     * @param e Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm.
     */
    function change(e) { setForm({...form,[e.target.name]:e.target.value,...(e.target.name === "role" && {staffId:""})}); }
    /**
     * Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     * @param e Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm.
     */
    async function submit(e) { e.preventDefault(); if (!form.staffId) return; await mutation.run(() => assignStaff(horse.horse.id,form),reload,msg(MSG.DA_PHAN_CONG_NHAN_SU_LICH_SU_PHAN_CONG_DUOC_GIU_LAI)); }
    return <section className="surface-card"><h2>{user.role === ROLES.ClubManager ? msg(MSG.PHAN_CONG_NHAN_SU_CHINH_THUC) : msg(MSG.CHON_TRAINER_PHU_TRACH)}</h2><p className="card-description">{user.role === ROLES.ClubManager ? msg(MSG.MANAGER_XAC_NHAN_HEADTRAINER_GROOM_VA_BAC_SI_THU_Y_HEADTRAINER_DUOC_GIAO) : msg(MSG.CHI_HEADTRAINER_DANG_PHU_TRACH_NGUA_DUOC_CHON_TRAINER)}</p><MutationState mutation={mutation} reload={reload} /><ResourceState resource={staff} /><form onSubmit={submit}><fieldset disabled={mutation.pending || mutation.uncertain || staff.loading || !!staff.error}><div className="row g-3"><Field label={msg(MSG.VAI_TRO)} name="role" value={form.role} onChange={change} options={roles} /><Field label={msg(MSG.NHAN_SU)} name="staffId" value={form.staffId} onChange={change} required options={[{value:"",label:msg(MSG.CHON_NHAN_SU)},...(staff.data || []).map(person => ({value:person.id,label:[person.firstName,person.lastName].filter(Boolean).join(" ")}))]} /><Field label={msg(MSG.NGAY_BAT_DAU)} name="startDate" value={form.startDate} onChange={change} type="date" required /><Field label={msg(MSG.GHI_CHU)} name="notes" value={form.notes} onChange={change} maxLength={2000} /></div><button className="btn btn-primary mt-3">{msg(MSG.XAC_NHAN_PHAN_CONG)}</button></fieldset></form></section>;
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
    const load = useCallback(async () => { const horse=await getHorse(id); const groups=await Promise.all([...new Set(horse.assignments.map(a=>a.role))].map(role=>staffDirectory(role))); return {...horse,staffNames:Object.fromEntries(groups.flat().map(person=>[person.id,[person.firstName,person.lastName].filter(Boolean).join(" ")]))}; },[id]);
    const resource = useRegistrationResource(load);
    const data = resource.data;
    return <section><BackLink to="/horses">{msg(MSG.NGUA_CUA_TOI)}</BackLink><ResourceState resource={resource} />{data && <><PageHeading title={data.horse.name} action={<StateBadge value={data.horse.healthStatus} />} /><nav className="section-tabs" aria-label={msg(MSG.HO_SO_NGUA)}><a href="#horse-overview">{msg(MSG.TONG_QUAN)}</a><a href="#horse-assignments">{msg(MSG.NHAN_SU)}</a>{[ROLES.HorseOwner,ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer,ROLES.WorkRider,ROLES.Veterinarian].includes(user.role) && <Link to={`/training/plans?horseId=${id}`}>{msg(MSG.HUAN_LUYEN)}</Link>}</nav><section id="horse-overview" className="surface-card"><h2>{msg(MSG.THONG_TIN_NGUA)}</h2><HorsePhoto id={id} /><dl className="summary-grid">{[[msg(MSG.MA_DANG_KY),data.horse.registrationNumber],[msg(MSG.GIONG),data.horse.breed],[msg(MSG.NGAY_SINH),data.horse.dateOfBirth],[msg(MSG.GIOI_TINH),getEnumLabel(data.horse.gender)],[msg(MSG.SIRE_BO),data.horse.sire],[msg(MSG.DAM_ME),data.horse.dam],[msg(MSG.CHIEU_CAO_GAN_NHAT),data.latestMeasurement ? msg(MSG.HEIGHT_VALUE, { value: data.latestMeasurement.heightCm }) : "—"],[msg(MSG.CAN_NANG_GAN_NHAT),data.latestMeasurement ? msg(MSG.WEIGHT_VALUE, { value: data.latestMeasurement.weightKg }) : "—"]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl></section>
        {(user.role === ROLES.ClubManager || isAssigned(data,user,ROLES.HeadTrainer)) && <AssignmentForm key={`${id}-${user.id}`} horse={data} user={user} reload={resource.reload} />}
        <section id="horse-assignments" className="surface-card"><h2>{msg(MSG.LICH_SU_PHAN_CONG)}</h2><div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.VAI_TRO)}</th><th>{msg(MSG.NHAN_SU)}</th><th>{msg(MSG.BAT_DAU)}</th><th>{msg(MSG.KET_THUC)}</th><th>{msg(MSG.TRANG_THAI)}</th><th>{msg(MSG.GHI_CHU)}</th></tr></thead><tbody>{data.assignments.map(a => <tr key={a.id}><td>{getEnumLabel(a.role)}</td><td>{a.staffId === user.id ? msg(MSG.BAN) : data.staffNames?.[a.staffId] || msg(MSG.NHAN_SU_DA_KET_THUC_PHAN_CONG)}</td><td>{a.startDate}</td><td>{a.endDate || "—"}</td><td>{a.active ? msg(MSG.DANG_PHU_TRACH) : msg(MSG.DA_KET_THUC)}</td><td>{a.notes}</td></tr>)}</tbody></table>{!data.assignments.length && <p className="empty-state">{msg(MSG.CHUA_CO_PHAN_CONG_CHINH_THUC)}</p>}</div></section></>}</section>;
}
