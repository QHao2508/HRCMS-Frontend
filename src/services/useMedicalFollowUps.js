import { useCallback } from 'react';
import { useRegistrationResource } from '../context/useRegistrationResource.js';
import { getMedicalFollowUps } from './medicalService.js';
import { allMedicalPages } from './medicalValidation.js';

/** Tải lịch sử tái khám để gom hồ sơ cùng ca bệnh; lỗi tải không chặn form (rơi về danh sách theo bản sửa). */
export function useMedicalFollowUps(horseId) {
    const load = useCallback(() => horseId ? allMedicalPages(params => getMedicalFollowUps(horseId, params)) : Promise.resolve([]), [horseId]);
    const resource = useRegistrationResource(load, { realtime: true });
    return resource.data || [];
}
