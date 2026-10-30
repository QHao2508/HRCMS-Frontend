import { getEnumLabel } from "../constants/enumLabels.js";
import { MSG, msg } from "../messages/index.js";
import { Link } from "react-router-dom";
import RegistrationError from "./registrations/RegistrationError.jsx";
import { Children, isValidElement, useId } from 'react';
import PageHeader from './ui/PageHeader.jsx';
import { Pagination as NumberedPagination } from './ui/DataTable.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
import { stateTone } from '../utils/statusTone.js';

/**
 * Dựng tiêu đề, mô tả và action của màn hình theo cùng bố cục.
 * @param options0 Đối tượng destructuring: { title, description, action, id }. Các props/callback lấy từ caller.
 */
export function PageHeading({ title, description, action, id }) { return <PageHeader id={id} title={title} description={description} actions={action} />; }
/**
 * Hiển thị loading/error và nút reload của resource mà không giả lập dữ liệu.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { resource }. Các props/callback lấy từ caller.
 */
export function ResourceState({ resource }) { return <>{resource.loading && <div className="resource-loading" role="status" aria-live="polite"><span className="resource-spinner" aria-hidden="true"/>{msg(resource.data ? MSG.UX_REFRESHING : MSG.DANG_TAI_DU_LIEU)}{!resource.data && <div className="resource-skeleton" aria-hidden="true"><i/><i/><i/></div>}</div>}{resource.error && <div className="resource-error"><RegistrationError error={resource.error} /><button type="button" className="btn btn-outline-primary" onClick={resource.reload}>{msg(MSG.TAI_LAI)}</button></div>}</>; }
/**
 * Tính tổng trang và khóa nút trước/sau theo page/pageSize/total từ server.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { data, onChange }. Các props/callback lấy từ caller.
 */
export function Pagination({ data, onChange }) { return data ? <NumberedPagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={onChange} /> : null; }
/**
 * Tạo liên kết quay lại với nhãn thông điệp mặc định hoặc nội dung caller truyền.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { to, children = msg(MSG.QUAY_LAI) }. Các props/callback lấy từ caller.
 */
export function BackLink({ to, children = msg(MSG.QUAY_LAI) }) { return <Link className="page-back" to={to}>{msg(MSG.SYMBOL_ARROW_BACK)}{' '}{children}</Link>; }
/**
 * Render input/select/textarea controlled; giữ option value enum API và chỉ dịch label.
 * @param options0 Đối tượng destructuring: { label, name, value, onChange, options, multiline, ...props }. Các props/callback lấy từ caller.
 */
function hasRequiredMarker(label) {
    return Children.toArray(label).some(part => typeof part === 'string'
        ? part.includes('*')
        : isValidElement(part) && hasRequiredMarker(part.props.children));
}
export function Field({ label, name, value, onChange, options, multiline, help, error, ...props }) {
    const uniqueId = useId(); const id = `field-${name}-${uniqueId}`;
    const shared = { id, name, value: value ?? '', onChange, required: props.required, disabled: props.disabled, 'aria-invalid': !!error, 'aria-describedby': [help && id+'-help', error && id+'-error'].filter(Boolean).join(' ') || undefined };
    return <div className={props.wide ? 'col-12' : 'col-md-6'}><label className="form-label" htmlFor={id}>{label}{props.required && !hasRequiredMarker(label) && <span aria-hidden="true">{msg(MSG.FIELD_REQUIRED_MARKER)}</span>}</label>{options ? <select {...shared} className={`form-select${error ? ' is-invalid' : ''}`}>{options.map(option => { const o = typeof option === 'string' ? { value: option, label: getEnumLabel(option) } : option; return <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>; })}</select> : multiline ? <textarea {...shared} rows={3} className={`form-control${error ? ' is-invalid' : ''}`} maxLength={props.maxLength}/> : <input {...shared} className={`form-control${error ? ' is-invalid' : ''}`} type={props.type || 'text'} onInput={props.type?.startsWith('date') ? onChange : undefined} min={props.min} max={props.max} step={props.step} minLength={props.minLength} pattern={props.pattern} maxLength={props.maxLength} autoComplete={props.autoComplete}/>}{help && <div id={id+'-help'} className="form-text">{help}</div>}{error && <div id={id+'-error'} className="invalid-feedback">{error}</div>}</div>;
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
export function StateBadge({ value }) { return <StatusBadge tone={stateTone(value)} dot>{getEnumLabel(value)}</StatusBadge>; }
