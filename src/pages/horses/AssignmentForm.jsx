import { useCallback, useState } from 'react';
import { MSG, msg } from '../../messages/index.js';
import { ROLES } from '../../constants/roles.js';
import { TRAINING_TYPE } from '../../constants/training.js';
import { clubToday } from '../../services/workflowHelpers.js';
import { useMutation } from '../../context/useMutation.js';
import { useRegistrationResource } from '../../context/useRegistrationResource.js';
import { assignStaff, staffDirectory } from '../../services/clubService.js';
import { getTrainerCandidates } from '../../services/trainingSchedulingService.js';
import TrainerCandidates from '../../components/TrainerCandidates.jsx';
import { assignableRoles, assignmentRequest, currentHeadTrainer, staffOptions } from './assignmentRules.js';
import { Field, MutationState, ResourceState } from '../../components/WorkflowUI.jsx';

/*
 * Phân công nhân sự cho một ngựa — ai được làm gì:
 *  - Quản lý câu lạc bộ: giao Huấn luyện viên trưởng, Nhân viên chăm sóc, Bác sĩ thú y.
 *    Mỗi ngựa chỉ có một Huấn luyện viên trưởng; đổi người phải ghi lý do (chủ ngựa, người cũ, người mới được báo).
 *  - Huấn luyện viên trưởng đang phụ trách ngựa: chọn Huấn luyện viên theo chuyên môn.
 *    Danh sách ứng viên do Backend xét bằng đúng quy tắc dùng khi lưu, nên "Phù hợp" là chắc chắn lưu được;
 *    người "Chưa phù hợp" kèm lý do (thiếu chuyên môn, chưa được giao giáo án ngựa đang dùng, trùng lịch…).
 * Lịch sử phân công cũ luôn được giữ lại.
 */

/** Form phân công trên hồ sơ ngựa (chỉ hiện cho Quản lý hoặc Huấn luyện viên trưởng đang phụ trách). */
export default function AssignmentForm({ horse, user, reload }) {
    const horseId = horse.horse.id;
    const isManager = user.role === ROLES.ClubManager;
    const roles = assignableRoles(user);
    const [form, setForm] = useState({
        role: roles[0], staffId: '', startDate: clubToday(), endDate: '', notes: '',
        changeReason: '', takeOverInProgress: false, takeOverReason: '', requiredTrainingType: TRAINING_TYPE.Trot,
    });
    const isTrainer = form.role === ROLES.Trainer;
    const currentHead = currentHeadTrainer(horse);
    const replacingHead = isManager && form.role === ROLES.HeadTrainer && !!currentHead;

    // Trainer: danh sách ứng viên đã xét quy tắc; vai trò khác: danh bạ nhân sự theo vai trò.
    const load = useCallback(
        () => isTrainer ? getTrainerCandidates(horseId, form.requiredTrainingType) : staffDirectory(form.role),
        [horseId, isTrainer, form.role, form.requiredTrainingType]);
    const staff = useRegistrationResource(load);
    const mutation = useMutation();

    function update(name, value) {
        // Đổi vai trò hoặc chuyên môn thì danh sách người đổi theo, nên bỏ lựa chọn cũ.
        setForm(prev => ({ ...prev, [name]: value, ...((name === 'role' || name === 'requiredTrainingType') && { staffId: '' }) }));
    }
    const change = e => update(e.target.name, e.target.value);

    const selectedIsValid = !!form.staffId && (!isTrainer || !!staff.data?.some(x => x.id === form.staffId && x.matches));
    async function submit(e) {
        e.preventDefault();
        if (!selectedIsValid || (replacingHead && !form.changeReason.trim())) return;
        await mutation.run(() => assignStaff(horseId, assignmentRequest(form, { replacingHead })), reload, msg(MSG.DA_PHAN_CONG_NHAN_SU_LICH_SU_PHAN_CONG_DUOC_GIU_LAI));
    }

    return <section className="surface-card">
        <h2>{msg(isManager ? MSG.PHAN_CONG_NHAN_SU_CHINH_THUC : MSG.CHON_TRAINER_PHU_TRACH)}</h2>
        <p className="form-text">{msg(MSG.BR_HANDOVER_HELP)}</p>
        <p className="card-description">{msg(isManager ? MSG.MANAGER_XAC_NHAN_HEADTRAINER_GROOM_VA_BAC_SI_THU_Y_HEADTRAINER_DUOC_GIAO : MSG.CHI_HEADTRAINER_DANG_PHU_TRACH_NGUA_DUOC_CHON_TRAINER)}</p>
        <MutationState mutation={mutation} reload={staff.reload} />
        <ResourceState resource={staff} />
        {isTrainer && staff.data && <TrainerCandidates candidates={staff.data} selectedId={form.staffId} onSelect={id => update('staffId', id)} />}
        {replacingHead && <div className="alert alert-info" role="note">
            <p className="mb-1"><strong>{msg(MSG.HEAD_TRAINER_CURRENT, { name: horse.staffNames[currentHead.staffId] || msg(MSG.NHAN_SU_DA_KET_THUC_PHAN_CONG) })}</strong></p>
            <p className="mb-0">{msg(MSG.HEAD_TRAINER_CHANGE_HELP)}</p>
        </div>}
        <form onSubmit={submit}>
            <fieldset disabled={mutation.pending || mutation.uncertain || staff.loading || !!staff.error}>
                <div className="row g-3">
                    <Field label={msg(MSG.VAI_TRO)} name="role" value={form.role} onChange={change} options={roles} />
                    {isTrainer && <Field label={msg(MSG.SCHED_SPECIALTY)} name="requiredTrainingType" value={form.requiredTrainingType} options={Object.values(TRAINING_TYPE)} onChange={change} required />}
                    <Field label={msg(MSG.NHAN_SU)} name="staffId" value={form.staffId} onChange={change} required
                        options={[{ value: '', label: msg(MSG.CHON_NHAN_SU) }, ...staffOptions(staff.data, form.role, currentHead)]} />
                    <Field label={msg(MSG.NGAY_BAT_DAU)} name="startDate" value={form.startDate} onChange={change} type="date" required />
                    <Field label={msg(MSG.NGAY_KET_THUC)} name="endDate" value={form.endDate} onChange={change} type="date" min={form.startDate} help={msg(MSG.KHONG_BAT_BUOC)} />
                    {replacingHead && <Field label={msg(MSG.HEAD_TRAINER_CHANGE_REASON)} name="changeReason" value={form.changeReason} onChange={change} required multiline maxLength={2000} />}
                    <Field label={msg(MSG.GHI_CHU)} name="notes" value={form.notes} onChange={change} maxLength={2000} />
                </div>
                {form.role === ROLES.Groom && <>
                    <label className="d-flex gap-2 mt-3"><input type="checkbox" checked={form.takeOverInProgress} onChange={e => update('takeOverInProgress', e.target.checked)} />{msg(MSG.BR_TAKEOVER)}</label>
                    {form.takeOverInProgress && <Field name="takeOverReason" label={msg(MSG.BR_REASON)} value={form.takeOverReason} onChange={change} required multiline maxLength={2000} />}
                </>}
                <button className="btn btn-primary mt-3">{msg(MSG.XAC_NHAN_PHAN_CONG)}</button>
            </fieldset>
        </form>
    </section>;
}
