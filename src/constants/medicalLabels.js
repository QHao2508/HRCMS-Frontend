import { MSG, msg } from '../messages/index.js';
import { getEnumLabel } from './enumLabels.js';

const labels = Object.freeze({ Muscle: MSG.MEDICAL_MUSCLE, Tendon: MSG.MEDICAL_TENDON, Ligament: MSG.MEDICAL_LIGAMENT, Bone: MSG.MEDICAL_BONE, Joint: MSG.MEDICAL_JOINT, Hoof: MSG.MEDICAL_HOOF, Wound: MSG.MEDICAL_WOUND, Other: MSG.MEDICAL_OTHER, Mild: MSG.MEDICAL_MILD, Severe: MSG.MEDICAL_SEVERE, Critical: MSG.MEDICAL_CRITICAL, Recovering: MSG.MEDICAL_RECOVERING, Recovered: MSG.MEDICAL_RECOVERED, All: MSG.MERGED_UI_499 });
export function getMedicalLabel(value) { return Object.hasOwn(labels, value) ? msg(labels[value]) : getEnumLabel(value); }
export function getInjuryStatusLabel(value) { return value === 'Active' ? msg(MSG.MEDICAL_INJURY_ACTIVE) : getMedicalLabel(value); }
