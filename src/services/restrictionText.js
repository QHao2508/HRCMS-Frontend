import { MSG, msg } from '../messages/index.js';
import { getEnumLabel } from '../constants/enumLabels.js';

/** Mô tả ngắn một hạn chế vận động từ các cờ backend (khóa tập, cấm nước rút, cường độ / cự ly tối đa). */
export function restrictionText(r) {
    const parts = [];
    if (r.blockAllTraining) parts.push(msg(MSG.HMED_BLOCK_ALL));
    if (r.trainingLock) parts.push(msg(MSG.HMED_LOCK));
    if (r.noSprint) parts.push(msg(MSG.HMED_NO_SPRINT));
    if (r.maxIntensity) parts.push(msg(MSG.HMED_MAX_INTENSITY, { value: getEnumLabel(r.maxIntensity) }));
    if (r.maxDistanceMetres != null) parts.push(msg(MSG.HMED_MAX_DISTANCE, { value: r.maxDistanceMetres }));
    return parts.join(' · ');
}
