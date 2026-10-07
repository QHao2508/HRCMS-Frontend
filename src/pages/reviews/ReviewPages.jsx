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
import { PageHeading,ResourceState,Pagination,BackLink,Field,MutationState } from "../../components/WorkflowUI.jsx";
export function ReviewList() {
    const [filter,setFilter] = useState({status:REGISTRATION_STATUS.PendingReview,page:1,pageSize:20});
    const load = useCallback(() => listRegistrations(filter),[filter]);
    const resource = useRegistrationResource(load);
    return <section><PageHeading title="Yêu cầu đăng ký ngựa" description="Kiểm tra hồ sơ trước khi phê duyệt và tạo Horse Profile." /><div className="surface-card"><div className="filter-row"><div><label className="form-label" htmlFor="review-filter">Lọc theo trạng thái</label><select id="review-filter" className="form-select" value={filter.status} onChange={e => setFilter({...filter,status:e.target.value,page:1})}>{[REGISTRATION_STATUS.PendingReview,REGISTRATION_STATUS.RevisionRequired,REGISTRATION_STATUS.Approved,REGISTRATION_STATUS.Draft,REGISTRATION_STATUS.Cancelled,""].map(status => <option key={status} value={status}>{status || "Tất cả"}</option>)}</select></div></div><ResourceState resource={resource} />{resource.data && <><div className="table-responsive"><table className="table"><thead><tr><th>Tên ngựa</th><th>Mã đăng ký</th><th>Trạng thái</th><th>Ngày tạo</th><th /></tr></thead><tbody>{resource.data.items.map(r => <tr key={r.id}><td>{r.name || "Bản nháp chưa có tên"}</td><td>{r.registrationNumber || "—"}</td><td><RegistrationStatus status={r.status} /></td><td>{r.createdAt?.slice(0,10)}</td><td><Link className="btn btn-outline-primary" to={`/reviews/${r.id}`}>Kiểm tra hồ sơ</Link></td></tr>)}</tbody></table>{!resource.data.items.length && <p className="empty-state">Không có hồ sơ ở trạng thái này.</p>}</div><Pagination data={resource.data} onChange={page => setFilter({...filter,page})} /></>}</div></section>;
}
function ReviewContent({ data,reload }) {
    const [record,setRecord] = useState(data.record);
    const [horseId,setHorseId] = useState(null);
    const [admin,setAdmin] = useState({name:record.name || "",registrationNumber:record.registrationNumber || "",boardingStart:record.boardingStart || "",boardingEnd:record.boardingEnd || ""});
    const [reason,setReason] = useState("");
    const mutation = useMutation();
    const pending = record.status === REGISTRATION_STATUS.PendingReview;
    const locked = mutation.pending || mutation.uncertain;
    function change(e) { setAdmin({...admin,[e.target.name]:e.target.value}); }
    async function save(e) { e.preventDefault(); if (!pending) return; await mutation.run(() => editAdministrativeRegistration(record.id,Object.fromEntries(Object.entries(admin).map(([k,v]) => [k,v || null]))),updated => setRecord(updated)); }
    async function review(approve) { if (!pending || (!approve && !reason.trim())) return; await mutation.run(() => reviewRegistration(record.id,{approve,...(!approve && {reason:reason.trim()})}),response => { setRecord(response.registration); setHorseId(response.horseId); },approve ? "Đã phê duyệt và tạo hồ sơ ngựa." : "Đã gửi yêu cầu chỉnh sửa cho chủ sở hữu."); }
    return <><PageHeading title={`Kiểm tra hồ sơ — ${record.name || "Chưa có tên"}`} action={<RegistrationStatus status={record.status} />} /><MutationState mutation={mutation} reload={reload} />{horseId && <Link className="btn btn-success mb-3" to={`/horses/${horseId}`}>Mở hồ sơ ngựa và phân công nhân sự</Link>}<RegistrationSummary record={record} /><RegistrationAttachments registrationId={record.id} attachments={data.attachments} editable={false} busy={locked} />
        {pending && <><section className="surface-card"><h2>Thông tin quản lý</h2><form onSubmit={save}><fieldset disabled={locked}><div className="row g-3"><Field label="Tên ngựa" name="name" value={admin.name} onChange={change} required maxLength={200} /><Field label="Mã đăng ký" name="registrationNumber" value={admin.registrationNumber} onChange={change} maxLength={100} /><Field label="Bắt đầu lưu trú" name="boardingStart" value={admin.boardingStart} onChange={change} type="date" required /><Field label="Kết thúc lưu trú" name="boardingEnd" value={admin.boardingEnd} onChange={change} type="date" /></div><button className="btn btn-outline-primary mt-3" type="submit">Lưu thông tin quản lý</button></fieldset></form></section><section className="surface-card"><h2>Quyết định duyệt hồ sơ</h2><label className="form-label" htmlFor="revision-reason">Lý do yêu cầu chỉnh sửa</label><textarea id="revision-reason" className="form-control mb-3" rows={3} maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} disabled={locked} /><div className="inline-actions"><button className="btn btn-outline-primary" disabled={locked || !reason.trim()} onClick={() => review(false)}>Yêu cầu chỉnh sửa</button><button className="btn btn-success" disabled={locked} onClick={() => review(true)}>Phê duyệt hồ sơ</button></div></section></>}
    </>;
}
export function ReviewDetail() {
    const {id} = useParams();
    const load = useCallback(async () => ({record:await getRegistration(id),attachments:await listAttachments(id)}),[id]);
    const resource = useRegistrationResource(load);
    return <section><BackLink to="/reviews">Danh sách chờ duyệt</BackLink><ResourceState resource={resource} />{resource.data && <ReviewContent key={id} data={resource.data} reload={resource.reload} />}</section>;
}
