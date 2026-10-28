import TrainingPhaseField from '../../components/TrainingPhaseField.jsx';
import TrainingSurfaceField from '../../components/TrainingSurfaceField.jsx';
import { useCallback, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { useRegistrationResource } from '../../context/useRegistrationResource.js';
import { useMutation } from '../../context/useMutation.js';
import { MSG, msg } from '../../messages/index.js';
import { INTENSITY, TRAINING_SURFACE } from '../../constants/training.js';
import { ROLES } from '../../constants/roles.js';
import { getEnumLabel } from '../../constants/enumLabels.js';
import { listTemplates, getDefaultTemplates, createTemplate, editTemplate, archiveTemplate } from '../../services/trainingService.js';
import { templateEditorForm, templatePayload, requiredTypes } from '../../services/templateCurriculum.js';
import { PageHeading, ResourceState, Pagination, Field, MutationState } from '../../components/WorkflowUI.jsx';
import TemplateCurriculumEditor from '../../components/TemplateCurriculumEditor.jsx';
import TemplateTrainerAssignment from '../../components/TemplateTrainerAssignment.jsx';

import { useTrainingFormFocus } from '../../context/useTrainingFormFocus.js';
import '../../style/training.css';

const TEMPLATE_DEFAULT = { name:'',goal:'',phase:'Base',distanceMetres:1000,intensity:INTENSITY.Light,surface:TRAINING_SURFACE.Sand,frequencyPerWeek:3,notes:'' };
export function TemplateForm({ form, onChange, onReplace, disabled }) {
    return <fieldset disabled={disabled}><div className="row g-3">
        <Field label={msg(MSG.TEN_GIAO_AN)} name="name" value={form.name} onChange={onChange} required maxLength={200}/>
        <Field label={msg(MSG.MUC_TIEU)} name="goal" value={form.goal} onChange={onChange} required multiline/>
        <TrainingPhaseField key={form.id || form.systemKey || "new"} value={form.phase} onChange={onChange}/>
        <Field label={msg(MSG.QUANG_DUONG_M)} name="distanceMetres" value={form.distanceMetres} onChange={onChange} required type="number" min={1} max={100000}/>
        <Field label={msg(MSG.CUONG_DO)} name="intensity" value={form.intensity} onChange={onChange} options={Object.values(INTENSITY)}/>
        <TrainingSurfaceField value={form.surface} onChange={onChange}/>
        <Field label={msg(MSG.SO_BUOI_MOI_TUAN)} name="frequencyPerWeek" value={form.frequencyPerWeek} onChange={onChange} required type="number" min={1} max={21}/>
        <Field label={msg(MSG.GHI_CHU)} name="notes" value={form.notes} onChange={onChange} multiline/>
        <TemplateCurriculumEditor form={templateEditorForm(form)} onChange={onChange} onReplace={onReplace}/>
    </div></fieldset>;
}
function TemplateTable({ items, canEdit, open, assign, archive }) {
    return <div className="table-responsive" tabIndex={0} role="region" aria-label={msg(MSG.GIAO_AN)}><table className="table template-table"><thead><tr><th>{msg(MSG.GIAO_AN)}</th><th>{msg(MSG.MUC_TIEU)}</th><th>{msg(MSG.CURRIC_REQUIREMENTS)}</th><th>{msg(MSG.BUOI_TUAN)}</th>{canEdit && <th>{msg(MSG.SUPPORT_ACTIONS)}</th>}</tr></thead>
        <tbody>{items.map(template => <tr key={template.id}><td><strong>{template.name}</strong>{template.isSystemDefault && <span className="badge text-bg-success d-block mt-2">{msg(MSG.CURRIC_DEFAULT)}</span>}
            </td>
            <td>{template.goal}</td><td>{requiredTypes(template).map(getEnumLabel).join(', ') || msg(MSG.SCHED_NOT_CONFIRMED)}<div className="form-text">{requiredTypes(template).length && [1, 2, 3].includes(template.minimumExpertiseLevel) ? <>{msg(MSG.CURRIC_MIN_LEVEL)}{' '}{msg(MSG['SCHED_LEVEL_' + template.minimumExpertiseLevel])}</> : msg(MSG.CURRIC_REQUIREMENTS_MISSING)}</div></td>
            <td>{template.frequencyPerWeek}</td>{canEdit && <td><div className="inline-actions">
                <button className="btn btn-outline-primary" onClick={() => open(template, template.isSystemDefault)}>{msg(template.isSystemDefault ? MSG.CURRIC_COPY : MSG.CHINH_SUA)}</button>
                <button className="btn btn-primary" onClick={() => assign(template)}>{msg(MSG.CURRIC_ASSIGN)}</button>
                {!template.isSystemDefault && <button className="btn btn-outline-danger" onClick={() => archive(template)}>{msg(MSG.LUU_TRU)}</button>}
            </div></td>}</tr>)}</tbody></table></div>;
}
export function TemplateList() {
    const { user } = useAuth(); const [page,setPage] = useState(1); const [editing,setEditing] = useState(null);
    const [form,setForm] = useState(() => templateEditorForm(TEMPLATE_DEFAULT)); const [confirmArchive,setConfirmArchive] = useState(null); const [assignedTemplate,setAssignedTemplate] = useState(null);
    const [editorOpening, setEditorOpening] = useState(0); const [assignmentOpening, setAssignmentOpening] = useState(0);
    const editorPanel = useTrainingFormFocus(editing ? editorOpening : null);
    const [archiveOpening, setArchiveOpening] = useState(0);
    const archivePanel = useTrainingFormFocus(confirmArchive ? archiveOpening : null);
    function openArchive(template) { setConfirmArchive(template); setArchiveOpening(value => value + 1); }
    function openAssignment(template) { setAssignedTemplate(template); setAssignmentOpening(value => value + 1); }
    const canEdit = user.role === ROLES.HeadTrainer;
    const showDefaults = [ROLES.HeadTrainer,ROLES.ClubManager].includes(user.role);
    const load = useCallback(() => listTemplates({page,pageSize:20}),[page]);
    const defaultLoad = useCallback(() => showDefaults ? getDefaultTemplates() : Promise.resolve([]),[showDefaults]);
    const resource = useRegistrationResource(load, {realtime:true}); const defaults = useRegistrationResource(defaultLoad, {realtime:true}); const mutation = useMutation();
    function open(record, copy=false) { setEditorOpening(value => value + 1); mutation.reset();setEditing(!record || copy ? 'new' : record.id);setForm(templateEditorForm({...TEMPLATE_DEFAULT,...record})); }
    async function submit(e) { e.preventDefault(); const payload = templatePayload(form); await mutation.run(() => editing === 'new' ? createTemplate(payload) : editTemplate(editing,payload),() => {setEditing(null);resource.reload();}); }
    const personal = resource.data?.items.filter(template => !showDefaults || !template.isSystemDefault) || [];
    return <section className="training-page"><PageHeading title={msg(MSG.GIAO_AN_HUAN_LUYEN_TIEU_CHUAN)} description={msg(MSG.CURRIC_PAGE_HELP)} action={canEdit && <button className="btn btn-primary" onClick={() => open(null)} disabled={mutation.pending}>{msg(MSG.TAO_GIAO_AN)}</button>}/>
        <MutationState mutation={mutation} reload={resource.reload}/>
        {editing && <section ref={editorPanel} className="surface-card training-action-panel"><h2 tabIndex={-1} data-training-form-heading>{msg(editing === 'new' ? MSG.TAO_GIAO_AN : MSG.CHINH_SUA_GIAO_AN)}</h2><form onSubmit={submit}><TemplateForm form={form} onChange={e => setForm({...form,[e.target.name]:e.target.value})} onReplace={setForm} disabled={mutation.pending || mutation.uncertain}/>
            <div className="wizard-actions"><button type="button" className="btn btn-outline-primary" onClick={() => setEditing(null)}>{msg(MSG.HUY)}</button><button className="btn btn-success" disabled={mutation.pending || mutation.uncertain || !form.requiredTrainingTypes.length}>{msg(MSG.LUU_GIAO_AN)}</button></div></form></section>}
        {assignedTemplate && <TemplateTrainerAssignment key={assignedTemplate.id} template={assignedTemplate} opening={assignmentOpening} onClose={() => setAssignedTemplate(null)}/>}
        {showDefaults && <section className="surface-card"><h2>{msg(MSG.CURRIC_DEFAULT_TITLE)}</h2><p>{msg(MSG.CURRIC_ILLUSTRATIVE)}</p><ResourceState resource={defaults}/>{defaults.data && <TemplateTable items={defaults.data} canEdit={canEdit} open={open} assign={openAssignment} archive={openArchive}/>}</section>}
        <section className="surface-card"><h2>{msg(showDefaults ? MSG.CURRIC_CUSTOM_TITLE : MSG.CURRIC_ASSIGNED_TITLE)}</h2><ResourceState resource={resource}/>{resource.data && <><TemplateTable items={personal} canEdit={canEdit} open={open} assign={openAssignment} archive={openArchive}/>
            {!personal.length && <p className="empty-state">{msg(MSG.CURRIC_NO_ASSIGNED)}</p>}<Pagination data={resource.data} onChange={setPage}/></>}</section>
        {confirmArchive && <section ref={archivePanel} className="surface-card training-action-panel"><p tabIndex={-1} data-training-form-heading>{msg(MSG.LUU_TRU_GIAO_AN)}{confirmArchive.name}{msg(MSG.CAC_PLAN_DA_TAO_VAN_DUOC_GIU_LAI)}</p><div className="inline-actions"><button className="btn btn-outline-primary" onClick={() => setConfirmArchive(null)}>{msg(MSG.GIU_GIAO_AN)}</button><button className="btn btn-primary" disabled={mutation.pending || mutation.uncertain} onClick={() => mutation.run(() => archiveTemplate(confirmArchive.id),() => {setConfirmArchive(null);resource.reload();})}>{msg(MSG.XAC_NHAN_LUU_TRU)}</button></div></section>}
    </section>;
}
