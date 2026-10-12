import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg } from "../../messages/index.js";
import { REGISTRATION_STATUS } from "../../constants/registration.js";
import { useMutation } from "../../context/useMutation.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listRegistrations, getRegistration } from "../../services/registrationService.js";
import { reviewRegistration, editAdministrativeRegistration } from "../../services/clubService.js";
import { listAttachments } from "../../services/registrationAttachments.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import RegistrationStatus from "../../components/registrations/RegistrationStatus.jsx";
import RegistrationAttachments from "../../components/registrations/RegistrationAttachments.jsx";
import { RegistrationSummary } from "../../components/registrations/RegistrationWizard.jsx";
import { PageHeading,ResourceState,Pagination,BackLink,Field,MutationState } from "../../components/WorkflowUI.jsx";

function ReviewDecisionDialog({ approve, busy, error, reason, record, onConfirm, onClose }) {
    const dialog = useRef(null);
    useEffect(() => {
        const element = dialog.current;
        element?.showModal();
        return () => { if (element?.open) element.close(); };
    }, []);
    return <dialog ref={dialog} className="flow-one-dialog" aria-labelledby="review-decision-title"
        onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
        <h2 id="review-decision-title">{approve ? msg(MSG.PHE_DUYET_HO_SO) : msg(MSG.YEU_CAU_CHINH_SUA)}</h2>
        <dl className="summary-grid"><div><dt>{msg(MSG.TEN_NGUA)}</dt><dd>{record.name || msg(MSG.CHUA_CO_TEN)}</dd></div><div><dt>{msg(MSG.MA_DANG_KY)}</dt><dd>{record.registrationNumber || "—"}</dd></div></dl>
        {!approve && <p><strong>{msg(MSG.LY_DO_YEU_CAU_CHINH_SUA)}</strong> {reason}</p>}
        {error && <p className="alert alert-danger" role="alert">{error.message}</p>}
        <div className="inline-actions">
            <button className="btn btn-outline-primary" type="button" disabled={busy} onClick={onClose}>{msg(MSG.HUY)}</button>
            <button className="btn btn-success" type="button" disabled={busy} onClick={onConfirm}>{msg(MSG.XAC_NHAN)}</button>
        </div>
    </dialog>;
}
/**
 * Lọc/phân trang intake cho quản lý và dẫn tới màn hình kiểm tra hồ sơ.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function ReviewList() {
    const [filter,setFilter] = useState({status:REGISTRATION_STATUS.PendingReview,page:1,pageSize:20});
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(() => listRegistrations(filter),[filter]);
    const resource = useRegistrationResource(load, { realtime: true });
    return <section className="flow-one-page"><PageHeading title={msg(MSG.YEU_CAU_DANG_KY_NGUA)} description={msg(MSG.KIEM_TRA_HO_SO_TRUOC_KHI_PHE_DUYET_VA_TAO_HORSE_PROFILE)} /><div className="surface-card"><div className="filter-row"><div><label className="form-label" htmlFor="review-filter">{msg(MSG.LOC_THEO_TRANG_THAI)}</label><select id="review-filter" className="form-select" value={filter.status} onChange={e => setFilter({...filter,status:e.target.value,page:1})}>{[REGISTRATION_STATUS.PendingReview,REGISTRATION_STATUS.RevisionRequired,REGISTRATION_STATUS.Approved,REGISTRATION_STATUS.Draft,REGISTRATION_STATUS.Cancelled,""].map(status => <option key={status} value={status}>{status ? getEnumLabel(status) : msg(MSG.TAT_CA)}</option>)}</select></div></div><ResourceState resource={resource} />{resource.data && <><div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.TEN_NGUA)}</th><th>{msg(MSG.MA_DANG_KY)}</th><th>{msg(MSG.TRANG_THAI)}</th><th>{msg(MSG.NGAY_TAO)}</th><th /></tr></thead><tbody>{resource.data.items.map(r => <tr key={r.id}><td>{r.name || msg(MSG.BAN_NHAP_CHUA_CO_TEN)}</td><td>{r.registrationNumber || "—"}</td><td><RegistrationStatus status={r.status} /></td><td>{r.createdAt?.slice(0,10)}</td><td><Link className="btn btn-outline-primary" to={`/reviews/${r.id}`}>{msg(MSG.KIEM_TRA_HO_SO)}</Link></td></tr>)}</tbody></table>{!resource.data.items.length && <p className="empty-state">{msg(MSG.KHONG_CO_HO_SO_O_TRANG_THAI_NAY)}</p>}</div><Pagination data={resource.data} onChange={page => setFilter({...filter,page})} /></>}</div></section>;
}
/**
 * Render thông tin và tài liệu intake, sửa trường hành chính, phê duyệt hoặc yêu cầu chỉnh sửa có lý do.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { data,reload }. Các props/callback lấy từ caller.
 */
function ReviewContent({ data,reload }) {
    const [record,setRecord] = useState(data.record);
    const [horseId,setHorseId] = useState(null);
    const [admin,setAdmin] = useState({name:record.name || "",registrationNumber:record.registrationNumber || "",boardingStart:record.boardingStart || "",boardingEnd:record.boardingEnd || ""});
    const [reason,setReason] = useState("");
    const [decision,setDecision] = useState(null);
    const mutation = useMutation();
    const pending = record.status === REGISTRATION_STATUS.PendingReview;
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
    async function save(e) { e.preventDefault(); if (!pending) return; await mutation.run(() => editAdministrativeRegistration(record.id,Object.fromEntries(Object.entries(admin).map(([k,v]) => [k,v || null]))),updated => setRecord(updated)); }
    /**
     * Gửi quyết định duyệt/yêu cầu chỉnh sửa của quản lý và tải trạng thái/hồ sơ ngựa thật sau response.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     * @param approve Giá trị approve truyền vào review; tham chiếu phần thân để xem cách dùng.
     */
    async function review(approve) { if (!pending || (!approve && !reason.trim())) return; const succeeded = await mutation.run(() => reviewRegistration(record.id,{approve,...(!approve && {reason:reason.trim()})}),response => { setRecord(response.registration); setHorseId(response.horseId); },approve ? msg(MSG.DA_PHE_DUYET_VA_TAO_HO_SO_NGUA) : msg(MSG.DA_GUI_YEU_CAU_CHINH_SUA_CHO_CHU_SO_HUU)); if (succeeded) setDecision(null); }
    return <><PageHeading title={msg(MSG.KIEM_TRA_HO_SO_2, { p0: record.name || msg(MSG.CHUA_CO_TEN) })} action={<RegistrationStatus status={record.status} />} /><MutationState mutation={mutation} reload={reload} />{horseId && <Link className="btn btn-success mb-3" to={`/horses/${horseId}`}>{msg(MSG.MO_HO_SO_NGUA_VA_PHAN_CONG_NHAN_SU)}</Link>}<RegistrationSummary record={record} /><RegistrationAttachments registrationId={record.id} attachments={data.attachments} editable={false} busy={locked} />
        {pending && <><section className="surface-card"><h2>{msg(MSG.THONG_TIN_QUAN_LY)}</h2><form onSubmit={save}><fieldset disabled={locked}><div className="row g-3"><Field label={msg(MSG.TEN_NGUA)} name="name" value={admin.name} onChange={change} required maxLength={200} /><Field label={msg(MSG.MA_DANG_KY)} name="registrationNumber" value={admin.registrationNumber} onChange={change} maxLength={100} /><Field label={msg(MSG.BAT_DAU_LUU_TRU)} name="boardingStart" value={admin.boardingStart} onChange={change} type="date" required /><Field label={msg(MSG.KET_THUC_LUU_TRU)} name="boardingEnd" value={admin.boardingEnd} onChange={change} type="date" /></div><button className="btn btn-outline-primary mt-3" type="submit">{msg(MSG.LUU_THONG_TIN_QUAN_LY)}</button></fieldset></form></section><section className="surface-card"><h2>{msg(MSG.QUYET_DINH_DUYET_HO_SO)}</h2><label className="form-label" htmlFor="revision-reason">{msg(MSG.LY_DO_YEU_CAU_CHINH_SUA)}</label><textarea id="revision-reason" className="form-control mb-3" rows={3} maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} disabled={locked} /><div className="inline-actions"><button className="btn btn-outline-primary" disabled={locked || !reason.trim()} onClick={() => setDecision(false)}>{msg(MSG.YEU_CAU_CHINH_SUA)}</button><button className="btn btn-success" disabled={locked} onClick={() => setDecision(true)}>{msg(MSG.PHE_DUYET_HO_SO)}</button></div></section></>}
        {decision !== null && <ReviewDecisionDialog approve={decision} busy={locked} error={mutation.error} reason={reason} record={record} onConfirm={() => review(decision)} onClose={() => setDecision(null)} />}
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
    const load = useCallback(async () => ({record:await getRegistration(id),attachments:await listAttachments(id)}),[id]);
    const resource = useRegistrationResource(load);
    return <section className="flow-one-page"><BackLink to="/reviews">{msg(MSG.DANH_SACH_CHO_DUYET)}</BackLink><ResourceState resource={resource} />{resource.data && <ReviewContent key={id} data={resource.data} reload={resource.reload} />}</section>;
}
