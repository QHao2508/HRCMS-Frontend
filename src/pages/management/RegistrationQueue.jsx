import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { listRegistrations } from "../../services/registrationService.js";
import { REGISTRATION_STATUS, statusDisplay } from "../../constants/registration.js";
import { canReview } from "../../services/managerReviewService.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import RegistrationStatus from "../../components/registrations/RegistrationStatus.jsx";
import RegistrationError from "../../components/registrations/RegistrationError.jsx";
import "../../style/registration.css";

export function RegistrationQueueResults({ resource, onPage }) {
    if (resource.loading) return <p className="hrcms-registration-pending" role="status">Đang tải danh sách chờ duyệt...</p>;
    if (resource.error) return <div className="hrcms-manager-resource-error" role="alert">
        <RegistrationError error={resource.error} />
        <button type="button" className="hrcms-registration-button hrcms-registration-button-outline" onClick={resource.reload}>Thử lại danh sách</button>
    </div>;
    const { items, page, pageSize, total } = resource.data;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const firstReviewable = items.find((record) => canReview(record.status));
    return <section className="hrcms-registration-card hrcms-manager-queue-card" aria-labelledby="manager-queue-results-title">
        <h2 id="manager-queue-results-title">Hồ sơ cần kiểm tra</h2>
        {!items.length ? <p className="hrcms-manager-empty">Không có yêu cầu đăng ký phù hợp với trạng thái này.</p>
            : <div className="hrcms-registration-table-scroll hrcms-manager-queue-scroll"><table className="hrcms-registration-table hrcms-manager-queue-table">
                <thead><tr><th scope="col">Yêu cầu / ngựa</th><th scope="col">Chủ sở hữu</th><th scope="col">Tình trạng</th></tr></thead>
                <tbody>{items.map((record) => <tr key={record.id}>
                    <td><strong>{record.id} · {record.name || "Ngựa chưa đặt tên"}</strong>
                        {record.createdAt && <small>Ngày tạo: {record.createdAt.slice(0, 10)}</small>}</td>
                    <td>{record.ownerId || "—"}</td>
                    <td><RegistrationStatus status={record.status} /> <Link className="hrcms-manager-queue-link"
                        to={"/management/registrations/" + encodeURIComponent(record.id)}>
                        {canReview(record.status) ? "Kiểm tra" : "Xem yêu cầu"}</Link></td>
                </tr>)}</tbody>
            </table></div>}
        <div className="hrcms-manager-queue-footer">
            <nav aria-label="Trang danh sách chờ duyệt" className="hrcms-manager-pagination">
                <button type="button" className="hrcms-registration-button hrcms-registration-button-outline" disabled={page <= 1}
                    onClick={() => onPage(page - 1)}>Trước</button>
                <span>Trang {page} / {pages} · {total} yêu cầu</span>
                <button type="button" className="hrcms-registration-button hrcms-registration-button-outline" disabled={page * pageSize >= total}
                    onClick={() => onPage(page + 1)}>Sau</button>
            </nav>
            {firstReviewable && <Link className="hrcms-registration-button hrcms-registration-button-primary"
                to={"/management/registrations/" + encodeURIComponent(firstReviewable.id)}>Kiểm tra hồ sơ</Link>}
        </div>
    </section>;
}
export default function RegistrationQueue() {
    const [filter, setFilter] = useState({ status: REGISTRATION_STATUS.PendingReview, page: 1 });
    const load = useCallback(() => listRegistrations(filter), [filter]);
    const resource = useRegistrationResource(load);
    return <section className="hrcms-registration-page hrcms-manager-queue" aria-labelledby="manager-queue-title">
        <header className="hrcms-registration-heading">
            <h1 id="manager-queue-title">Yêu cầu đăng ký ngựa</h1>
            <p>Kiểm tra hồ sơ trước khi tạo hoặc kích hoạt Horse Profile chính thức.</p>
        </header>
        <section className="hrcms-registration-card hrcms-manager-filter" aria-labelledby="manager-queue-filter-title">
            <h2 id="manager-queue-filter-title">Lọc theo trạng thái</h2>
            <div className="hrcms-registration-field">
                <label htmlFor="review-status-filter">Trạng thái</label>
                <select id="review-status-filter" className="hrcms-registration-input" value={filter.status}
                    onChange={(event) => setFilter({ status: event.target.value, page: 1 })}>
                    <option value="">Tất cả trạng thái</option>
                    {Object.values(REGISTRATION_STATUS).map((status) => <option key={status} value={status}>{statusDisplay(status).label}</option>)}
                </select>
            </div>
        </section>
        <RegistrationQueueResults resource={resource} onPage={(page) => setFilter({ ...filter, page })} />
        <div className="hrcms-registration-info hrcms-manager-queue-info" role="note">
            <img src="/figma/auth/info.svg" alt="" width="20" height="20" />
            <span>Owner có thể đề xuất Head Trainer, Groom và Veterinarian. Trainer trực tiếp được Head Trainer phân công sau phê duyệt.</span>
        </div>
    </section>;
}
