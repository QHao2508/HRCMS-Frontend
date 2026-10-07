import { HEALTH_STATUS } from "../constants/registration.js";
import { PLAN_STATUS, SESSION_STATUS } from "../constants/training.js";
import { getEnumLabel } from "../constants/enumLabels.js";
import { MSG, msg } from "../messages/index.js";
import { Link } from "react-router-dom";
import RegistrationError from "./registrations/RegistrationError.jsx";

/**
 * Dựng tiêu đề, mô tả và action của màn hình theo cùng bố cục.
 * @param options0 Đối tượng destructuring: { title, description, action, id }. Các props/callback lấy từ caller.
 */
export function PageHeading({ title, description, action, id }) { return <div className="page-heading"><div><h1 id={id}>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>; }
/**
 * Hiển thị loading/error và nút reload của resource mà không giả lập dữ liệu.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { resource }. Các props/callback lấy từ caller.
 */
export function ResourceState({ resource }) { return <>{resource.loading && <p role="status">{msg(MSG.DANG_TAI_DU_LIEU)}</p>}{resource.error && <><RegistrationError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>{msg(MSG.TAI_LAI)}</button></>}</>; }
/**
 * Tính tổng trang và khóa nút trước/sau theo page/pageSize/total từ server.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { data, onChange }. Các props/callback lấy từ caller.
 */
export function Pagination({ data, onChange }) { return data && <nav aria-label={msg(MSG.PHAN_TRANG)} className="pagination-row"><button className="btn btn-outline-secondary" disabled={data.page <= 1} onClick={() => onChange(data.page - 1)}>{msg(MSG.TRUOC)}</button><span>{msg(MSG.PAGINATION_SUMMARY, { page: data.page, pages: Math.max(1, Math.ceil(data.total / data.pageSize)), total: data.total })}</span><button className="btn btn-outline-secondary" disabled={data.page * data.pageSize >= data.total} onClick={() => onChange(data.page + 1)}>{msg(MSG.SAU)}</button></nav>; }
/**
 * Tạo liên kết quay lại với nhãn thông điệp mặc định hoặc nội dung caller truyền.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { to, children = msg(MSG.QUAY_LAI) }. Các props/callback lấy từ caller.
 */
export function BackLink({ to, children = msg(MSG.QUAY_LAI) }) { return <Link className="page-back" to={to}>{msg(MSG.SYMBOL_6)}{' '}{children}</Link>; }
/**
 * Render input/select/textarea controlled; giữ option value enum API và chỉ dịch label.
 * @param options0 Đối tượng destructuring: { label, name, value, onChange, options, multiline, ...props }. Các props/callback lấy từ caller.
 */
export function Field({ label, name, value, onChange, options, multiline, ...props }) {
    const id = `field-${name}`;
    return <div className={props.wide ? "col-12" : "col-md-6"}><label className="form-label" htmlFor={id}>{label}</label>{options ? <select id={id} name={name} className="form-select" value={value ?? ""} onChange={onChange} required={props.required} disabled={props.disabled}>{options.map(option => { const o = typeof option === "string" ? { value: option, label: getEnumLabel(option) } : option; return <option key={o.value} value={o.value}>{o.label}</option>; })}</select> : multiline ? <textarea id={id} name={name} rows={3} className="form-control" value={value ?? ""} onChange={onChange} required={props.required} disabled={props.disabled} maxLength={props.maxLength} /> : <input id={id} name={name} className="form-control" value={value ?? ""} onChange={onChange} type={props.type || "text"} onInput={props.type?.startsWith("date") ? onChange : undefined} required={props.required} min={props.min} max={props.max} step={props.step} disabled={props.disabled} maxLength={props.maxLength} autoComplete={props.autoComplete} />}</div>;
}
/**
 * Hiển thị pending/error/notice và yêu cầu reload khi kết quả ghi chưa chắc chắn.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { mutation, reload }. Các props/callback lấy từ caller.
 */
export function MutationState({ mutation, reload }) { return <><RegistrationError error={mutation.error} />{mutation.notice && <p className="alert alert-success" role="status">{mutation.notice}</p>}{mutation.pending && <p role="status">{msg(MSG.DANG_XU_LY)}</p>}{mutation.uncertain && <div className="alert alert-warning">{msg(MSG.HAY_TAI_LAI_DU_LIEU_TRUOC_KHI_THUC_HIEN_THAO_TAC_TIEP_THEO)}<button className="btn btn-outline-primary ms-2" onClick={() => { mutation.reset(); reload(); }}>{msg(MSG.TAI_LAI)}</button></div>}</>; }
/**
 * Chọn màu badge từ enum trạng thái và trả nhãn tiếng Việt an toàn.
 * @param options0 Đối tượng destructuring: { value }. Các props/callback lấy từ caller.
 */
export function StateBadge({ value }) { return <span className={`badge status-pill ${[PLAN_STATUS.Completed, HEALTH_STATUS.Fit].includes(value) ? "text-bg-success" : [SESSION_STATUS.IssueReported, HEALTH_STATUS.Injured, PLAN_STATUS.Paused].includes(value) ? "text-bg-warning" : "text-bg-secondary"}`}>{getEnumLabel(value)}</span>; }
