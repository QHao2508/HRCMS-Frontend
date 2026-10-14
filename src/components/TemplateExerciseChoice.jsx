import { MSG, msg } from '../messages/index.js';
import { Field } from './WorkflowUI.jsx';
import { curriculumOf, OTHER_OPTION } from '../services/templateCurriculum.js';
export default function TemplateExerciseChoice({ template, form, onChange }) {
    const options = curriculumOf(template)?.sessionOptions || [];
    if (!template) return null;
    return <Field wide name="templateExerciseKey" label={msg(MSG.CURRIC_EXERCISE_CHOICE)} value={form.useCustomExercise ? OTHER_OPTION : form.templateExerciseKey || ''} required onChange={onChange}
        help={msg(MSG.CURRIC_CHOICE_HELP)} options={[{ value: '', label: msg(MSG.CURRIC_SELECT) },
            ...options.map(option => ({ value: option.key, label: option.label + ' · ' + option.distanceMetres + ' m · ' + option.durationMinutes + ' ' + msg(MSG.CURRIC_MINUTES) })),
            { value: OTHER_OPTION, label: msg(MSG.CURRIC_OTHER) }]} />;
}