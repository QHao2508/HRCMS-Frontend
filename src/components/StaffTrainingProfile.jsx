import { useCallback, useState } from 'react';
import { Plus, Trash2, CalendarDays, Clock3 } from 'lucide-react';
import { MSG, msg } from '../messages/index.js';
import { TRAINING_TYPE } from '../constants/training.js';
import { ROLES } from '../constants/roles.js';
import { getEnumLabel } from '../constants/enumLabels.js';
import { getTrainingProfile, saveTrainingProfile } from '../services/trainingSchedulingService.js';
import { toMinute, minuteText } from '../services/trainingSchedulingHelpers.js';
import { localDateTime, scheduledPayload } from '../services/workflowHelpers.js';
import { useRegistrationResource } from '../context/useRegistrationResource.js';
import { useMutation } from '../context/useMutation.js';
import { Field, ResourceState, MutationState } from './WorkflowUI.jsx';
import { useTrainingFormFocus } from '../context/useTrainingFormFocus.js';
import { TrainerSpecialties } from './TrainerCandidates.jsx';
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayLabels = [MSG.SCHED_SUNDAY, MSG.SCHED_MONDAY, MSG.SCHED_TUESDAY, MSG.SCHED_WEDNESDAY, MSG.SCHED_THURSDAY, MSG.SCHED_FRIDAY, MSG.SCHED_SATURDAY];
export default function StaffTrainingProfile({ staff, onClose, opening = staff.id }) {
    const load = useCallback(() => getTrainingProfile(staff.id), [staff.id]);
    const resource = useRegistrationResource(load); const mutation = useMutation();
    const panel = useTrainingFormFocus(opening, !resource.loading);
    return <section ref={panel} className="surface-card training-action-panel training-profile"><div className="d-flex justify-content-between align-items-start gap-2"><h2 tabIndex={-1} data-training-form-heading>{msg(MSG.SCHED_PROFILE)}{' · '}{[staff.firstName, staff.lastName].filter(Boolean).join(' ')}</h2>{onClose && <button type="button" className="btn btn-outline-secondary" onClick={onClose}>{msg(MSG.UI_CLOSE)}</button>}</div><p>{msg(MSG.SCHED_PROFILE_HELP)}</p><ResourceState resource={resource}/><MutationState mutation={mutation} reload={resource.reload}/>{resource.data && <ProfileForm staff={staff} data={resource.data} reload={resource.reload} mutation={mutation}/>}</section>;
}
function ProfileForm({ staff, data, reload, mutation }) {
    const [levels, setLevels] = useState(Object.fromEntries(data.specialties.map(x => [x.trainingType, x.level])));
    const [hours, setHours] = useState(data.workingHours.map(x => ({ dayOfWeek: x.dayOfWeek, start: minuteText(x.startMinute), end: x.endMinute === 1440 ? '00:00' : minuteText(x.endMinute) })));
    const [timeOff, setTimeOff] = useState(data.timeOff.map(x => ({ start: localDateTime(x.start), end: localDateTime(x.end) })));
    const locked = mutation.pending || mutation.uncertain;
    async function submit(e) {
        e.preventDefault();
        await mutation.run(() => {
            const workingHours = hours.map(x => ({ dayOfWeek: x.dayOfWeek, startMinute: toMinute(x.start), endMinute: x.end === '00:00' ? 1440 : toMinute(x.end) }));
            const absences = timeOff.map(x => ({ start: scheduledPayload(x.start), end: scheduledPayload(x.end) }));
            if (workingHours.some(x => !Number.isInteger(x.startMinute) || !Number.isInteger(x.endMinute) || x.endMinute <= x.startMinute) || absences.some(x => !Number.isFinite(Date.parse(x.start)) || Date.parse(x.end) <= Date.parse(x.start))) throw Object.assign(new Error(msg(MSG.SCHED_INVALID_PROFILE)), { status: 400 });
            return saveTrainingProfile(staff.id, { specialties: staff.role === ROLES.Trainer ? Object.entries(levels).filter(([, level]) => Number(level) > 0).map(([trainingType, level]) => ({ trainingType, level: Number(level) })) : [], workingHours, timeOff: absences });
        }, reload, msg(MSG.SCHED_SAVED));
    }
    return <form onSubmit={submit}><fieldset disabled={locked}>{staff.role === ROLES.Trainer && <><h3>{msg(MSG.SCHED_SKILLS)}</h3><p className="form-text">{msg(MSG.SCHED_LEVELS_HELP)}</p><TrainerSpecialties specialties={data.specialties}/><div className="row g-3">{Object.values(TRAINING_TYPE).map(type => <Field key={type} name={'specialty-' + type} label={getEnumLabel(type)} value={levels[type] || ''} onChange={e => setLevels({ ...levels, [type]: e.target.value })} options={[{ value: '', label: msg(MSG.SCHED_NOT_CONFIRMED) }, ...[1, 2, 3].map(value => ({ value, label: msg(MSG['SCHED_LEVEL_' + value]) }))]}/>)}</div></>}<section className="schedule-editor"><div className="schedule-editor-heading"><h3><CalendarDays size={18} aria-hidden="true"/>{msg(MSG.SCHED_SHIFTS)}<span className="schedule-count">{hours.length}</span></h3><button type="button" className="btn btn-outline-primary" disabled={hours.length >= 21} onClick={() => setHours([...hours, { dayOfWeek: 'Monday', start: '06:00', end: '18:00' }])}><Plus size={16} aria-hidden="true"/>{msg(MSG.SCHED_ADD_SHIFT)}</button></div><div className="schedule-columns" aria-hidden="true"><span>{msg(MSG.SCHED_DAY)}</span><span>{msg(MSG.SCHED_START)}</span><span>{msg(MSG.SCHED_END)}</span><span/></div>{hours.map((row, i) => <div className="profile-schedule-row" key={i}><Field label={msg(MSG.SCHED_DAY)} name={'day-' + i} value={row.dayOfWeek} options={weekdays.map((value, d) => ({ value, label: msg(dayLabels[d]) }))} onChange={e => setHours(hours.map((x, j) => j === i ? { ...x, dayOfWeek: e.target.value } : x))}/><Field label={msg(MSG.SCHED_START)} name={'start-' + i} type="time" value={row.start} required onChange={e => setHours(hours.map((x, j) => j === i ? { ...x, start: e.target.value } : x))}/><Field label={msg(MSG.SCHED_END)} name={'end-' + i} type="time" value={row.end} required onChange={e => setHours(hours.map((x, j) => j === i ? { ...x, end: e.target.value } : x))}/><button type="button" className="btn btn-outline-danger schedule-remove" aria-label={`${msg(MSG.SCHED_REMOVE)} · ${msg(dayLabels[weekdays.indexOf(row.dayOfWeek)])} · ${row.start}–${row.end}`} title={msg(MSG.SCHED_REMOVE)} onClick={() => setHours(hours.filter((_, j) => j !== i))}><Trash2 size={16} aria-hidden="true"/></button></div>)}</section><section className="schedule-editor schedule-time-off"><div className="schedule-editor-heading"><h3><Clock3 size={18} aria-hidden="true"/>{msg(MSG.SCHED_TIME_OFF)}<span className="schedule-count">{timeOff.length}</span></h3><button type="button" className="btn btn-outline-primary" disabled={timeOff.length >= 100} onClick={() => setTimeOff([...timeOff, { start: '', end: '' }])}><Plus size={16} aria-hidden="true"/>{msg(MSG.SCHED_ADD_OFF)}</button></div>{timeOff.length>0 && <div className="schedule-columns" aria-hidden="true"><span>{msg(MSG.SCHED_START)}</span><span>{msg(MSG.SCHED_END)}</span><span/></div>}{timeOff.map((row, i) => <div className="profile-schedule-row" key={i}><Field label={msg(MSG.SCHED_START)} name={'off-start-' + i} type="datetime-local" value={row.start} required onChange={e => setTimeOff(timeOff.map((x, j) => j === i ? { ...x, start: e.target.value } : x))}/><Field label={msg(MSG.SCHED_END)} name={'off-end-' + i} type="datetime-local" value={row.end} required onChange={e => setTimeOff(timeOff.map((x, j) => j === i ? { ...x, end: e.target.value } : x))}/><button type="button" className="btn btn-outline-danger schedule-remove" aria-label={`${msg(MSG.SCHED_REMOVE)} · ${i+1}`} title={msg(MSG.SCHED_REMOVE)} onClick={() => setTimeOff(timeOff.filter((_, j) => j !== i))}><Trash2 size={16} aria-hidden="true"/></button></div>)}</section><div className="schedule-save-bar"><button className="btn btn-primary">{msg(MSG.SCHED_SAVE)}</button></div></fieldset></form>;
}
