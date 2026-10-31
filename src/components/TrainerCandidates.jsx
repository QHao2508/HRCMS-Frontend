import { MSG, msg } from '../messages/index.js';
import { getEnumLabel } from '../constants/enumLabels.js';
import { serverMessage } from '../messages/serverMessages.js';
import Avatar from './ui/Avatar.jsx';
import StatusBadge from './ui/StatusBadge.jsx';
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
        <ul className="candidate-list">{candidates.map(x => {
            const selected = x.id === selectedId;
            return <li key={x.id} className={'candidate-card' + (x.matches ? ' is-match' : '') + (selected ? ' is-selected' : '')} aria-current={selected || undefined}>
                <div className="candidate-head">
                    <Avatar name={x.name} size="sm" round />
                    <div className="candidate-name"><strong>{x.name}</strong><span>{msg(MSG.SCHED_LOAD_COUNT, { count: x.assignedHorses })}</span></div>
                    <StatusBadge tone={x.matches ? 'success' : 'warning'} dot>{msg(x.matches ? MSG.SCHED_MATCH : MSG.SCHED_NO_MATCH)}</StatusBadge>
                </div>
                <div className="candidate-skills"><span className="candidate-label">{msg(MSG.SCHED_SKILLS)}</span><TrainerSpecialties specialties={x.specialties}/></div>
                {!x.matches && x.issues?.length > 0 && <ul className="candidate-issues">{x.issues.map(issue =>
                    <li key={issue.messageKey + issue.args.join()}>{serverMessage(issue.messageKey, issue.args, msg(MSG.SCHED_NO_MATCH))}</li>)}</ul>}
                {selected ? <p className="candidate-selected">{msg(MSG.SCHED_SELECTED)}</p>
                    : x.matches && onSelect && <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => onSelect(x.id)}>{msg(MSG.SCHED_PICK_TRAINER)}</button>}
            </li>;
        })}</ul>
        {!candidates.some(x => x.matches) && <p className="alert alert-info">{msg(MSG.SCHED_NO_CANDIDATES)}</p>}
    </section>;
}
