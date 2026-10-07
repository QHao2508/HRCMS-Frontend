import { canAssignTrainer } from "../../services/assignmentService.js";
import { AssignmentPanel } from "./AdministrativeAssignment.jsx";

export default function TrainerAssignment({ user, data, onUpdated, onReload }) {
    if (!canAssignTrainer(user, data)) return null;
    return <AssignmentPanel key={`${user.id}:${data.horse.id}`} trainerOnly data={data} onUpdated={onUpdated} onReload={onReload} />;
}
