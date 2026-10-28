import { MSG, msg } from '../messages/index.js';
import { getEnumLabel } from '../constants/enumLabels.js';
import { serverMessage } from '../messages/serverMessages.js';
import '../style/training.css';
export function TrainerSpecialties({ specialties = [], required, minimum }) {
    const types = required?.length ? required : specialties.map(skill => skill.trainingType);
    const comparing = required?.length > 0 && [1, 2, 3].includes(minimum);
    if (!types.length) return <span className="muted-caption">{msg(MSG.SCHED_NOT_CONFIRMED)}</span>;
    return <div className="trainer-specialties">{types.map(type => {
        const skill = specialties.find(item => item.trainingType === type);
        const valid = [1, 2, 3].includes(skill?.level);
        const qualified = valid && skill.level >= minimum;
        return <span key={type} className={'badge border ' + (comparing ? qualified ? 'bg-success-subtle text-success-emphasis' : 'bg-warning-subtle text-warning-emphasis' : 'bg-light text-dark')}>
            {getEnumLabel(type)}{' · '}{valid ? msg(MSG['SCHED_LEVEL_' + skill.level]) : msg(MSG.CURRIC_SKILL_MISSING)}
            {comparing && valid && !qualified && <span className="d-block">{msg(MSG.CURRIC_REQUIRED_LEVEL, { level: msg(MSG['SCHED_LEVEL_' + minimum]) })}</span>}
        </span>;
    })}</div>;
}
/**
 * Ứng viên Huấn luyện viên cho một ngựa. Backend xét mỗi người bằng đúng quy tắc dùng khi lưu phân công:
 * "Phù hợp" là chắc chắn lưu được, "Chưa phù hợp" kèm từng lý do (issues: messageKey + args, dịch ở client).
 * @param candidates GET /api/training/trainer-candidates.
 * @param selectedId Người đang chọn trong form.
 * @param onSelect Chọn nhanh một người phù hợp từ bảng (tùy chọn).
 */
export default function TrainerCandidates({ candidates, selectedId, onSelect }) {
    return <section className="trainer-candidates">
        <h3>{msg(MSG.SCHED_CANDIDATES)}</h3>
        <p>{msg(MSG.SCHED_CANDIDATES_HELP)}</p>
        <div className="table-responsive"><table className="table">
            <thead><tr><th scope="col">{msg(MSG.NHAN_SU)}</th><th scope="col">{msg(MSG.SCHED_SKILLS)}</th><th scope="col">{msg(MSG.SCHED_LOAD)}</th><th scope="col">{msg(MSG.TRANG_THAI)}</th></tr></thead>
            <tbody>{candidates.map(x => <tr key={x.id} className={x.id === selectedId ? 'table-success' : ''}>
                <td>{x.name}</td>
                <td><TrainerSpecialties specialties={x.specialties}/></td>
                <td>{x.assignedHorses}</td>
                <td>
                    <span className={x.matches ? 'availability-match' : 'muted-caption'}>{msg(x.matches ? MSG.SCHED_MATCH : MSG.SCHED_NO_MATCH)}</span>
                    {!x.matches && x.issues?.length > 0 && <ul className="candidate-issues">{x.issues.map(issue =>
                        <li key={issue.messageKey + issue.args.join()}>{serverMessage(issue.messageKey, issue.args, msg(MSG.SCHED_NO_MATCH))}</li>)}</ul>}
                    {x.matches && onSelect && x.id !== selectedId && <button type="button" className="btn btn-sm btn-outline-primary d-block mt-1" onClick={() => onSelect(x.id)}>{msg(MSG.SCHED_PICK_TRAINER)}</button>}
                </td>
            </tr>)}</tbody>
        </table></div>
        {!candidates.some(x => x.matches) && <p className="alert alert-info">{msg(MSG.SCHED_NO_CANDIDATES)}</p>}
    </section>;
}
