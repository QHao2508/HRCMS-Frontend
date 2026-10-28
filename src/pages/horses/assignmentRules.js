import { ROLES } from '../../constants/roles.js';

// Quy tắc thuần của form phân công (tách khỏi component để test và để React Fast Refresh hoạt động).

/** Vai trò người dùng hiện tại được phép phân công. */
export function assignableRoles(user) {
    return user.role === ROLES.ClubManager ? [ROLES.HeadTrainer, ROLES.Groom, ROLES.Veterinarian] : [ROLES.Trainer];
}

/** Huấn luyện viên trưởng đang phụ trách (null nếu chưa có). */
export function currentHeadTrainer(horse) {
    return horse.assignments.find(a => a.active && a.role === ROLES.HeadTrainer) || null;
}

function personName(person) {
    return person.name || [person.firstName, person.lastName].filter(Boolean).join(' ');
}

/**
 * Lựa chọn trong ô "Nhân sự": Trainer chỉ hiện người phù hợp; khi đổi Huấn luyện viên trưởng thì ẩn người đang phụ trách.
 */
export function staffOptions(people, role, currentHead) {
    return (people || [])
        .filter(person => role !== ROLES.Trainer || person.matches)
        .filter(person => !(role === ROLES.HeadTrainer && person.id === currentHead?.staffId))
        .map(person => ({ value: person.id, label: personName(person) }));
}

/** Body gửi POST /api/horses/{id}/assignments; chỉ kèm trường thuộc vai trò đang chọn. */
export function assignmentRequest(form, { replacingHead }) {
    return {
        staffId: form.staffId,
        role: form.role,
        startDate: form.startDate,
        endDate: form.endDate || null,
        notes: form.notes,
        requiredTrainingType: form.role === ROLES.Trainer ? form.requiredTrainingType : undefined,
        takeOverInProgress: form.role === ROLES.Groom && form.takeOverInProgress,
        takeOverReason: form.role === ROLES.Groom ? form.takeOverReason : undefined,
        changeReason: replacingHead ? form.changeReason.trim() : undefined,
    };
}
