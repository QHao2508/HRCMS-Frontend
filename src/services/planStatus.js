import { PLAN_STATUS } from "../constants/training.js";
import { clubToday } from "./workflowHelpers.js";
import { validDate } from "./registrationValidation.js";

// Deadline is separate from workflow state. The end date is inclusive in club time.
export function isPlanOverdue(plan, today = clubToday()) {
    return !!plan && [PLAN_STATUS.Active, PLAN_STATUS.Paused].includes(plan.status)
        && validDate(plan.endDate) && validDate(today) && plan.endDate < today;
}
