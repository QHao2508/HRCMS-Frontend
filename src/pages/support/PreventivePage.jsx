import { useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { MSG, msg } from '../../messages/index.js';
import { PageHeading } from '../../components/WorkflowUI.jsx';
import { HorseSelect, SupportForm, SupportTable } from '../../components/SupportUI.jsx';
import { useChoices, usePaged } from '../../services/supportResources.js';
import { change, id } from '../../services/supportService.js';
import { clubToday } from '../../services/workflowHelpers.js';
import { displayDate } from '../../services/displayDate.js';
const types = ['Vaccination', 'Deworming', 'Farrier'];
const typeLabels = [MSG.SUPPORT_VACCINATION, MSG.SUPPORT_DEWORMING, MSG.SUPPORT_FARRIER];
export default function PreventivePage() {
    const horses = useChoices('/api/horses'); const [horseId, setHorseId] = useState('');
    return <><PageHeading title={msg(MSG.SUPPORT_PREVENTIVE)} description={msg(MSG.PREVENTIVE_PAGE_HELP)} /><HorseSelect resource={horses} value={horseId} onChange={setHorseId} />{horseId && <PreventiveHorse key={horseId} horseId={horseId} />}</>;
}
function PreventiveHorse({ horseId }) {
    const { user } = useAuth(); const base = `/api/horses/${id(horseId)}/medical/preventive-care`; const resource = usePaged(base);
    const [selected, setSelected] = useState(null);
    return <>{user.role === 'Veterinarian' && <SupportForm collapsible submitLabel={msg(MSG.SUPPORT_SCHEDULE)} title={msg(MSG.SUPPORT_SCHEDULE)} initial={{ type: types[0], dueDate: clubToday(), notes: '' }} reload={resource.reload} submit={f => change(base, f)} fields={[
        { name: 'type', label: msg(MSG.SUPPORT_TYPE), options: types.map((value, i) => ({ value, label: msg(typeLabels[i]) })), required: true },
        { name: 'dueDate', label: msg(MSG.SUPPORT_DUE), type: 'date', required: true }, { name: 'notes', label: msg(MSG.GHI_CHU), multiline: true, maxLength: 4000 },
    ]} />}
        <SupportTable resource={resource} columns={[{ key: 'type', label: msg(MSG.SUPPORT_TYPE), render: x => msg(typeLabels[types.indexOf(x.type)] || MSG.CHUA_XAC_DINH) }, { key: 'dueDate', label: msg(MSG.SUPPORT_DUE) }, { key: 'completedDate', label: msg(MSG.SUPPORT_COMPLETED_DATE) }]} actions={user.role === 'Veterinarian' ? row => !row.completedDate && <button className="btn btn-outline-primary" onClick={() => setSelected(row)}>{msg(MSG.SUPPORT_COMPLETE)}</button> : undefined} />
        {selected && <SupportForm drawer onClose={() => setSelected(null)} key={selected.id} submitLabel={msg(MSG.SUPPORT_COMPLETE)} title={`${msg(MSG.SUPPORT_COMPLETE)} · ${msg(typeLabels[types.indexOf(selected.type)] || MSG.CHUA_XAC_DINH)}`} intro={<p className="form-text">{msg(MSG.SUPPORT_DUE)}{': '}{displayDate(selected.dueDate)}</p>} initial={{ completedDate: clubToday(), notes: '' }} reload={() => { setSelected(null); resource.reload(); }} submit={f => change(`${base}/${id(selected.id)}/complete`, f)} fields={[{ name: 'completedDate', label: msg(MSG.SUPPORT_COMPLETED_DATE), type: 'date', max: clubToday(), required: true }, { name: 'notes', label: msg(MSG.GHI_CHU), multiline: true, maxLength: 4000 }]} />}
    </>;
}
