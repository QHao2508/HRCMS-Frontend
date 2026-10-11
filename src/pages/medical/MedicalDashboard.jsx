import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import MedicalLayout from "../../components/medical/MedicalLayout.jsx";
import { getMedicalHorses } from "../../services/medicalService.js";
import { useRegistrationResource } from "../../context/useRegistrationResource.js";
import { Pagination, ResourceState, StateBadge } from "../../components/WorkflowUI.jsx";
import { MSG, msg } from "../../messages/index.js";
export default function MedicalDashboard() {
    const [page, setPage] = useState(1);
    const load = useCallback(() => getMedicalHorses({ page, pageSize: 20 }), [page]);
    const resource = useRegistrationResource(load, { realtime: true });
    return <MedicalLayout><h1>{msg(MSG.MEDICAL_MODULE)}</h1><ResourceState resource={resource} />{resource.data && <><table className="medical-table"><thead><tr><th>{msg(MSG.MEDICAL_HORSE)}</th><th>{msg(MSG.MEDICAL_HEALTH)}</th></tr></thead><tbody>{resource.data.items.map(horse => <tr key={horse.id}><td><Link to={`/horses/${encodeURIComponent(horse.id)}`}>{horse.name}</Link></td><td><StateBadge value={horse.healthStatus} /></td></tr>)}</tbody></table>{!resource.data.items.length && <p>{msg(MSG.MEDICAL_EMPTY)}</p>}<Pagination data={resource.data} onChange={setPage} /></>}</MedicalLayout>;
}