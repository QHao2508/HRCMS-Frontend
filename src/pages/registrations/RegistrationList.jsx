import { MSG, msg } from "../../messages/index.js";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { listRegistrations } from "../../services/registrationService.js";
import { REGISTRATION_STATUS, canEditRegistration, statusDisplay } from "../../constants/registration.js";
import RegistrationStatus from "../../components/registrations/RegistrationStatus.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";

/**
 * Render bảng hồ sơ, badge trạng thái và các thao tác được phép từ dữ liệu API.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { data }. Các props/callback lấy từ caller.
 */
export function RegistrationListContent({ data }) {
    if (!data.items.length) return <p>{msg(MSG.CHUA_CO_HO_SO_PHU_HOP_TAO_BAN_NHAP_DE_BAT_DAU)}</p>;
    return <div className="table-responsive"><table className="table align-middle">
        <thead><tr><th>{msg(MSG.TEN_NGUA)}</th><th>{msg(MSG.TRANG_THAI)}</th><th>{msg(MSG.MA_DANG_KY)}</th><th>{msg(MSG.NGAY_TAO)}</th><th>{msg(MSG.THAO_TAC)}</th></tr></thead>
        <tbody>{data.items.map((item) => <tr key={item.id}>
            <td>{item.name || msg(MSG.BAN_NHAP_CHUA_CO_TEN)}</td><td><RegistrationStatus status={item.status} /></td>
            <td>{item.registrationNumber || "—"}</td><td>{item.createdAt ? item.createdAt.slice(0, 10) : "—"}</td>
            <td><Link to={`/registrations/${encodeURIComponent(item.id)}`}>{canEditRegistration(item.status) ? msg(MSG.XEM_CHINH_SUA) : msg(MSG.VIEW)}</Link></td>
        </tr>)}</tbody>
    </table></div>;
}
/**
 * Giữ bộ lọc/trang và tải danh sách intake của chủ ngựa, hỗ trợ mở/tạo hồ sơ.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function RegistrationList() {
    const [filter, setFilter] = useState({ status: "", page: 1 });
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load = useCallback(() => listRegistrations(filter), [filter]);
    const resource = useRegistrationResource(load, { realtime: true });
    return <section className="surface-card">
        <div className="d-flex flex-wrap justify-content-between gap-2 mb-3"><h1>{msg(MSG.YEU_CAU_DANG_KY_NGUA)}</h1><Link to="/registrations/new" className="btn btn-primary align-self-start">{msg(MSG.DANG_KY_NGUA)}</Link></div>
        <label htmlFor="registration-status-filter" className="form-label">{msg(MSG.TRANG_THAI)}</label>
        <select id="registration-status-filter" value={filter.status} onChange={(event) => setFilter({ status: event.target.value, page: 1 })} className="form-select mb-3">
            <option value="">{msg(MSG.TAT_CA_TRANG_THAI)}</option>{Object.values(REGISTRATION_STATUS).map((status) => <option key={status} value={status}>{statusDisplay(status).label}</option>)}
        </select>
        {resource.loading && <p role="status">{msg(MSG.DANG_TAI_HO_SO)}</p>}
        {resource.error && <><RegistrationError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>{msg(MSG.THU_LAI)}</button></>}
        {resource.data && <>
            <RegistrationListContent data={resource.data} />
            <nav aria-label={msg(MSG.REGISTRATION_PAGES)} className="d-flex flex-wrap align-items-center gap-3">
                <button className="btn btn-outline-secondary" disabled={resource.data.page <= 1} onClick={() => setFilter({ ...filter, page: resource.data.page - 1 })}>{msg(MSG.TRUOC)}</button>
                <span>{msg(MSG.TRANG)}{' '}{resource.data.page}{' '}{msg(MSG.SYMBOL_4)}{' '}{Math.max(1, Math.ceil(resource.data.total / resource.data.pageSize))}{' '}{msg(MSG.SYMBOL_5)}{' '}{resource.data.total}{' '}{msg(MSG.HO_SO)}</span>
                <button className="btn btn-outline-secondary" disabled={resource.data.page * resource.data.pageSize >= resource.data.total} onClick={() => setFilter({ ...filter, page: resource.data.page + 1 })}>{msg(MSG.SAU)}</button>
            </nav>
        </>}
    </section>;
}
