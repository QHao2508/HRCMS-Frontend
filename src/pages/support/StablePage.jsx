import { useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { MSG, msg } from '../../messages/index.js';
import { Field, PageHeading, ResourceState } from '../../components/WorkflowUI.jsx';
import { SupportForm, SupportTable } from '../../components/SupportUI.jsx';
import { choices, supportLabel, useChoices, usePaged, when } from '../../services/supportResources.js';
import { change, id } from '../../services/supportService.js';
export default function StablePage() {
    const { user } = useAuth(); const manager = user.role === 'ClubManager'; const stables = useChoices('/api/care/stables'); const [stableId, setStableId] = useState('');
    const horses = useChoices('/api/horses');
    return <><PageHeading title={msg(MSG.SUPPORT_STABLES)} /><ResourceState resource={stables} />
        {manager && <SupportForm title={msg(MSG.SUPPORT_NEW_STABLE)} initial={{ name: '' }} reload={stables.reload} submit={f => change('/api/care/stables', f)} fields={[{ name: 'name', label: msg(MSG.SUPPORT_NAME), required: true, maxLength: 100 }]} />}
        <section className="surface-card"><Field name="stableId" label={msg(MSG.SUPPORT_STABLE)} value={stableId} options={choices(stables.data)} onChange={e => setStableId(e.target.value)} /></section>
        {stableId && <Stalls key={stableId} stableId={stableId} horses={horses} manager={manager} />}
    </>;
}
function Stalls({ stableId, horses, manager }) {
    const resource = usePaged('/api/care/stalls', { stableId }); const [selected, setSelected] = useState(null);
    return <>{manager && <SupportForm title={msg(MSG.SUPPORT_NEW_STALL)} initial={{ name: '' }} reload={resource.reload} submit={f => change('/api/care/stalls', { ...f, stableId })} fields={[{ name: 'name', label: msg(MSG.SUPPORT_NAME), required: true, maxLength: 100 }]} />}
        <SupportTable resource={resource} columns={[{ key: 'name', label: msg(MSG.SUPPORT_STALL) }, { key: 'cleaningStatus', label: msg(MSG.TRANG_THAI), render: x => supportLabel(x.cleaningStatus) }, { key: 'horseId', label: msg(MSG.MEDICAL_HORSE), render: x => x.occupied ? horses.data?.find(h => h.id === x.horseId)?.name || msg(MSG.SUPPORT_OCCUPIED) : msg(MSG.SUPPORT_VACANT) }]} actions={row => <button className="btn btn-outline-primary" onClick={() => setSelected(row)}>{msg(MSG.CHI_TIET)}</button>} />
        {selected && <section className="surface-card" key={selected.id}><h2>{selected.name}</h2>{manager && !selected.occupied && <SupportForm title={msg(MSG.SUPPORT_OCCUPY)} initial={{ horseId: '' }} reload={() => { setSelected(null); resource.reload(); }} submit={f => change(`/api/care/stalls/${id(selected.id)}/occupancy`, f)} fields={[{ name: 'horseId', label: msg(MSG.MEDICAL_HORSE), options: choices(horses.data), required: true }]} />}
            {manager && selected.occupied && <SupportForm title={msg(MSG.SUPPORT_VACATE)} initial={{ confirm: '' }} reload={() => { setSelected(null); resource.reload(); }} fields={[{ name: 'confirm', label: msg(MSG.SUPPORT_CONFIRM_STALL), required: true }]} submit={f => { if (f.confirm !== selected.name) throw Object.assign(new Error(msg(MSG.SUPPORT_CONFIRM_ERROR)), { status: 400 }); return change(`/api/care/stalls/${id(selected.id)}/vacate`); }} />}
            {(manager || selected.canClean) && selected.cleaningStatus === 'NeedsCleaning' && <SupportForm title={msg(MSG.SUPPORT_MARK_CLEAN)} initial={{ notes: '' }} reload={() => { setSelected(null); resource.reload(); }} fields={[{ name: 'notes', label: msg(MSG.SUPPORT_CLEAN_CONFIRM), required: true }]} submit={() => change(`/api/care/stalls/${id(selected.id)}/cleaned`)} />}
        <StallHistory stallId={selected.id} /></section>}
    </>;
}

function StallHistory({ stallId }) {
    const resource = usePaged(`/api/care/stalls/${id(stallId)}/history`);
    return <><h3>{msg(MSG.FLOW34_STALL_HISTORY)}</h3><SupportTable resource={resource} columns={[{key:'horseName',label:msg(MSG.MEDICAL_HORSE)},{key:'startedAt',label:msg(MSG.FLOW34_STALL_ENTER),render:x=>when(x.startedAt)},{key:'endedAt',label:msg(MSG.FLOW34_STALL_LEAVE),render:x=>x.endedAt ? when(x.endedAt) : msg(MSG.SUPPORT_OCCUPIED)}]}/></>;
}
