import { ALL_ROLES,ROLES,isKnownRole,isRoleAllowed } from "../constants/roles.js";
export const TRAINING_ROLES = [ROLES.HorseOwner,ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer,ROLES.WorkRider,ROLES.Veterinarian];
const items = [
    {to:"/dashboard",label:"Dashboard",allowedRoles:ALL_ROLES},
    {to:"/horses",label:"Horses",allowedRoles:ALL_ROLES},
    {to:"/registrations",label:"Horse registrations",allowedRoles:ROLES.HorseOwner},
    {to:"/reviews",label:"Registration review",allowedRoles:ROLES.ClubManager},
    {to:"/training/templates",label:"Training templates",allowedRoles:[ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer]},
    {to:"/training/plans",label:"Training plans",allowedRoles:TRAINING_ROLES},
    {to:"/training/sessions",label:"Training sessions",allowedRoles:TRAINING_ROLES},
];
export function getNavigationForRole(role) {return isKnownRole(role) ? items.filter(item=>isRoleAllowed(role,item.allowedRoles)) : [];}
