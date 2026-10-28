import TrainingSurfaceField from './TrainingSurfaceField.jsx';
import { MSG, msg } from '../messages/index.js';
import { Field } from './WorkflowUI.jsx';
import { TRAINING_TYPE, INTENSITY } from '../constants/training.js';
import { getEnumLabel } from '../constants/enumLabels.js';
import { withRequiredTypes } from '../services/templateCurriculum.js';
/**
 * Phần "Chuyên môn huấn luyện viên cần có" và các bài tập của giáo án.
 * Chọn từ một chuyên môn trở lên; không bỏ được chuyên môn cuối cùng. Bỏ một chuyên môn thì bài tập đang dùng nó chuyển sang chuyên môn còn lại.
 * @param onReplace Thay cả form (cần khi đổi chuyên môn vì bài tập đổi theo).
 */
export default function TemplateCurriculumEditor({ form, onChange, onReplace }) {
    const update = (name, value) => onChange({ target: { name, value } });
    const updateExercise = (index, name, value) => update('sessionOptions', form.sessionOptions.map((option, i) => i === index ? { ...option, [name]: value } : option));
    return <section className="col-12"><h3>{msg(MSG.CURRIC_REQUIREMENTS)}</h3><p className="form-text">{msg(MSG.CURRIC_REQUIREMENTS_HELP)}</p>
        <div className="d-flex flex-wrap gap-3 mb-3">{Object.values(TRAINING_TYPE).map(type => <label key={type} className="form-check">
            <input className="form-check-input" type="checkbox" checked={form.requiredTrainingTypes.includes(type)}
                disabled={form.requiredTrainingTypes.length === 1 && form.requiredTrainingTypes.includes(type)} onChange={e => {
                const types = e.target.checked ? [...form.requiredTrainingTypes, type] : form.requiredTrainingTypes.filter(value => value !== type);
                onReplace(withRequiredTypes(form, types));
            }}/><span className="form-check-label">{getEnumLabel(type)}</span></label>)}</div>
        <div className="row"><Field name="minimumExpertiseLevel" label={msg(MSG.CURRIC_MIN_LEVEL)} value={form.minimumExpertiseLevel} onChange={onChange} options={[1,2,3].map(value => ({ value, label: msg(MSG['SCHED_LEVEL_' + value]) }))}/></div>
        <h3 className="mt-4">{msg(MSG.CURRIC_EXERCISE_OPTIONS)}</h3>
        {form.sessionOptions.map((option, index) => <section key={option.key} className="surface-card"><div className="row g-3">
            <Field name="label" label={msg(MSG.CURRIC_OPTION_NAME)} value={option.label} required maxLength={200} onChange={e => updateExercise(index, 'label', e.target.value)}/>
            <Field name="trainingType" label={msg(MSG.LOAI_BAI_TAP)} value={option.trainingType} options={form.requiredTrainingTypes} required onChange={e => updateExercise(index, 'trainingType', e.target.value)}/>
            <Field name="distanceMetres" label={msg(MSG.QUANG_DUONG_M)} type="number" min={1} max={100000} value={option.distanceMetres} required onChange={e => updateExercise(index, 'distanceMetres', e.target.value)}/>
            <Field name="durationMinutes" label={msg(MSG.BR_DURATION)} type="number" min={1} max={480} value={option.durationMinutes} required onChange={e => updateExercise(index, 'durationMinutes', e.target.value)}/>
            <Field name="intensity" label={msg(MSG.CUONG_DO)} options={Object.values(INTENSITY)} value={option.intensity} onChange={e => updateExercise(index, 'intensity', e.target.value)}/>
            <TrainingSurfaceField value={option.surface} onChange={e => updateExercise(index, 'surface', e.target.value)}/>
            <Field name="target" label={msg(MSG.MUC_TIEU_BUOI_TAP)} value={option.target} wide required maxLength={1000} onChange={e => updateExercise(index, 'target', e.target.value)}/>
        </div><button type="button" className="btn btn-outline-danger mt-3" disabled={form.sessionOptions.length <= 1} onClick={() => update('sessionOptions', form.sessionOptions.filter((_, i) => i !== index))}>{msg(MSG.SCHED_REMOVE)}</button></section>)}
        <button type="button" className="btn btn-outline-primary" disabled={!form.requiredTrainingTypes.length || form.sessionOptions.length >= 30} onClick={() => update('sessionOptions', [...form.sessionOptions, {
            key: 'exercise-' + Date.now(), label: '', trainingType: form.requiredTrainingTypes[0], distanceMetres: form.distanceMetres,
            durationMinutes: 30, intensity: form.intensity, surface: form.surface, target: form.goal,
        }])}>{msg(MSG.CURRIC_ADD_EXERCISE)}</button>
    </section>;
}