import { useState } from 'react';
import { useAuth } from '../../context/useAuth.js';
import { MSG, msg } from '../../messages/index.js';
import { Field, PageHeading, ResourceState } from '../../components/WorkflowUI.jsx';
import { SupportForm, SupportTable } from '../../components/SupportUI.jsx';
import { choices, supportLabel, useChoices, usePaged, when } from '../../services/supportResources.js';
import { change, id } from '../../services/supportService.js';
export default function InventoryPage() {
    const { user } = useAuth(); const manager = user.role === 'ClubManager'; const [low, setLow] = useState(''); const resource = usePaged('/api/inventory', { lowStock: low === 'true' }); const [selected, setSelected] = useState(null);
    return <><PageHeading title={msg(MSG.SUPPORT_INVENTORY)} /><section className="surface-card"><Field label={msg(MSG.SUPPORT_STOCK_FILTER)} name="lowStock" value={low} options={[{ value: '', label: msg(MSG.TAT_CA) }, { value: 'true', label: msg(MSG.SUPPORT_LOW_STOCK) }]} onChange={e => { setLow(e.target.value); resource.setPage(1); }} /></section>
        {manager && <SupportForm title={msg(MSG.SUPPORT_NEW_ITEM)} initial={{ name: '', category: '', unit: '', minimumStock: 0 }} reload={resource.reload} submit={f => change('/api/inventory', { ...f, minimumStock: Number(f.minimumStock) })} fields={[
            { name: 'name', label: msg(MSG.SUPPORT_NAME), required: true, maxLength: 100 }, { name: 'category', label: msg(MSG.SUPPORT_CATEGORY), required: true, maxLength: 100 }, { name: 'unit', label: msg(MSG.SUPPORT_UNIT), required: true, maxLength: 100 }, { name: 'minimumStock', label: msg(MSG.SUPPORT_MIN_STOCK), type: 'number', min: 0, max: 1000000, step: '0.001', required: true },
        ]} />}
        <SupportTable resource={resource} columns={['name', 'category', 'unit', 'stock', 'minimumStock'].map((key, i) => ({ key, label: msg([MSG.SUPPORT_NAME, MSG.SUPPORT_CATEGORY, MSG.SUPPORT_UNIT, MSG.SUPPORT_STOCK, MSG.SUPPORT_MIN_STOCK][i]) }))} actions={row => <button className="btn btn-outline-primary" onClick={() => setSelected(row)}>{msg(MSG.SUPPORT_MOVEMENTS)}</button>} />
        {selected && <ItemDetails key={selected.id} item={selected} manager={manager} reload={resource.reload} />}
    </>;
}
function ItemDetails({ item, manager, reload }) {
    const path = `/api/inventory/${id(item.id)}`; const resource = usePaged(`${path}/movements`);
    return <><h2>{item.name}</h2>{manager && !item.archived && <SupportForm title={msg(MSG.SUPPORT_MOVEMENT)} initial={{ quantity: '', reason: '' }} reload={() => { resource.reload(); reload(); }} submit={f => change(`${path}/movements`, { quantity: Number(f.quantity), reason: f.reason })} fields={[{ name: 'quantity', label: msg(MSG.SUPPORT_MOVEMENT_QUANTITY), type: 'number', step: '0.001', required: true }, { name: 'reason', label: msg(MSG.MEDICAL_REASON), multiline: true, maxLength: 4000, required: true }]} />}
        <SupportTable resource={resource} columns={[{ key: 'createdAt', label: msg(MSG.THOI_GIAN), render: x => when(x.createdAt) }, { key: 'quantity', label: msg(MSG.SUPPORT_QUANTITY) }, { key: 'reason', label: msg(MSG.MEDICAL_REASON) }]} />
        {manager && !item.archived && <SupportForm title={msg(MSG.SUPPORT_ARCHIVE_ITEM)} initial={{ confirm: '' }} reload={reload} fields={[{ name: 'confirm', label: msg(MSG.SUPPORT_CONFIRM_ITEM), required: true, maxLength: 100 }]} submit={f => { if (f.confirm !== item.name) throw Object.assign(new Error(msg(MSG.SUPPORT_CONFIRM_ERROR)), { status: 400 }); return change(`${path}/archive`); }} />}
    </>;
}
export function ReplenishmentsPage() {
    const { user } = useAuth(); const items = useChoices('/api/inventory'); const resource = usePaged('/api/inventory/replenishments'); const [selected, setSelected] = useState(null);
    return <><PageHeading title={msg(MSG.SUPPORT_REPLENISHMENTS)} /><ResourceState resource={items} /><SupportForm title={msg(MSG.SUPPORT_REQUEST)} initial={{ itemId: '', quantity: '', notes: '' }} reload={resource.reload} submit={f => change('/api/inventory/replenishments', { ...f, quantity: Number(f.quantity) })} fields={[{ name: 'itemId', label: msg(MSG.SUPPORT_ITEM), options: choices(items.data?.filter(x => !x.archived)), required: true }, { name: 'quantity', label: msg(MSG.SUPPORT_QUANTITY), type: 'number', min: 0.001, max: 1000000, step: '0.001', required: true }, { name: 'notes', label: msg(MSG.GHI_CHU), multiline: true, maxLength: 4000 }]} />
        <SupportTable resource={resource} columns={[{ key: 'itemId', label: msg(MSG.SUPPORT_ITEM), render: x => items.data?.find(i => i.id === x.itemId)?.name || x.itemId }, { key: 'quantity', label: msg(MSG.SUPPORT_QUANTITY) }, { key: 'status', label: msg(MSG.TRANG_THAI), render: x => supportLabel(x.status) }, { key: 'notes', label: msg(MSG.GHI_CHU) }]} actions={user.role === 'ClubManager' ? row => row.status === 'Pending' && <button className="btn btn-outline-primary" onClick={() => setSelected(row)}>{msg(MSG.SUPPORT_REVIEW)}</button> : undefined} />
        {selected && <SupportForm key={selected.id} title={msg(MSG.SUPPORT_REVIEW)} initial={{ approve: 'false', notes: '' }} reload={() => { setSelected(null); resource.reload(); }} submit={f => change(`/api/inventory/replenishments/${id(selected.id)}/review`, { approve: f.approve === 'true', notes: f.notes })} fields={[{ name: 'approve', label: msg(MSG.SUPPORT_DECISION), options: [{ value: 'false', label: msg(MSG.SUPPORT_REJECTED) }, { value: 'true', label: msg(MSG.SUPPORT_APPROVED) }], required: true }, { name: 'notes', label: msg(MSG.GHI_CHU), multiline: true, maxLength: 4000 }]} />}
        <p>{msg(MSG.SUPPORT_REVIEW_STOCK_HELP)}</p>
    </>;
}
