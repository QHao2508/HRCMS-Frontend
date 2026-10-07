import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { listHorses } from "../../services/horseService.js";
import { HEALTH_STATUSES } from "../../constants/horses.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import HealthStatus from "../../components/horses/HealthStatus.jsx";
import HorseError from "../../components/horses/HorseError.jsx";

export function HorseListResults({ resource, onPage }) {
    if (resource.loading) return <p role="status">Loading Horses...</p>;
    if (resource.error) return <><HorseError error={resource.error} /><button className="btn btn-outline-primary" onClick={resource.reload}>Retry Horses</button></>;
    const { items, page, pageSize, total } = resource.data;
    return <>
        {!items.length ? <p>No Horses match these filters within your access scope.</p> : <div className="table-responsive"><table className="table align-middle">
            <thead><tr><th>Name</th><th>Registration number</th><th>Breed</th><th>Health</th><th>Profile</th></tr></thead>
            <tbody>{items.map((horse) => <tr key={horse.id}><td>{horse.name || "Unnamed Horse"}</td>
                <td>{horse.registrationNumber || "Not provided"}</td><td>{horse.breed || "Not provided"}</td>
                <td><HealthStatus value={horse.healthStatus} /></td>
                <td><Link to={`/horses/${encodeURIComponent(horse.id)}`}>View Horse</Link></td>
            </tr>)}</tbody>
        </table></div>}
        <nav className="d-flex flex-wrap align-items-center gap-3" aria-label="Horse pages">
            <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
            <span>Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} Horses</span>
            <button className="btn btn-outline-secondary" disabled={page * pageSize >= total} onClick={() => onPage(page + 1)}>Next</button>
        </nav>
    </>;
}
export default function HorseList() {
    const [search, setSearch] = useState("");
    const [healthStatus, setHealthStatus] = useState("");
    const [filter, setFilter] = useState({ search: "", healthStatus: "", page: 1 });
    const load = useCallback(() => listHorses(filter), [filter]);
    const resource = useRegistrationResource(load);
    return <section><h1>Horses</h1><p>Browse Horses available to your account.</p>
        <form className="row g-3 mb-3" onSubmit={(event) => { event.preventDefault(); setFilter({ search, healthStatus, page: 1 }); }}>
            <div className="col-md-6"><label className="form-label" htmlFor="horse-search">Name or registration number</label>
                <input id="horse-search" className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <div className="col-md-4"><label className="form-label" htmlFor="horse-health-filter">Health status</label>
                <select id="horse-health-filter" className="form-select" value={healthStatus} onChange={(event) => setHealthStatus(event.target.value)}>
                    <option value="">All health statuses</option>{HEALTH_STATUSES.map((value) => <option value={value} key={value}>{value}</option>)}
                </select></div>
            <div className="col-md-2 align-self-end"><button className="btn btn-primary" type="submit">Apply filters</button></div>
        </form>
        <HorseListResults resource={resource} onPage={(page) => setFilter({ ...filter, page })} />
    </section>;
}
