import { ROLES } from '../constants/roles.js';

// The invitation endpoint accepts only active internal accounts awaiting verification.
export const canResendStaffInvitation = staff => Boolean(staff?.active && !staff.emailVerified && staff.role !== ROLES.HorseOwner);
