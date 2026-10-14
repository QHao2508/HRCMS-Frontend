import { MSG, msg } from '../messages/index.js';
import { Field } from './WorkflowUI.jsx';
import { curriculumOf, planOptions, OTHER_OPTION } from '../services/templateCurriculum.js';
export default function TemplatePlanChoice({ template, form, onChange }) {
    if (!template) return null;
    const options = planOptions(template);
    const value = form.useCustomPlan ? OTHER_OPTION : form.templatePlanOptionKey || (!curriculumOf(template) ? '__legacy' : '');
    return <Field wide name="templatePlanOptionKey" label={msg(MSG.CURRIC_PLAN_CHOICE)} value={value} required onChange={onChange}
        help={msg(MSG.CURRIC_CHOICE_HELP)} options={[{ value: '', label: msg(MSG.CURRIC_SELECT) }, ...options.map(option => ({ value: option.key, label: option.label })), { value: OTHER_OPTION, label: msg(MSG.CURRIC_OTHER) }]} />;
}