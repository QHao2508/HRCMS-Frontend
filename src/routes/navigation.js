import { MSG, msg } from "../messages/index.js";
import { ALL_ROLES,ROLES,isKnownRole,isRoleAllowed } from "../constants/roles.js";
import { PERMISSIONS } from "../constants/permissions.js";
export const TRAINING_ROLES = [ROLES.HorseOwner,ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer,ROLES.WorkRider,ROLES.Veterinarian];
const items = [
{to:'/medical/preventive-care',label:msg(MSG.SUPPORT_PREVENTIVE),allowedRoles:ALL_ROLES},
{to:'/care/tasks',label:msg(MSG.SUPPORT_CARE),allowedRoles:PERMISSIONS.careRead},
{to:'/care/incidents',label:msg(MSG.SUPPORT_INCIDENTS),allowedRoles:PERMISSIONS.incidentRead},
{to:'/care/stables',label:msg(MSG.SUPPORT_STABLES),allowedRoles:[ROLES.ClubManager,ROLES.Groom]},
{to:'/inventory',label:msg(MSG.SUPPORT_INVENTORY),allowedRoles:[ROLES.ClubManager,ROLES.Groom]},
{to:'/inventory/issue',label:msg(MSG.FLOW34_CONSUME),allowedRoles:[ROLES.ClubManager,ROLES.Groom]},
{to:'/inventory/replenishments',label:msg(MSG.SUPPORT_REPLENISHMENTS),allowedRoles:[ROLES.ClubManager,ROLES.Groom]},
{to:'/reports',label:msg(MSG.SUPPORT_REPORTS),allowedRoles:ALL_ROLES},
    {to:"/medical",label:msg(MSG.MEDICAL_NAV),allowedRoles:ROLES.Veterinarian},
    {to:"/manager/staff",label:msg(MSG.ADMIN_STAFF),allowedRoles:ROLES.ClubManager},
    {to:"/manager/audit",label:msg(MSG.ADMIN_AUDIT),allowedRoles:ROLES.ClubManager},
    {to:"/manager/website",label:msg(MSG.ADMIN_WEBSITE),allowedRoles:ROLES.ClubManager},
    {to:"/dashboard",label:msg(MSG.TONG_QUAN),allowedRoles:ALL_ROLES},
    {to:"/horses",label:msg(MSG.NGUA_CUA_TOI),allowedRoles:ALL_ROLES},
    {to:"/registrations",label:msg(MSG.YEU_CAU_DANG_KY_NGUA),allowedRoles:ROLES.HorseOwner},
    {to:"/reviews",label:msg(MSG.DUYET_HO_SO),allowedRoles:ROLES.ClubManager},
    {to:"/training/templates",label:msg(MSG.GIAO_AN_MAU),allowedRoles:[ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer]},
    // Vet xem lịch tập trong hồ sơ ngựa (route vẫn mở), không hiện trên menu.
    {to:"/training/plans",label:msg(MSG.KE_HOACH_HUAN_LUYEN),allowedRoles:PERMISSIONS.trainingMenu},
    {to:"/training/sessions",label:msg(MSG.BUOI_TAP),allowedRoles:PERMISSIONS.trainingMenu},
];
/**
 * Lọc menu đã triển khai theo allowlist role; đây là điều hướng, bảo vệ thực tế vẫn nằm ở route/API.
 * @param role Role enum chính xác của backend để kiểm quyền/lọc dữ liệu.
 */
export function getNavigationForRole(role) {return isKnownRole(role) ? items.filter(item=>isRoleAllowed(role,item.allowedRoles)).map(item => item.to === "/horses" ? {...item,label:msg(role === ROLES.HorseOwner ? MSG.NGUA_CUA_TOI : MSG.HORSES_LABEL)} : item) : [];}

/** Group allowed links for every role; omit empty groups and preserve route permissions. */
export function getNavigationGroups(navigation, role) {
    const groups = [
        {id:'horses',label:msg(MSG.NAV_GROUP_HORSES),paths:['/horses','/registrations','/reviews']},
        {id:'training',label:msg(MSG.NAV_GROUP_TRAINING),paths:['/training/templates','/training/plans','/training/sessions']},
        {id:'medical',label:msg(MSG.MEDICAL_NAV),paths:role===ROLES.Veterinarian ? ['/medical','/medical/preventive-care'] : []},
        {id:'care',label:msg(MSG.NAV_GROUP_CARE),paths:[...(role===ROLES.Veterinarian ? [] : ['/medical/preventive-care']),'/care/tasks','/care/incidents','/care/stables']},
        {id:'inventory',label:msg(MSG.NAV_GROUP_INVENTORY),paths:['/inventory','/inventory/issue','/inventory/replenishments']},
        {id:'management',label:msg(role===ROLES.ClubManager ? MSG.NAV_GROUP_MANAGEMENT : MSG.SUPPORT_REPORTS),paths:['/manager/staff','/reports','/manager/audit','/manager/website']},
    ];
    return groups.map(group => ({...group,items:group.paths.map(path=>navigation.find(item=>item.to===path)).filter(Boolean)})).filter(group=>group.items.length);
}