import { FORM_SECTIONS } from './registrationValidation.js';
import { SECTION_STEPS } from '../constants/registrationWizard.js';

export function registrationFieldStep(name) {
    if (name.startsWith('preferred')) return 3;
    return SECTION_STEPS[FORM_SECTIONS.find(section => section.fields.some(field => field.name === name))?.title] ?? 0;
}
export function focusRegistrationField(name, onStep) {
    onStep(registrationFieldStep(name));
    requestAnimationFrame(() => document.getElementById(`registration-${name}`)?.focus());
}
