import { TRAINING_TYPE, INTENSITY } from '../constants/training.js';
export const OTHER_OPTION = '__other';
export function trainerEligibility(template, candidate) {
    const required = requiredTypes(template);
    if (!required.length || ![1, 2, 3].includes(template.minimumExpertiseLevel)) return 'RequirementsMissing';
    if (candidate.eligibility) return ['Eligible', 'MissingSpecialty', 'BelowMinimumLevel', 'RequirementsMissing'].includes(candidate.eligibility) ? candidate.eligibility : 'Unverified';
    // Compatibility with older responses: never infer permission from matches alone.
    const skills = candidate.specialties || [];
    if (required.some(type => !skills.some(skill => skill.trainingType === type))) return 'MissingSpecialty';
    if (required.some(type => !skills.some(skill => skill.trainingType === type && skill.level >= template.minimumExpertiseLevel))) return 'BelowMinimumLevel';
    return candidate.matches === true ? 'Eligible' : 'Unverified';
}
export function canAssignTrainer(template, candidate) {
    return !!candidate && candidate.matches === true && !candidate.assigned && trainerEligibility(template, candidate) === 'Eligible';
}
export function curriculumOf(template) {
    if (!template?.curriculumJson) return null;
    try { const value = JSON.parse(template.curriculumJson); return Array.isArray(value.planOptions) && Array.isArray(value.sessionOptions) ? value : null; }
    catch { return null; }
}
export function requiredTypes(template) {
    try { const types = JSON.parse(template?.requiredTrainingTypesJson || '[]'); return Array.isArray(types) ? types.filter(type => Object.values(TRAINING_TYPE).includes(type)) : []; }
    catch { return []; }
}
export function planOptions(template) {
    return curriculumOf(template)?.planOptions || (template ? [{ key: '__legacy', label: template.name, goal: template.goal, phase: template.phase }] : []);
}
export function choosePlanOption(form, template, key) {
    if (key === OTHER_OPTION) return { ...form, templatePlanOptionKey: null, useCustomPlan: true };
    const option = planOptions(template).find(item => item.key === key);
    return { ...form, templatePlanOptionKey: curriculumOf(template) ? option?.key || null : null,
        useCustomPlan: false, goal: option?.goal || '', phase: option?.phase || '' };
}
export function initialPlanForm(plan, template) {
    if (plan.useCustomPlan || !template) return { ...plan, useCustomPlan: true, templatePlanOptionKey: null };
    const option = planOptions(template).find(item => item.goal === plan.goal && item.phase === plan.phase);
    return option ? choosePlanOption(plan, template, option.key) : { ...plan, useCustomPlan: true, templatePlanOptionKey: null };
}
export function chooseExercise(form, template, key) {
    if (key === OTHER_OPTION) { const types = requiredTypes(template); return { ...form, trainingType: !types.length || types.includes(form.trainingType) ? form.trainingType : types[0], templateExerciseKey: null, useCustomExercise: true }; }
    const option = curriculumOf(template)?.sessionOptions.find(item => item.key === key);
    if (!option) return { ...form, templateExerciseKey: null, useCustomExercise: false };
    return { ...form, trainingType: option.trainingType, distanceMetres: option.distanceMetres, intensity: option.intensity,
        surface: option.surface, target: option.target, durationMinutes: option.durationMinutes,
        templateExerciseKey: option.key, useCustomExercise: false };
}
export function initialSessionForm(session, template) {
    const options = curriculumOf(template)?.sessionOptions || [];
    if (session.useCustomExercise || !options.length) return { ...session, templateExerciseKey: null, useCustomExercise: true };
    const match = options.find(option => option.trainingType === session.trainingType && Number(option.distanceMetres) === Number(session.distanceMetres)
        && option.intensity === session.intensity && option.surface === session.surface && option.target === session.target
        && option.durationMinutes === session.durationMinutes);
    return match ? chooseExercise(session, template, match.key) : { ...session, templateExerciseKey: null, useCustomExercise: true };
}
export function templateEditorForm(template = {}) {
    const options = template.sessionOptions || curriculumOf(template)?.sessionOptions || [{
        key: 'exercise-1', label: template.name || '', trainingType: TRAINING_TYPE.Trot,
        distanceMetres: template.distanceMetres || 1000, intensity: template.intensity || INTENSITY.Light,
        surface: template.surface || '', durationMinutes: 30, target: template.goal || '',
    }];
    return { ...template, requiredTrainingTypes: template.requiredTrainingTypes || (requiredTypes(template).length ? requiredTypes(template) : [TRAINING_TYPE.Trot]),
        minimumExpertiseLevel: template.minimumExpertiseLevel || 1, sessionOptions: options.map(option => ({ ...option })) };
}
export function templatePayload(form) {
    return {
        name: form.name.trim(), goal: form.goal.trim(), phase: form.phase.trim(), distanceMetres: Number(form.distanceMetres),
        intensity: form.intensity, surface: form.surface.trim(), frequencyPerWeek: Number(form.frequencyPerWeek), notes: form.notes || '',
        requiredTrainingTypes: form.requiredTrainingTypes, minimumExpertiseLevel: Number(form.minimumExpertiseLevel),
        curriculum: { planOptions: [{ key: 'standard', label: form.name.trim(), goal: form.goal.trim(), phase: form.phase.trim() }],
            sessionOptions: form.sessionOptions.map(option => ({ ...option, distanceMetres: Number(option.distanceMetres), durationMinutes: Number(option.durationMinutes) })) },
    };
}
