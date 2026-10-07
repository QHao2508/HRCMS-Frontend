import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { listRegistrations } from "../../services/registrationService.js";
import { REGISTRATION_STATUS, canEditRegistration, statusDisplay } from "../../constants/registration.js";
import RegistrationStatus from "../../components/registrations/RegistrationStatus.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";

export function RegistrationListContent({ data }) {
    if (!data.items.length) return <p>Chưa có hồ sơ phù hợp. Tạo bản nháp để bắt đầu.</p>;
    return <div className="table-responsive"><table className="table align-middle">
        <thead><tr><th>Tên ngựa</th><th>Trạng thái</th><th>Mã đăng ký</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
        <tbody>{data.items.map((item) => <tr key={item.id}>
            <td>{item.name || "Bản nháp chưa có tên"}</td><td><RegistrationStatus status={item.status} /></td>
            <td>{item.registrationNumber || "—"}</td><td>{item.createdAt ? item.createdAt.slice(0, 10) : "—"}</td>
            <td><Link to={`/registrations/${encodeURIComponent(item.id)}`}>{canEditRegistration(item.status) ? "Xem / chỉnh sửa" : "Xem"}</Link></td>
        </tr>)}</tbody>
    </table></div>;
}
export default function RegistrationList() {
    const [filter, setFilter] = useState({ status: "", page: 1 });
    const load = useCallback(() => listRegistrations(filter), [filter]);
    const resource = useRegistrationResource(load);
    return <section className="surface-card">
        <div className="d-flex flex-wrap justify-content-between gap-2 mb-3"><h1>Yêu cầu đăng ký ngựa</h1><Link to="/registrations/new" className="btn btn-primary align-self-start">Đăng ký ngựa</Link></div>
        <label htmlFor="registration-status-filter" className="form-label">Trạng thái</label>
        <select id="registration-status-filter" value={filter.status} onChange={(event) => setFilter({ status: event.target.value, page: 1 })} className="form-select mb-3">
            <option value="">Tất cả trạng thái</option>{Object.values(REGISTRATION_STATUS).map((status) => <option key={status} value={status}>{statusDisplay(status).label}</option>)}
        </select>
        {resource.loading && <p role="status">Đang tải hồ sơ...</p>}
        {resource.error && <><RegistrationError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>Thử lại</button></>}
        {resource.data && <>
            <RegistrationListContent data={resource.data} />
            <nav aria-label="Registration pages" className="d-flex flex-wrap align-items-center gap-3">
                <button className="btn btn-outline-secondary" disabled={resource.data.page <= 1} onClick={() => setFilter({ ...filter, page: resource.data.page - 1 })}>Trước</button>
                <span>Trang {resource.data.page} / {Math.max(1, Math.ceil(resource.data.total / resource.data.pageSize))} · {resource.data.total} hồ sơ</span>
                <button className="btn btn-outline-secondary" disabled={resource.data.page * resource.data.pageSize >= resource.data.total} onClick={() => setFilter({ ...filter, page: resource.data.page + 1 })}>Sau</button>
            </nav>
        </>}
    </section>;
}
