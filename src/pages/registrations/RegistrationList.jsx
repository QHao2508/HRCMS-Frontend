import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { listRegistrations } from "../../services/registrationService.js";
import { listHorses } from "../../services/horseService.js";
import { REGISTRATION_STATUS, canEditRegistration, statusDisplay } from "../../constants/registration.js";
import RegistrationStatus from "../../components/registrations/RegistrationStatus.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";
import HorseError from "../../components/horses/HorseError.jsx";
import "../../style/flow1.css";

export function RegistrationListContent({ data }) {
    if (!data.items.length) return <p className="hrcms-owner-empty">Chưa có yêu cầu đăng ký phù hợp với bộ lọc này. Bạn có thể tạo bản nháp mới.</p>;
    return <div className="hrcms-owner-table-scroll"><table className="hrcms-owner-table">
        <thead><tr><th scope="col">Mã yêu cầu</th><th scope="col">Tên ngựa</th>
            <th scope="col">Trạng thái</th><th scope="col">Thao tác</th></tr></thead>
        <tbody>{data.items.map((item) => <tr key={item.id}>
            <td><span className="hrcms-owner-request-id">{item.id}</span>
                {item.registrationNumber && <small>Số đăng ký: {item.registrationNumber}</small>}
                {item.createdAt && <small>Ngày tạo: {item.createdAt.slice(0, 10)}</small>}</td>
            <td>{item.name || "Bản nháp chưa đặt tên"}</td>
            <td><RegistrationStatus status={item.status} /></td>
            <td><Link className="hrcms-owner-row-action" to={`/registrations/${encodeURIComponent(item.id)}`}>
                {canEditRegistration(item.status) ? "Tiếp tục bản nháp" : "Xem chi tiết"}
            </Link></td>
        </tr>)}</tbody>
    </table></div>;
}

function HorseProfiles({ resource }) {
    return <section className="hrcms-owner-card" aria-labelledby="owner-horses-title">
        <h2 id="owner-horses-title">Hồ sơ ngựa</h2>
        <p className="hrcms-owner-card-description">Các hồ sơ chính thức sẽ xuất hiện sau khi Club Manager phê duyệt.</p>
        {resource.loading && <p role="status">Đang tải hồ sơ ngựa...</p>}
        {resource.error && <div className="hrcms-owner-resource-error">
            <HorseError error={resource.error} />
            <button type="button" className="hrcms-owner-outline-button" onClick={resource.reload}>Thử lại</button>
        </div>}
        {resource.data && (resource.data.items.length
            ? <div className="hrcms-owner-horse-list">
                {resource.data.items.map((horse) => <div key={horse.id} className="hrcms-owner-horse-row">
                    <div><strong>{horse.name || "Ngựa chưa đặt tên"}</strong>
                        <small>{horse.registrationNumber || "Chưa có số đăng ký"}</small></div>
                    <Link to={`/horses/${encodeURIComponent(horse.id)}`}>Xem hồ sơ</Link>
                </div>)}
                {resource.data.total > resource.data.items.length && <Link to="/horses">Xem tất cả hồ sơ</Link>}
            </div>
            : <><strong className="hrcms-owner-empty-title">Bạn chưa có hồ sơ ngựa chính thức.</strong>
                <p className="hrcms-owner-empty-detail">Yêu cầu đang soạn được lưu riêng bên dưới. Bạn có thể hoàn thiện và gửi để Club Manager kiểm tra.</p></>)}
    </section>;
}

export default function RegistrationList() {
    const [filter, setFilter] = useState({ status: "", page: 1 });
    const load = useCallback(() => listRegistrations(filter), [filter]);
    const resource = useRegistrationResource(load);
    const loadHorses = useCallback(() => listHorses(), []);
    const horses = useRegistrationResource(loadHorses);

    return <section className="hrcms-owner-page" aria-labelledby="owner-page-title">
        <h1 id="owner-page-title">Ngựa của tôi</h1>
        <p className="hrcms-owner-description">Quản lý hồ sơ đã được duyệt và theo dõi các yêu cầu đăng ký.</p>
        <div className="hrcms-owner-actions"><Link to="/registrations/new" className="hrcms-owner-primary-button">Đăng ký ngựa</Link></div>

        <HorseProfiles resource={horses} />

        <section className="hrcms-owner-card" aria-labelledby="owner-requests-title">
            <h2 id="owner-requests-title">Yêu cầu đăng ký</h2>
            <div className="hrcms-owner-filter">
                <label htmlFor="registration-status-filter">Trạng thái</label>
                <select id="registration-status-filter" value={filter.status}
                    onChange={(event) => setFilter({ status: event.target.value, page: 1 })}>
                    <option value="">Tất cả trạng thái</option>
                    {Object.values(REGISTRATION_STATUS).map((status) => <option key={status} value={status}>{statusDisplay(status).label}</option>)}
                </select>
            </div>
            {resource.loading && <p role="status">Đang tải yêu cầu đăng ký...</p>}
            {resource.error && <div className="hrcms-owner-resource-error">
                <RegistrationError error={resource.error} />
                <button type="button" className="hrcms-owner-outline-button" onClick={resource.reload}>Thử lại</button>
            </div>}
            {resource.data && <>
                <RegistrationListContent data={resource.data} />
                <nav aria-label="Registration pages" className="hrcms-owner-pagination">
                    <button type="button" className="hrcms-owner-outline-button" disabled={resource.data.page <= 1}
                        onClick={() => setFilter({ ...filter, page: resource.data.page - 1 })}>Trước</button>
                    <span>Trang {resource.data.page} / {Math.max(1, Math.ceil(resource.data.total / resource.data.pageSize))} · {resource.data.total} yêu cầu</span>
                    <button type="button" className="hrcms-owner-outline-button"
                        disabled={resource.data.page * resource.data.pageSize >= resource.data.total}
                        onClick={() => setFilter({ ...filter, page: resource.data.page + 1 })}>Sau</button>
                </nav>
            </>}
        </section>

        <section className="hrcms-owner-card" aria-labelledby="owner-guide-title">
            <h2 id="owner-guide-title">Hồ sơ rõ ràng, theo dõi xuyên suốt</h2>
            <div className="hrcms-owner-guide">
                <div><strong>1. Chuẩn bị hồ sơ</strong><p>—</p></div>
                <div><strong>2. Gửi để kiểm tra</strong><p>—</p></div>
                <div><strong>3. Sau phê duyệt</strong><p>—</p></div>
            </div>
        </section>
    </section>;
}
