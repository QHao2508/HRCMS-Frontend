const rejectedSchedulingCodes = new Set([
    'template_trainer_mismatch', 'outside_working_hours', 'staff_time_off', 'trainer_schedule_overlap',
    'trainer_specialty_mismatch', 'staff_profile_bookings_conflict',
    'trainer_session_in_progress', 'duration_required', 'trainer_unassigned',
    'schedule_overlap', 'rider_conflict', 'medical_block', 'medical_restriction',
]);

export function isUncertainMutationError(error) {
    if (error.status === 409 && rejectedSchedulingCodes.has(error.businessCode)) return false;
    return !error.status || error.status >= 500 || [403, 404, 409].includes(error.status);
}