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
import { ResourceState, Pagination, Field, MutationState } from '../../components/WorkflowUI.jsx';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import '../../style/lists.css';
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
function TemplateTable({ items, canEdit, open, assign, archive, empty }) {
    return <DataTable caption={msg(MSG.GIAO_AN)} rows={items} empty={empty} columns={[
        { key: 'name', label: msg(MSG.GIAO_AN), render: template => <span className="template-name"><strong>{template.name}</strong>{template.isSystemDefault && <StatusBadge tone="success">{msg(MSG.CURRIC_DEFAULT)}</StatusBadge>}</span> },
        { key: 'goal', label: msg(MSG.MUC_TIEU), render: template => template.goal },
        { key: 'requirements', label: msg(MSG.CURRIC_REQUIREMENTS), render: template => <>{requiredTypes(template).map(getEnumLabel).join(', ') || msg(MSG.SCHED_NOT_CONFIRMED)}<div className="form-text">{requiredTypes(template).length && [1, 2, 3].includes(template.minimumExpertiseLevel) ? <>{msg(MSG.CURRIC_MIN_LEVEL)}{': '}{msg(MSG['SCHED_LEVEL_' + template.minimumExpertiseLevel])}</> : msg(MSG.CURRIC_REQUIREMENTS_MISSING)}</div></> },
        { key: 'frequency', label: msg(MSG.BUOI_TUAN), align: 'end', render: template => template.frequencyPerWeek },
        ...(canEdit ? [{ key: 'actions', label: msg(MSG.SUPPORT_ACTIONS), render: template => <div className="inline-actions">
            <button className="btn btn-outline-primary btn-sm" onClick={() => open(template, template.isSystemDefault)}>{msg(template.isSystemDefault ? MSG.CURRIC_COPY : MSG.CHINH_SUA)}</button>
            <button className="btn btn-primary btn-sm" onClick={() => assign(template)}>{msg(MSG.CURRIC_ASSIGN)}</button>
            {!template.isSystemDefault && <button className="btn btn-outline-danger btn-sm" onClick={() => archive(template)}>{msg(MSG.LUU_TRU)}</button>}
        </div> }] : []),
    ]} />;
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
    const busy = mutation.pending || mutation.uncertain;
    return <section className="training-page list-page"><PageHeader title={msg(MSG.GIAO_AN_HUAN_LUYEN_TIEU_CHUAN)} description={msg(MSG.CURRIC_PAGE_HELP)} actions={canEdit && <button className="btn btn-primary" onClick={() => open(null)} disabled={mutation.pending}><Plus size={16} aria-hidden="true" />{msg(MSG.TAO_GIAO_AN)}</button>}/>
        {!editing && <MutationState mutation={mutation} reload={resource.reload}/>}
        <Drawer open={!!editing} size="lg" busy={mutation.pending} title={msg(editing === 'new' ? MSG.TAO_GIAO_AN : MSG.CHINH_SUA_GIAO_AN)} onClose={() => setEditing(null)}>
            <section ref={editorPanel} className="training-action-panel"><MutationState mutation={mutation} reload={resource.reload}/><form onSubmit={submit}><TemplateForm form={form} onChange={e => setForm({...form,[e.target.name]:e.target.value})} onReplace={setForm} disabled={busy}/>
                <div className="hc-drawer-actions"><button type="button" className="btn btn-outline-primary" onClick={() => setEditing(null)} disabled={mutation.pending}>{msg(MSG.HUY)}</button><button className="btn btn-success ms-auto" disabled={busy || !form.requiredTrainingTypes.length}>{msg(MSG.LUU_GIAO_AN)}</button></div></form></section>
        </Drawer>
        {assignedTemplate && <TemplateTrainerAssignment key={assignedTemplate.id} template={assignedTemplate} opening={assignmentOpening} onClose={() => setAssignedTemplate(null)}/>}
        {showDefaults && <section className="hc-card is-flush list-card"><h2 className="list-section-title">{msg(MSG.CURRIC_DEFAULT_TITLE)}</h2><p className="list-section-help">{msg(MSG.CURRIC_ILLUSTRATIVE)}</p><ResourceState resource={defaults}/>{defaults.data && <TemplateTable items={defaults.data} canEdit={canEdit} open={open} assign={openAssignment} archive={openArchive}/>}</section>}
        <section className="hc-card is-flush list-card"><h2 className="list-section-title">{msg(showDefaults ? MSG.CURRIC_CUSTOM_TITLE : MSG.CURRIC_ASSIGNED_TITLE)}</h2><ResourceState resource={resource}/>{resource.data && <><TemplateTable items={personal} canEdit={canEdit} open={open} assign={openAssignment} archive={openArchive} empty={<EmptyState title={msg(MSG.CURRIC_NO_ASSIGNED)} />}/>
            <Pagination data={resource.data} onChange={setPage}/></>}</section>
        <Modal open={!!confirmArchive} busy={mutation.pending} title={msg(MSG.LUU_TRU)} onClose={() => setConfirmArchive(null)} footer={<><button className="btn btn-outline-primary" onClick={() => setConfirmArchive(null)}>{msg(MSG.GIU_GIAO_AN)}</button><button className="btn btn-primary" disabled={busy} onClick={() => mutation.run(() => archiveTemplate(confirmArchive.id),() => {setConfirmArchive(null);resource.reload();})}>{msg(MSG.XAC_NHAN_LUU_TRU)}</button></>}>
            <section ref={archivePanel}><p tabIndex={-1} data-training-form-heading>{msg(MSG.LUU_TRU_GIAO_AN)}{confirmArchive?.name}{msg(MSG.CAC_PLAN_DA_TAO_VAN_DUOC_GIU_LAI)}</p></section>
        </Modal>
    </section>;
}
