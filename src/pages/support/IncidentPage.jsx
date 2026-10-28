import { canUploadIncidentPhoto } from '../../services/careUi.js';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { useMutation } from '../../context/useMutation.js';
import { useRegistrationResource } from '../../context/useRegistrationResource.js';
import { MSG, msg } from '../../messages/index.js';
import { PageHeading, MutationState, ResourceState } from '../../components/WorkflowUI.jsx';
import { HorseSelect, SupportForm, SupportTable } from '../../components/SupportUI.jsx';
import { useChoices, usePaged, when } from '../../services/supportResources.js';
import { change, id, read } from '../../services/supportService.js';
import api from '../../services/api.js';
import { can, canResolveIncident } from '../../constants/permissions.js';
import { localDateTime, scheduledPayload } from '../../services/workflowHelpers.js';
const types = ['TrainingObservation', 'CareObservation', 'Health', 'Training', 'Stable', 'Feeding', 'Other'];
const severities = ['NeedsReview', 'Low', 'Medium', 'High', 'Critical'];
const typeLabels = [MSG.SUPPORT_TRAINING_OBSERVATION, MSG.SUPPORT_CARE_OBSERVATION, MSG.SUPPORT_HEALTH, MSG.SUPPORT_TRAINING, MSG.SUPPORT_STABLES, MSG.SUPPORT_FEEDING, MSG.MEDICAL_OTHER];
const severityLabels = [MSG.SUPPORT_NEEDS_REVIEW, MSG.SUPPORT_LOW, MSG.SUPPORT_MEDIUM, MSG.SUPPORT_HIGH, MSG.MEDICAL_CRITICAL];
export default function IncidentPage() {
    const { user } = useAuth(); const horses = useChoices('/api/horses'); const [horseId, setHorseId] = useState('');
    return <><PageHeading title={msg(MSG.SUPPORT_INCIDENTS)} /><HorseSelect resource={horses} value={horseId} onChange={setHorseId} optional /><IncidentList key={horseId} horseId={horseId} horses={horses.data || []} user={user} /></>;
}
function IncidentList({ horseId, horses, user }) {
    const resource = usePaged('/api/care/incidents', { horseId: horseId || undefined }); const [selected, setSelected] = useState(null);
    return <>{horseId && can(user, 'incidentReport') && <SupportForm collapsible submitLabel={msg(MSG.SUPPORT_REPORT_INCIDENT)} title={msg(MSG.SUPPORT_REPORT_INCIDENT)} reload={resource.reload} initial={{ occurredAt: localDateTime(new Date()), type: types[0], description: '', severity: severities[0], routedTo: 'Veterinarian' }} submit={async f => { const created = await change('/api/care/incidents', { ...f, horseId, occurredAt: scheduledPayload(f.occurredAt) }); setSelected(created); return created; }} fields={[
        { name: 'occurredAt', label: msg(MSG.SUPPORT_OCCURRED), type: 'datetime-local', required: true }, { name: 'type', label: msg(MSG.SUPPORT_TYPE), options: types.map((value, i) => ({ value, label: msg(typeLabels[i]) })), required: true },
        { name: 'severity', label: msg(MSG.SUPPORT_SEVERITY), options: severities.map((value, i) => ({ value, label: msg(severityLabels[i]) })), required: true }, { name: 'routedTo', label: msg(MSG.SUPPORT_ROUTED_TO), options: [{ value: 'Veterinarian', label: msg(MSG.HOME_REFERENCE_VET) }, { value: 'Trainer', label: msg(MSG.HOME_REFERENCE_TRAINER) }], required: true },
        { name: 'description', label: msg(MSG.SUPPORT_DESCRIPTION), multiline: true, required: true, maxLength: 4000, help: msg(MSG.INCIDENT_PHOTO_AFTER_SAVE) },
    ]} />}
        <SupportTable resource={resource} columns={[{ key: 'horseId', label: msg(MSG.MEDICAL_HORSE), render: x => horses.find(h => h.id === x.horseId)?.name || x.horseId }, { key: 'occurredAt', label: msg(MSG.SUPPORT_OCCURRED), render: x => when(x.occurredAt) }, { key: 'type', label: msg(MSG.SUPPORT_TYPE), render: x => msg(typeLabels[types.indexOf(x.type)] || MSG.CHUA_XAC_DINH) }, { key: 'severity', label: msg(MSG.SUPPORT_SEVERITY), render: x => <span className={`badge text-bg-${({ Low: 'info', Medium: 'warning', High: 'danger', Critical: 'danger', NeedsReview: 'secondary' })[x.severity] || 'secondary'}`}>{msg(severityLabels[severities.indexOf(x.severity)] || MSG.CHUA_XAC_DINH)}</span> }, { key: 'description', label: msg(MSG.SUPPORT_DESCRIPTION) }, { key: 'resolved', label: msg(MSG.TRANG_THAI), render: x => <span className={`badge text-bg-${x.resolved ? 'success' : 'warning'}`}>{msg(x.resolved ? MSG.SUPPORT_RESOLVED : MSG.SUPPORT_NEEDS_REVIEW)}</span> }]} actions={row => <button className="btn btn-outline-primary" onClick={() => setSelected(row)}>{msg(MSG.CHI_TIET)}</button>} />
        {selected && <IncidentDetails key={selected.id} incident={selected} user={user} reload={() => { setSelected(null); resource.reload(); }} />}
    </>;
}
function IncidentDetails({ incident, user, reload }) {
    const base = `/api/care/incidents/${id(incident.id)}`; const load = useCallback(() => read(`${base}/photos`), [base]); const resource = useRegistrationResource(load);
    const mutation = useMutation(); const [file, setFile] = useState(null);
    useEffect(() => { document.getElementById("incident-details")?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [incident.id]);
    return <section id="incident-details" className="surface-card incident-details"><h2>{msg(MSG.SUPPORT_INCIDENT_DETAILS)}</h2><p>{incident.description}</p>{incident.resolved && <><h3>{msg(MSG.BR_RESOLUTION)}</h3><p>{incident.resolution || "—"}</p><p>{msg(MSG.BR_RESOLVED_AT)}{' '}{when(incident.resolvedAt)}</p></>}<MutationState mutation={mutation} reload={() => { resource.reload(); reload(); }} /><ResourceState resource={resource} />
        <h3>{msg(MSG.INCIDENT_PHOTO_TITLE)}</h3><p className="form-text">{msg(incident.resolved ? MSG.INCIDENT_PHOTO_RESOLVED : incident.reporterId !== user.id ? MSG.INCIDENT_PHOTO_REPORTER_ONLY : MSG.INCIDENT_PHOTO_HELP)}</p>
        {resource.data?.map(photo => <IncidentPhoto key={photo.id} base={base} photo={photo} />)}
        {!resource.data?.length && <p>{msg(MSG.SUPPORT_NO_PHOTOS)}</p>}
        {canUploadIncidentPhoto(incident, user) && <form onSubmit={e => { e.preventDefault(); mutation.run(() => { if (!file || !['image/png', 'image/jpeg'].includes(file.type) || file.size > 10485760) throw Object.assign(new Error(msg(MSG.SUPPORT_PHOTO_INVALID)), { status: 400 }); const data = new FormData(); data.append('file', file); return change(`${base}/photos`, data); }, () => { setFile(null); document.getElementById("incident-photo").value = ""; resource.reload(); }); }}>
            <fieldset disabled={mutation.pending || mutation.uncertain}><label htmlFor="incident-photo" className="form-label">{msg(MSG.SUPPORT_UPLOAD_PHOTO)}</label><input id="incident-photo" className="form-control" type="file" accept="image/png,image/jpeg" required onChange={e => setFile(e.target.files[0] || null)} /><button className="btn btn-primary mt-3" disabled={!file}>{msg(MSG.SUPPORT_UPLOAD_PHOTO)}</button></fieldset>
        </form>}
        {!incident.resolved && <p>{msg(MSG.INCIDENT_ROUTED_NOW)}{': '}{incident.routedTo === 'Trainer' ? msg(MSG.HOME_REFERENCE_TRAINER) : msg(MSG.HOME_REFERENCE_VET)}</p>}
        {!incident.resolved && can(user, 'incidentReroute') && <SupportForm key={`route-${incident.routedTo}`} title={msg(MSG.INCIDENT_REROUTE)} initial={{ routedTo: incident.routedTo === 'Trainer' ? 'Veterinarian' : 'Trainer' }} reload={reload} fields={[{ name: 'routedTo', label: msg(MSG.SUPPORT_ROUTED_TO), help: msg(MSG.INCIDENT_REROUTE_HELP), options: [{ value: 'Veterinarian', label: msg(MSG.HOME_REFERENCE_VET) }, { value: 'Trainer', label: msg(MSG.HOME_REFERENCE_TRAINER) }], required: true }]} submit={f => change(`${base}/route`, { routedTo: f.routedTo })} />}
        {canResolveIncident(user, incident) && <SupportForm submitLabel={msg(MSG.SUPPORT_RESOLVE)} title={msg(MSG.SUPPORT_RESOLVE)} initial={{ resolution: '' }} reload={reload} fields={[{ name: 'resolution', label: msg(MSG.BR_RESOLUTION), help: msg(MSG.BR_RESOLUTION_HELP), required: true, multiline: true, maxLength: 2000 }]} submit={f => change(`${base}/resolve`, { resolution: f.resolution.trim() })} />}
    </section>;
}
function IncidentPhoto({ base, photo }) {
    const [url, setUrl] = useState(null); const [error, setError] = useState(null);
    useEffect(() => { let active = true, objectUrl; api.get(`${base}/photos/${id(photo.id)}`, { responseType: 'blob' }).then(r => { if (active) { objectUrl = URL.createObjectURL(r.data); setUrl(objectUrl); } }).catch(e => { if (active) setError(e); }); return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); }; }, [base, photo.id]);
    return <figure>{url && <><img src={url} alt={photo.fileName} style={{ maxWidth: '100%', maxHeight: 300 }} /><figcaption><a className="action-link" href={url} download={photo.fileName}>{photo.fileName}</a></figcaption></>}{error && <p role="alert">{error.message}</p>}</figure>;
}
