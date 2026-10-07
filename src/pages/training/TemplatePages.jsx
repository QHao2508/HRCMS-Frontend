import { getEnumLabel } from "../../constants/enumLabels.js";
import { MSG, msg } from "../../messages/index.js";
import { INTENSITY } from "../../constants/training.js";
import { ROLES } from "../../constants/roles.js";
import { useMutation } from "../../context/useMutation.js";
import { useCallback, useState } from "react";
import { useAuth } from "../../context/useAuth.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { listTemplates,createTemplate,editTemplate,archiveTemplate } from "../../services/trainingService.js";
import { PageHeading,ResourceState,Pagination,Field,MutationState } from "../../components/WorkflowUI.jsx";
const TEMPLATE_DEFAULT = {name:"",goal:"",phase:"",distanceMetres:1000,intensity:INTENSITY.Light,surface:msg(MSG.SURFACE_SAND),frequencyPerWeek:3,notes:""};
/**
 * Các trường controlled của giáo án mẫu, gồm mục tiêu/cường độ/tần suất và ghi chú.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: {form,onChange,disabled}. Các props/callback lấy từ caller.
 */
export function TemplateForm({form,onChange,disabled}) { return <fieldset disabled={disabled}><div className="row g-3"><Field label={msg(MSG.TEN_GIAO_AN)} name="name" value={form.name} onChange={onChange} required maxLength={200} /><Field label={msg(MSG.MUC_TIEU)} name="goal" value={form.goal} onChange={onChange} required /><Field label={msg(MSG.GIAI_DOAN)} name="phase" value={form.phase} onChange={onChange} required /><Field label={msg(MSG.QUANG_DUONG_M)} name="distanceMetres" value={form.distanceMetres} onChange={onChange} required type="number" min={1} max={100000} step="any" /><Field label={msg(MSG.CUONG_DO)} name="intensity" value={form.intensity} onChange={onChange} options={Object.values(INTENSITY)} /><Field label={msg(MSG.MAT_SAN)} name="surface" value={form.surface} onChange={onChange} required /><Field label={msg(MSG.SO_BUOI_MOI_TUAN)} name="frequencyPerWeek" value={form.frequencyPerWeek} onChange={onChange} required type="number" min={1} max={21} /><Field label={msg(MSG.GHI_CHU)} name="notes" value={form.notes} onChange={onChange} multiline /></div></fieldset>; }
/**
 * Tải/phân trang giáo án, mở form tạo/sửa và xác nhận lưu trữ theo role được phép.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function TemplateList() {
    const {user} = useAuth();
    const [page,setPage] = useState(1);
    const [editing,setEditing] = useState(null);
    const [form,setForm] = useState(TEMPLATE_DEFAULT);
    const [confirmArchive,setConfirmArchive] = useState(null);
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(() => listTemplates({page,pageSize:20}),[page]);
    const resource = useRegistrationResource(load);
    const mutation = useMutation();
    const canEdit = user.role === ROLES.HeadTrainer;
    /**
     * Mở form tạo hoặc sửa bằng dữ liệu bản ghi/default, đồng thời reset trạng thái mutation trước lượt mới.
     * @param record Bản ghi/payload do server trả hoặc giá trị dùng dựng form; không tự phát minh ID/trạng thái.
     */
    function open(record) { mutation.reset();setEditing(record?.id || "new");setForm(record ? Object.fromEntries(Object.keys(TEMPLATE_DEFAULT).map(k => [k,record[k] ?? TEMPLATE_DEFAULT[k]])) : TEMPLATE_DEFAULT); }
    /**
     * Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.
     * @param e Event UI/exception theo kiểu của hàm; xem nhánh xử lý trong thân hàm.
     */
    async function submit(e) { e.preventDefault(); const payload = {...form,distanceMetres:Number(form.distanceMetres),frequencyPerWeek:Number(form.frequencyPerWeek)}; await mutation.run(() => editing === "new" ? createTemplate(payload) : editTemplate(editing,payload),() => { setEditing(null);resource.reload(); }); }
    return <section className="training-page"><PageHeading title={msg(MSG.GIAO_AN_HUAN_LUYEN_TIEU_CHUAN)} description={msg(MSG.KHUNG_THAM_KHAO_DE_TRAINER_XAY_DUNG_KE_HOACH_CA_NHAN_HOA)} action={canEdit && <button className="btn btn-primary" onClick={() => open(null)} disabled={mutation.pending}>{msg(MSG.TAO_GIAO_AN)}</button>} /><MutationState mutation={mutation} reload={resource.reload} />{editing && <section className="surface-card"><h2>{editing === "new" ? msg(MSG.TAO_GIAO_AN) : msg(MSG.CHINH_SUA_GIAO_AN)}</h2><form onSubmit={submit}><TemplateForm form={form} onChange={e => setForm({...form,[e.target.name]:e.target.value})} disabled={mutation.pending || mutation.uncertain} /><div className="wizard-actions"><button type="button" className="btn btn-outline-primary" disabled={mutation.pending} onClick={() => setEditing(null)}>{msg(MSG.HUY)}</button><button className="btn btn-success" disabled={mutation.pending || mutation.uncertain}>{msg(MSG.LUU_GIAO_AN)}</button></div></form></section>}<section className="surface-card"><ResourceState resource={resource} />{resource.data && <><div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.GIAO_AN)}</th><th>{msg(MSG.MUC_TIEU)}</th><th>{msg(MSG.QUANG_DUONG)}</th><th>{msg(MSG.CUONG_DO)}</th><th>{msg(MSG.BUOI_TUAN)}</th>{canEdit && <th />}</tr></thead><tbody>{resource.data.items.map(t => <tr key={t.id}><td>{t.name}</td><td>{t.goal}</td><td>{t.distanceMetres}{' '}{msg(MSG.M)}</td><td>{getEnumLabel(t.intensity)}</td><td>{t.frequencyPerWeek}</td>{canEdit && <td><div className="inline-actions"><button className="btn btn-outline-primary" disabled={mutation.pending} onClick={() => open(t)}>{msg(MSG.CHINH_SUA)}</button><button className="btn btn-outline-danger" disabled={mutation.pending || mutation.uncertain} onClick={() => setConfirmArchive(t)}>{msg(MSG.LUU_TRU)}</button></div></td>}</tr>)}</tbody></table>{!resource.data.items.length && <p className="empty-state">{msg(MSG.CHUA_CO_GIAO_AN_TIEU_CHUAN)}</p>}</div><Pagination data={resource.data} onChange={setPage} /></>}</section>{confirmArchive && <div className="surface-card"><p>{msg(MSG.LUU_TRU_GIAO_AN)}{confirmArchive.name}{msg(MSG.CAC_PLAN_DA_TAO_VAN_DUOC_GIU_LAI)}</p><div className="inline-actions"><button className="btn btn-outline-primary" disabled={mutation.pending} onClick={() => setConfirmArchive(null)}>{msg(MSG.GIU_GIAO_AN)}</button><button className="btn btn-primary" disabled={mutation.pending || mutation.uncertain} onClick={() => mutation.run(() => archiveTemplate(confirmArchive.id),() => {setConfirmArchive(null);resource.reload();})}>{msg(MSG.XAC_NHAN_LUU_TRU)}</button></div></div>}</section>;
}
