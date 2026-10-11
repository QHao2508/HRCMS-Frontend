import { MSG, msg } from "../messages/index.js";
import { ALL_ROLES,ROLES,isKnownRole,isRoleAllowed } from "../constants/roles.js";
export const TRAINING_ROLES = [ROLES.HorseOwner,ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer,ROLES.WorkRider,ROLES.Veterinarian];
const items = [
    {to:"/manager/staff",label:msg(MSG.ADMIN_STAFF),allowedRoles:ROLES.ClubManager},
    {to:"/manager/audit",label:msg(MSG.ADMIN_AUDIT),allowedRoles:ROLES.ClubManager},
    {to:"/manager/website",label:msg(MSG.ADMIN_WEBSITE),allowedRoles:ROLES.ClubManager},
    {to:"/dashboard",label:msg(MSG.TONG_QUAN),allowedRoles:ALL_ROLES},
    {to:"/horses",label:msg(MSG.NGUA_CUA_TOI),allowedRoles:ALL_ROLES},
    {to:"/registrations",label:msg(MSG.YEU_CAU_DANG_KY_NGUA),allowedRoles:ROLES.HorseOwner},
    {to:"/reviews",label:msg(MSG.DUYET_HO_SO),allowedRoles:ROLES.ClubManager},
    {to:"/training/templates",label:msg(MSG.GIAO_AN_MAU),allowedRoles:[ROLES.ClubManager,ROLES.HeadTrainer,ROLES.Trainer]},
    {to:"/training/plans",label:msg(MSG.KE_HOACH_HUAN_LUYEN),allowedRoles:TRAINING_ROLES},
    {to:"/training/sessions",label:msg(MSG.BUOI_TAP),allowedRoles:TRAINING_ROLES},
];
/**
 * Lọc menu đã triển khai theo allowlist role; đây là điều hướng, bảo vệ thực tế vẫn nằm ở route/API.
 * @param role Role enum chính xác của backend để kiểm quyền/lọc dữ liệu.
 */
export function getNavigationForRole(role) {return isKnownRole(role) ? items.filter(item=>isRoleAllowed(role,item.allowedRoles)).map(item => item.to === "/horses" ? {...item,label:msg(role === ROLES.HorseOwner ? MSG.NGUA_CUA_TOI : MSG.HORSES_LABEL)} : item) : [];}
