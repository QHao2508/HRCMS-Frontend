import { ROLES } from './roles.js';

// Ma trận quyền theo vai trò, khớp với HorseClub.BLL/Common/RolePolicy.cs. Backend vẫn là nơi kiểm quyền thật;
// file này chỉ quyết định menu, route và nút hiển thị, để sửa quyền ở một chỗ.
const R = ROLES;
export const PERMISSIONS = Object.freeze({
    incidentRead: [R.ClubManager, R.HeadTrainer, R.Trainer, R.WorkRider, R.Veterinarian, R.Groom, R.HorseOwner],
    incidentReport: [R.Groom, R.WorkRider, R.Trainer, R.Veterinarian],
    incidentReroute: [R.ClubManager],
    careRead: [R.ClubManager, R.HeadTrainer, R.Trainer, R.Veterinarian, R.Groom, R.HorseOwner],
    careAssign: [R.ClubManager, R.Veterinarian],
    careRecord: [R.Groom],
    medicalWorkspace: [R.Veterinarian],
    medicalOverview: [R.Veterinarian, R.ClubManager, R.HeadTrainer, R.HorseOwner],
    measurementWrite: [R.ClubManager, R.Veterinarian, R.Groom],
    trainingMenu: [R.HorseOwner, R.ClubManager, R.HeadTrainer, R.Trainer, R.WorkRider],
    trainingRead: [R.HorseOwner, R.ClubManager, R.HeadTrainer, R.Trainer, R.WorkRider, R.Veterinarian],
});
export const can = (user, permission) => !!user && PERMISSIONS[permission].includes(user.role);
/** Manager đóng mọi sự cố; HeadTrainer đóng sự cố chuyển cho Trainer; role được chuyển tới đóng sự cố của mình. */
export const canResolveIncident = (user, incident) => !!user && !incident.resolved
    && (user.role === R.ClubManager || user.role === incident.routedTo || user.role === R.HeadTrainer && incident.routedTo === R.Trainer);
