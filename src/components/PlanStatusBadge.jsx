import { StateBadge } from "./WorkflowUI.jsx";
import { isPlanOverdue } from "../services/planStatus.js";

export default function PlanStatusBadge({ plan }) {
    return <span className="d-inline-flex flex-wrap gap-2 align-items-center">
        <StateBadge value={plan.status} />
        {isPlanOverdue(plan) && <span className="badge status-pill text-bg-warning" title={`Đã quá ngày kết thúc ${plan.endDate}`}>Quá hạn</span>}
    </span>;
}
