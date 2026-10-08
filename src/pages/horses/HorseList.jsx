import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { listHorses } from "../../services/horseService.js";
import { HEALTH_STATUSES } from "../../constants/horses.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import HealthStatus from "../../components/horses/HealthStatus.jsx";
import HorseError from "../../components/horses/HorseError.jsx";
import "../../style/registration.css";
import "../../style/horse.css";

export function HorseListResults({ resource, onPage }) {
    if (resource.loading) return <p className="hrcms-registration-pending" role="status">Đang tải hồ sơ ngựa...</p>;
    if (resource.error) return <div className="hrcms-horse-resource-error">
        <HorseError error={resource.error} />
        <button type="button" className="hrcms-registration-button hrcms-registration-button-outline" onClick={resource.reload}>Thử lại danh sách</button>
    </div>;
    const { items, page, pageSize, total } = resource.data;
    return <section className="hrcms-registration-card hrcms-horse-list-card" aria-labelledby="horse-list-results-title">
        <h2 id="horse-list-results-title">Hồ sơ ngựa</h2>
        <p className="hrcms-registration-card-description">Các hồ sơ trong phạm vi truy cập của tài khoản này.</p>
        {items.length ? <div className="hrcms-registration-table-scroll">
            <table className="hrcms-registration-table hrcms-horse-list-table">
                <thead><tr><th scope="col">Tên ngựa</th><th scope="col">Mã đăng ký</th><th scope="col">Giống</th>
                    <th scope="col">Sức khỏe</th><th scope="col">Thao tác</th></tr></thead>
                <tbody>{items.map((horse) => <tr key={horse.id}>
                    <td><div className="hrcms-horse-list-identity"><span className="hrcms-horse-list-placeholder" aria-hidden="true" />
                        <span><strong>{horse.name || "Ngựa chưa đặt tên"}</strong><small>{horse.id}</small></span></div></td>
                    <td>{horse.registrationNumber || "—"}</td><td>{horse.breed || "—"}</td>
                    <td><HealthStatus value={horse.healthStatus} /></td>
                    <td><Link className="hrcms-horse-list-link" to={`/horses/${encodeURIComponent(horse.id)}`}>Xem hồ sơ</Link></td>
                </tr>)}</tbody>
            </table>
        </div> : <p className="hrcms-horse-empty" role="status">Không có hồ sơ ngựa phù hợp với bộ lọc trong phạm vi truy cập của bạn.</p>}
        <nav className="hrcms-horse-pagination" aria-label="Trang hồ sơ ngựa">
            <button type="button" className="hrcms-registration-button hrcms-registration-button-outline" disabled={page <= 1}
                onClick={() => onPage(page - 1)}>Trước</button>
            <span>Trang {page} / {Math.max(1, Math.ceil(total / pageSize))} · {total} hồ sơ</span>
            <button type="button" className="hrcms-registration-button hrcms-registration-button-outline" disabled={page * pageSize >= total}
                onClick={() => onPage(page + 1)}>Sau</button>
        </nav>
    </section>;
}
export default function HorseList() {
    const [search, setSearch] = useState("");
    const [healthStatus, setHealthStatus] = useState("");
    const [filter, setFilter] = useState({ search: "", healthStatus: "", page: 1 });
    const load = useCallback(() => listHorses(filter), [filter]);
    const resource = useRegistrationResource(load);
    return <section className="hrcms-registration-page hrcms-horse-page hrcms-horse-list" aria-labelledby="horse-list-title">
        <header className="hrcms-registration-heading">
            <h1 id="horse-list-title">Hồ sơ ngựa</h1>
            <p>Tìm và xem hồ sơ ngựa trong phạm vi truy cập của bạn.</p>
        </header>
        <form className="hrcms-registration-card hrcms-horse-filters" onSubmit={(event) => { event.preventDefault(); setFilter({ search, healthStatus, page: 1 }); }}>
            <h2>Lọc hồ sơ</h2>
            <div className="hrcms-horse-filter-row">
                <div className="hrcms-registration-field"><label htmlFor="horse-search">Tên ngựa hoặc mã đăng ký</label>
                    <input id="horse-search" className="hrcms-registration-input" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
                <div className="hrcms-registration-field"><label htmlFor="horse-health-filter">Tình trạng sức khỏe</label>
                    <select id="horse-health-filter" className="hrcms-registration-input" value={healthStatus} onChange={(event) => setHealthStatus(event.target.value)}>
                        <option value="">Tất cả trạng thái</option>{HEALTH_STATUSES.map((value) => <option value={value} key={value}>{value}</option>)}
                    </select></div>
                <button className="hrcms-registration-button hrcms-registration-button-primary" type="submit">Áp dụng bộ lọc</button>
            </div>
        </form>
        <HorseListResults resource={resource} onPage={(page) => setFilter({ ...filter, page })} />
    </section>;
}
