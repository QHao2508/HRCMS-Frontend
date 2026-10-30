import { useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { MSG, msg } from '../../messages/index.js';
import { Field, PageHeading, Pagination, ResourceState } from '../../components/WorkflowUI.jsx';
import { SupportForm } from '../../components/SupportUI.jsx';
import { choices, supportLabel, useChoices, usePaged } from '../../services/supportResources.js';
import { change, id } from '../../services/supportService.js';
import { OperationsBadge, OperationsTable } from '../../components/InventoryStableUI.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import { displayText, occupancyState, operationTime, stallHorse, stayState } from '../../services/inventoryStableDisplay.js';
export default function StablePage() {
    const { user } = useAuth(); const manager = user.role === 'ClubManager'; const stables = useChoices('/api/care/stables'); const [stableId, setStableId] = useState('');
    const horses = useChoices('/api/horses');
    // Chưa chọn thì mặc định khu đầu tiên để thấy ngay danh sách ô.
    const activeStableId = stableId || stables.data?.[0]?.id || '';
    const stable = stables.data?.find(x => x.id === activeStableId);
    return <div className="ops-page"><PageHeading title={msg(MSG.SUPPORT_STABLES)} description={msg(MSG.OPS_STABLE_HELP)} /><ResourceState resource={stables} />
        {manager && <SupportForm collapsible submitLabel={msg(MSG.SUPPORT_NEW_STABLE)} title={msg(MSG.SUPPORT_NEW_STABLE)} initial={{ name: '' }} reload={stables.reload} submit={f => change('/api/care/stables', f)} fields={[{ name: 'name', label: msg(MSG.SUPPORT_NAME), required: true, maxLength: 100 }]} />}
        {!stables.loading && !stables.error && <section className="surface-card ops-filter"><Field name="stableId" label={msg(MSG.SUPPORT_STABLE)} value={activeStableId} options={choices(stables.data)} onChange={e => setStableId(e.target.value)} /><p>{msg(MSG.OPS_SCOPE_HELP)}</p></section>}
        {!stables.loading && !stables.error && (!stables.data?.length ? <p className="surface-card ops-empty" role="status">{msg(MSG.OPS_STABLE_EMPTY)}</p> : !activeStableId && <p className="surface-card ops-empty" role="status">{msg(MSG.OPS_STABLE_SELECT)}</p>)}
        {activeStableId && <Stalls key={activeStableId} stableId={activeStableId} stableName={displayText(stable?.name)} horses={horses} manager={manager} groom={user.role === 'Groom'} />}
    </div>;
}
export function Stalls({ stableId, stableName, horses, manager, groom }) {
    const resource = usePaged('/api/care/stalls', { stableId }); const [selected, setSelected] = useState(null);
    return <>{manager && <SupportForm collapsible submitLabel={msg(MSG.SUPPORT_NEW_STALL)} title={msg(MSG.SUPPORT_NEW_STALL)} initial={{ name: '' }} reload={resource.reload} submit={f => change('/api/care/stalls', { ...f, stableId })} fields={[{ name: 'name', label: msg(MSG.SUPPORT_NAME), required: true, maxLength: 100 }]} />}
        <section className="hc-card ops-stalls" aria-busy={!!resource.loading}><div className="hc-card-head"><h2>{msg(MSG.OPS_STALL_LIST)}</h2>{resource.data && <span className="hc-card-action hl-muted">{stableName}</span>}</div><ResourceState resource={resource} />
            {resource.data && !resource.loading && !resource.error && (!resource.data.items.length ? <div className="ops-empty hc-empty" role="status"><p className="hc-empty-title">{msg(MSG.OPS_EMPTY_STALLS)}</p></div>
                : <ul className="stall-grid">{resource.data.items.map(x => { const cleaning = { label: supportLabel(x.cleaningStatus), tone: x.cleaningStatus === 'Clean' ? 'success' : x.cleaningStatus === 'NeedsCleaning' ? 'warning' : 'neutral' };
                    return <li key={x.id}><button type="button" className={`stall-tile${x.occupied ? ' is-occupied' : ''}${selected?.id === x.id ? ' is-selected' : ''}`} aria-pressed={selected?.id === x.id} onClick={() => setSelected(x)}>
                        <span className="stall-name">{displayText(x.name)}</span>
                        <span className="stall-horse">{x.occupied ? stallHorse(x, horses.data) : <span className="hl-muted">{msg(MSG.SUPPORT_VACANT)}</span>}</span>
                        <span className="stall-badges"><OperationsBadge state={occupancyState(x.occupied)} /><OperationsBadge state={cleaning} /></span>
                        <span className="stall-meta"><span>{stableName}</span><span className="stall-open">{msg(MSG.CHI_TIET)}</span></span>
                    </button></li>; })}</ul>)}
            {resource.data && <Pagination data={resource.data} onChange={page => { setSelected(null); resource.setPage(page); }} />}
        </section>
        <Drawer open={!!selected} size="lg" title={selected ? `${displayText(selected.name)} · ${stableName}` : ''} onClose={() => setSelected(null)}>{selected && <div key={selected.id} className="stall-drawer"><dl className="ops-facts">
            <div><dt>{msg(MSG.SUPPORT_STABLE)}</dt><dd>{stableName}</dd></div><div><dt>{msg(MSG.OPS_OCCUPANCY)}</dt><dd><OperationsBadge state={occupancyState(selected.occupied)} /></dd></div><div><dt>{msg(MSG.STALL_CLEANING_STATUS)}</dt><dd>{supportLabel(selected.cleaningStatus)}</dd></div><div><dt>{msg(MSG.MEDICAL_HORSE)}</dt><dd>{stallHorse(selected, horses.data)}</dd></div>
        </dl>{manager && selected.occupied === false && <><ResourceState resource={horses} /><SupportForm disabled={horses.loading || !!horses.error} submitLabel={msg(MSG.SUPPORT_OCCUPY)} title={msg(MSG.SUPPORT_OCCUPY)} initial={{ horseId: '' }} reload={() => { setSelected(null); resource.reload(); }} submit={f => change(`/api/care/stalls/${id(selected.id)}/occupancy`, f)} fields={[{ name: 'horseId', label: msg(MSG.MEDICAL_HORSE), options: choices(horses.data), required: true }]} /></>}
            {manager && selected.occupied === true && <SupportForm submitLabel={msg(MSG.SUPPORT_VACATE)} title={msg(MSG.SUPPORT_VACATE)} initial={{ confirm: '' }} reload={() => { setSelected(null); resource.reload(); }} fields={[{ name: 'confirm', label: msg(MSG.SUPPORT_CONFIRM_STALL), required: true }]} submit={f => { if (f.confirm !== selected.name) throw Object.assign(new Error(msg(MSG.SUPPORT_CONFIRM_ERROR)), { status: 400 }); return change(`/api/care/stalls/${id(selected.id)}/vacate`); }} />}
            {(manager || (groom && selected.canClean === true)) ? <SupportForm submitLabel={msg(MSG.STALL_UPDATE_CLEANING)} title={msg(MSG.STALL_UPDATE_CLEANING)} initial={{ status: selected.cleaningStatus }} reload={() => { setSelected(null); resource.reload(); }} submitDisabled={f => f.status === selected.cleaningStatus} fields={[{ name: 'status', label: msg(MSG.STALL_CLEANING_STATUS), options: ['Clean', 'NeedsCleaning'].map(value => ({ value, label: supportLabel(value) })), required: true }]} submit={f => change(`/api/care/stalls/${id(selected.id)}/cleaning`, { status: f.status }, 'put')} /> : <p className="form-text">{msg(MSG.STALL_NO_CLEAN_PERMISSION)}</p>}
        <StallHistory stallId={selected.id} /></div>}</Drawer>
    </>;
}

export function StallHistory({ stallId }) {
    const resource = usePaged(`/api/care/stalls/${id(stallId)}/history`);
    return <OperationsTable title={msg(MSG.FLOW34_STALL_HISTORY)} emptyText={msg(MSG.OPS_EMPTY_HISTORY)} resource={resource} columns={[
        { key: 'horseName', label: msg(MSG.MEDICAL_HORSE), render: x => displayText(x.horseName, MSG.OPS_HORSE_UNKNOWN) },
        { key: 'startedAt', label: msg(MSG.FLOW34_STALL_ENTER), render: x => operationTime(x.startedAt) },
        { key: 'stay', label: msg(MSG.STALL_STAY_STATUS), render: x => <OperationsBadge state={stayState(x.endedAt)} /> },
        { key: 'endedAt', label: msg(MSG.STALL_LEFT_AT), render: x => x.endedAt === null ? msg(MSG.OPS_CURRENT_STAY) : operationTime(x.endedAt) },
    ]} />;
}
