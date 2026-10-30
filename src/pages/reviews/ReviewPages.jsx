import { useListFilters } from '../../context/useListFilters.js';
import { useUnsavedChanges } from '../../context/useUnsavedChanges.js';
import { externalRegistrationNumber } from "../../services/horseIdentifiers.js";
import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg } from "../../messages/index.js";
import { REGISTRATION_STATUS } from "../../constants/registration.js";
import { useMutation } from "../../context/useMutation.js";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listRegistrations, getRegistration } from "../../services/registrationService.js";
import { reviewRegistration, editAdministrativeRegistration } from "../../services/clubService.js";
import { listAttachments } from "../../services/registrationAttachments.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import RegistrationStatus from "../../components/registrations/RegistrationStatus.jsx";
import RegistrationAttachments from "../../components/registrations/RegistrationAttachments.jsx";
import { RegistrationSummary } from "../../components/registrations/RegistrationWizard.jsx";
import { ResourceState,Pagination,BackLink,Field,MutationState } from "../../components/WorkflowUI.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import { DataTable } from "../../components/ui/DataTable.jsx";
import { EmptyState } from "../../components/ui/States.jsx";
import { displayDate } from "../../services/displayDate.js";
import '../../style/lists.css';
import '../../style/registration-review.css';
function registrationOwnerName(record) {
    return typeof record.ownerName === 'string' && record.ownerName.trim() ? record.ownerName : msg(MSG.REVIEW_OWNER_MISSING);
}
/**
 * Lọc/phân trang intake cho quản lý và dẫn tới màn hình kiểm tra hồ sơ.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function ReviewList() {
    const [filter,setFilter] = useListFilters({status:REGISTRATION_STATUS.PendingReview,page:1,pageSize:20});
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(() => listRegistrations(filter),[filter]);
    const resource = useRegistrationResource(load, { realtime: true });
    const open = r => `/reviews/${encodeURIComponent(r.id)}`;
    return <section className="review-page list-page"><PageHeader title={msg(MSG.YEU_CAU_DANG_KY_NGUA)} description={msg(MSG.KIEM_TRA_HO_SO_TRUOC_KHI_PHE_DUYET_VA_TAO_HORSE_PROFILE)} />
        <div className="hc-card is-flush list-card">
            <div className="hc-toolbar"><label className="list-select" htmlFor="review-filter">{msg(MSG.LOC_THEO_TRANG_THAI)}<select id="review-filter" className="form-select" value={filter.status} onChange={e => setFilter({...filter,status:e.target.value,page:1})}>{[REGISTRATION_STATUS.PendingReview,REGISTRATION_STATUS.RevisionRequired,REGISTRATION_STATUS.Approved,REGISTRATION_STATUS.Draft,REGISTRATION_STATUS.Cancelled,""].map(status => <option key={status} value={status}>{status ? getEnumLabel(status) : msg(MSG.TAT_CA)}</option>)}</select></label></div>
            <ResourceState resource={resource} />
            {resource.data && <><DataTable caption={msg(MSG.YEU_CAU_DANG_KY_NGUA)} rows={resource.data.items} empty={<EmptyState title={msg(MSG.KHONG_CO_HO_SO_O_TRANG_THAI_NAY)} />} columns={[
                {key:'name',label:msg(MSG.TEN_NGUA),render:r => <Link className="hc-row-title" to={open(r)}><Avatar name={r.name || '?'} /><span><strong>{r.name || msg(MSG.BAN_NHAP_CHUA_CO_TEN)}</strong></span></Link>},
                {key:'owner',label:msg(MSG.HORSE_OWNER),render:r => registrationOwnerName(r)},
                {key:'code',label:msg(MSG.HORSE_EXTERNAL_CODE),render:r => externalRegistrationNumber(r) || '—'},
                {key:'status',label:msg(MSG.TRANG_THAI),render:r => <RegistrationStatus status={r.status} />},
                {key:'created',label:msg(MSG.NGAY_TAO),nowrap:true,render:r => displayDate(r.createdAt)},
                {key:'open',label:<span className="visually-hidden">{msg(MSG.SUPPORT_ACTIONS)}</span>,align:'end',render:r => <Link className="btn btn-outline-primary btn-sm" to={open(r)}>{msg(MSG.KIEM_TRA_HO_SO)}</Link>}]} />
            <Pagination data={resource.data} onChange={page => setFilter({...filter,page})} /></>}
        </div></section>;
}
/**
 * Render thông tin và tài liệu intake, sửa trường hành chính, phê duyệt hoặc yêu cầu chỉnh sửa có lý do.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { data,reload }. Các props/callback lấy từ caller.
 */
function ReviewContent({ data,reload }) {
    const [record,setRecord] = useState(data.record);
    const [horseId,setHorseId] = useState(null);
    const [admin,setAdmin] = useState({name:record.name || "",externalRegistrationNumber:externalRegistrationNumber(record),boardingStart:record.boardingStart || "",boardingEnd:record.boardingEnd || ""});
    const [reason,setReason] = useState("");
    const mutation = useMutation();
    const pending = record.status === REGISTRATION_STATUS.PendingReview;
    const savedAdmin = {name:record.name || "",externalRegistrationNumber:externalRegistrationNumber(record),boardingStart:record.boardingStart || "",boardingEnd:record.boardingEnd || ""};
    const dirty = JSON.stringify(admin) !== JSON.stringify(savedAdmin);
    useUnsavedChanges(dirty || !!reason);
    const locked = mutation.pending || mutation.uncertain;
    /**
     * Cập nhật form theo name/value và reset lựa chọn phụ thuộc khi cần, không tự sửa dữ liệu server.
     * @param e Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm.
     */
    function change(e) { setAdmin({...admin,[e.target.name]:e.target.value}); }
    /**
     * Kiểm dữ liệu hiện có, lưu qua API và dùng ID/response thật để cập nhật form hoặc chuyển trang.
     * @param e Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm.
     */
    async function save(e) { e.preventDefault(); if (!pending) return; await mutation.run(() => editAdministrativeRegistration(record.id,Object.fromEntries(Object.entries(admin).map(([k,v]) => [k,k === "externalRegistrationNumber" ? v.trim() : v || null]))),updated => {setRecord(updated);setAdmin({name:updated.name || "",externalRegistrationNumber:externalRegistrationNumber(updated),boardingStart:updated.boardingStart || "",boardingEnd:updated.boardingEnd || ""});}); }
    /**
     * Gửi quyết định duyệt/yêu cầu chỉnh sửa của quản lý và tải trạng thái/hồ sơ ngựa thật sau response.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     * @param approve Giá trị approve truyền vào review; tham chiếu phần thân để xem cách dùng.
     */
    async function review(approve) { if (!pending || dirty || (!approve && !reason.trim())) return; await mutation.run(() => reviewRegistration(record.id,{approve,...(!approve && {reason:reason.trim()})}),response => { setRecord(response.registration); setHorseId(response.horseId); },approve ? msg(MSG.DA_PHE_DUYET_VA_TAO_HO_SO_NGUA) : msg(MSG.DA_GUI_YEU_CAU_CHINH_SUA_CHO_CHU_SO_HUU)); }
    return <>
        <PageHeader title={msg(MSG.KIEM_TRA_HO_SO_2, { p0: record.name || msg(MSG.CHUA_CO_TEN) })} description={<>{msg(MSG.HORSE_OWNER)}{': '}<strong>{registrationOwnerName(record)}</strong>{record.createdAt && <>{' · '}{msg(MSG.NGAY_TAO)}{' '}{displayDate(record.createdAt)}</>}</>} actions={<RegistrationStatus status={record.status} />} />
        <MutationState mutation={mutation} reload={reload} />{horseId && <Link className="btn btn-success align-self-start" to={`/horses/${horseId}`}>{msg(MSG.MO_HO_SO_NGUA_VA_PHAN_CONG_NHAN_SU)}</Link>}
        <div className="review-layout">
            <div className="review-main"><RegistrationSummary record={record} /><RegistrationAttachments registrationId={record.id} attachments={data.attachments} editable={false} busy={locked} /></div>
            {pending && <aside className="review-side" aria-label={msg(MSG.QUYET_DINH_DUYET_HO_SO)}>
                <section className="hc-card"><h2 className="review-side-title">{msg(MSG.THONG_TIN_QUAN_LY)}</h2><form onSubmit={save}><fieldset disabled={locked}><div className="row g-3"><Field wide label={msg(MSG.TEN_NGUA)} name="name" value={admin.name} onChange={change} required maxLength={200} /><Field wide label={msg(MSG.HORSE_EXTERNAL_CODE)} name="externalRegistrationNumber" value={admin.externalRegistrationNumber} onChange={change} maxLength={100} /><Field label={msg(MSG.BAT_DAU_LUU_TRU)} name="boardingStart" value={admin.boardingStart} onChange={change} type="date" required /><Field label={msg(MSG.KET_THUC_LUU_TRU)} name="boardingEnd" value={admin.boardingEnd} onChange={change} type="date" /></div><button className="btn btn-outline-primary mt-3 w-100" type="submit">{msg(MSG.LUU_THONG_TIN_QUAN_LY)}</button></fieldset></form></section>
                <section className="hc-card review-decision"><h2 className="review-side-title">{msg(MSG.QUYET_DINH_DUYET_HO_SO)}</h2>{dirty && <p className="alert alert-warning" role="status">{msg(MSG.UX_REVIEW_DIRTY)}</p>}<label className="form-label" htmlFor="revision-reason">{msg(MSG.LY_DO_YEU_CAU_CHINH_SUA)}</label><textarea id="revision-reason" className="form-control mb-3" rows={3} maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} disabled={locked} /><div className="review-decision-actions"><button className="btn btn-success" disabled={locked || dirty} onClick={() => review(true)}>{msg(MSG.PHE_DUYET_HO_SO)}</button><button className="btn btn-outline-primary" disabled={locked || dirty || !reason.trim()} onClick={() => review(false)}>{msg(MSG.YEU_CAU_CHINH_SUA)}</button></div></section>
            </aside>}
        </div>
    </>;
}
/**
 * Tải hồ sơ/tài liệu để quản lý duyệt, dùng trạng thái thật sau mutation.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function ReviewDetail() {
    const {id} = useParams();
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(async () => { const [record,attachments]=await Promise.all([getRegistration(id),listAttachments(id)]); return {record,attachments}; },[id]);
    const resource = useRegistrationResource(load);
    return <section className="review-page review-detail"><BackLink to="/reviews">{msg(MSG.DANH_SACH_CHO_DUYET)}</BackLink><ResourceState resource={resource} />{resource.data && <ReviewContent key={id} data={resource.data} reload={resource.reload} />}</section>;
}
