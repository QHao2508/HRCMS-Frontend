import { MSG, msg } from "../messages/index.js";
import { StateBadge } from "./WorkflowUI.jsx";
import { isPlanOverdue } from "../services/planStatus.js";

export default function PlanStatusBadge({ plan }) {
    return <span className="d-inline-flex flex-wrap gap-2 align-items-center">
        <StateBadge value={plan.status} />
        {isPlanOverdue(plan) && <span className="badge status-pill text-bg-warning" title={msg(MSG.PLAN_OVERDUE_DATE, {date:plan.endDate})}>{msg(MSG.PLAN_OVERDUE)}</span>}
    </span>;
}
