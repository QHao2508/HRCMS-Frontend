import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import { MSG, msg } from '../../messages/index.js';
import { Field, PageHeading, ResourceState } from '../../components/WorkflowUI.jsx';
import { SupportForm, SupportTable } from '../../components/SupportUI.jsx';
import { choices, supportLabel, useChoices, usePaged, when } from '../../services/supportResources.js';
import { change, id } from '../../services/supportService.js';
const movementLabel = row => msg(row.quantity > 0 ? (row.replenishmentRequestId ? MSG.INV_IN_REPLENISH : MSG.INV_IN) : MSG.INV_OUT);
const amount = (value, unit) => `${Math.abs(Number(value))}${unit ? ' ' + unit : ''}`;
const fail = key => { throw Object.assign(new Error(msg(key)), { status: 400 }); };

/** Danh sách vật tư; bấm "Lịch sử nhập xuất" chỉ để xem, thao tác xuất nằm ở trang Xuất vật tư riêng. */
export default function InventoryPage() {
    const { user } = useAuth(); const manager = user.role === 'ClubManager'; const [low, setLow] = useState(''); const resource = usePaged('/api/inventory', { lowStock: low === 'true' }); const [selected, setSelected] = useState(null); const [archiving, setArchiving] = useState(null);
    return <><PageHeading title={msg(MSG.SUPPORT_INVENTORY)} action={<Link className="btn btn-primary" to="/inventory/issue">{msg(MSG.FLOW34_CONSUME)}</Link>} /><section className="surface-card"><Field label={msg(MSG.SUPPORT_STOCK_FILTER)} name="lowStock" value={low} options={[{ value: '', label: msg(MSG.TAT_CA) }, { value: 'true', label: msg(MSG.SUPPORT_LOW_STOCK) }]} onChange={e => { setLow(e.target.value); resource.setPage(1); }} /></section>
        {manager && <SupportForm title={msg(MSG.SUPPORT_NEW_ITEM)} initial={{ name: '', category: '', unit: '', minimumStock: 0 }} reload={resource.reload} submit={f => change('/api/inventory', { ...f, minimumStock: Number(f.minimumStock) })} fields={[
            { name: 'name', label: msg(MSG.SUPPORT_NAME), required: true, maxLength: 100 }, { name: 'category', label: msg(MSG.SUPPORT_CATEGORY), required: true, maxLength: 100 }, { name: 'unit', label: msg(MSG.SUPPORT_UNIT), required: true, maxLength: 100 }, { name: 'minimumStock', label: msg(MSG.SUPPORT_MIN_STOCK), type: 'number', min: 0, max: 1000000, step: '0.001', required: true },
        ]} />}
        <SupportTable resource={resource} columns={['name', 'category', 'unit', 'stock', 'minimumStock'].map((key, i) => ({ key, label: msg([MSG.SUPPORT_NAME, MSG.SUPPORT_CATEGORY, MSG.SUPPORT_UNIT, MSG.SUPPORT_STOCK, MSG.SUPPORT_MIN_STOCK][i]) }))} actions={row => <div className="inline-actions"><button className="btn btn-outline-primary" onClick={() => { setArchiving(null); setSelected(row); }}>{msg(MSG.SUPPORT_MOVEMENTS)}</button>{manager && !row.archived && <button className="btn btn-outline-secondary" onClick={() => { setSelected(null); setArchiving(row); }}>{msg(MSG.INV_ARCHIVE_ACTION)}</button>}</div>} />
        {selected && <section className="surface-card" key={selected.id}><h2>{msg(MSG.INV_HISTORY_OF, { name: selected.name })}</h2><p className="form-text">{msg(MSG.INV_HISTORY_ONLY)}</p><ItemHistory item={selected} /></section>}
        {archiving && <SupportForm key={archiving.id} title={`${msg(MSG.SUPPORT_ARCHIVE_ITEM)} · ${archiving.name}`} initial={{ confirm: '' }} reload={() => { setArchiving(null); resource.reload(); }} fields={[{ name: 'confirm', label: msg(MSG.SUPPORT_CONFIRM_ITEM), required: true, maxLength: 100 }]} submit={f => { if (f.confirm !== archiving.name) fail(MSG.SUPPORT_CONFIRM_ERROR); return change(`/api/inventory/${id(archiving.id)}/archive`); }} />}
    </>;
}

/** Bảng lịch sử nhập/xuất: hiển thị rõ loại phiếu và số lượng dương. */
function ItemHistory({ item }) {
    const resource = usePaged(`/api/inventory/${id(item.id)}/movements`);
    return <SupportTable resource={resource} columns={[{ key: 'createdAt', label: msg(MSG.THOI_GIAN), render: x => when(x.createdAt) }, { key: 'direction', label: msg(MSG.INV_DIRECTION), render: x => <span className={`badge ${x.quantity > 0 ? 'text-bg-success' : 'text-bg-warning'}`}>{movementLabel(x)}</span> }, { key: 'quantity', label: msg(MSG.SUPPORT_QUANTITY), render: x => amount(x.quantity, item.unit) }, { key: 'reason', label: msg(MSG.SUPPORT_REASON) }]} />;
}

/** Trang xuất vật tư riêng (giống yêu cầu bổ sung): nhập số dương, hệ thống tự ghi âm khi xuất. Manager có thể chọn Nhập để điều chỉnh. */
export function InventoryIssuePage() {
    const { user } = useAuth(); const manager = user.role === 'ClubManager'; const items = useChoices('/api/inventory'); const [itemId, setItemId] = useState('');
    const active = (items.data || []).filter(x => !x.archived); const item = active.find(x => x.id === itemId);
    return <><PageHeading title={msg(MSG.FLOW34_CONSUME)} action={<Link className="btn btn-outline-primary" to="/inventory">{msg(MSG.SUPPORT_INVENTORY)}</Link>} /><ResourceState resource={items} />
        <section className="surface-card"><Field label={msg(MSG.SUPPORT_ITEM)} name="itemId" value={itemId} options={choices(active)} required onChange={e => setItemId(e.target.value)} help={item ? msg(MSG.INV_STOCK_AFTER, { stock: item.stock, unit: item.unit }) : undefined} /></section>
        {item && <SupportForm key={item.id} title={msg(MSG.INV_ISSUE_TITLE)} initial={{ direction: 'Out', quantity: '', reason: '' }} reload={items.reload} submit={f => {
            const quantity = Number(f.quantity);
            if (!(quantity > 0)) fail(MSG.INV_QUANTITY_POSITIVE);
            const outgoing = !manager || f.direction === 'Out';
            if (outgoing && quantity > Number(item.stock)) fail(MSG.INV_NOT_ENOUGH);
            return change(`/api/inventory/${id(item.id)}/movements`, { quantity: outgoing ? -quantity : quantity, reason: f.reason.trim() });
        }} fields={f => [
            ...(manager ? [{ name: 'direction', label: msg(MSG.INV_DIRECTION), options: [{ value: 'Out', label: msg(MSG.INV_OUT) }, { value: 'In', label: msg(MSG.INV_IN) }], required: true }] : []),
            { name: 'quantity', label: msg(!manager || f.direction === 'Out' ? MSG.INV_ISSUE_QUANTITY : MSG.INV_RECEIPT_QUANTITY), help: msg(MSG.INV_ISSUE_HELP), type: 'number', min: 0.001, max: !manager || f.direction === 'Out' ? Number(item.stock) || 0.001 : 1000000, step: '0.001', required: true },
            { name: 'reason', label: msg(MSG.SUPPORT_REASON), multiline: true, maxLength: 4000, required: true, wide: true },
        ]} />}
        {item && <section className="surface-card"><h2>{msg(MSG.INV_HISTORY_OF, { name: item.name })}</h2><ItemHistory key={`${item.id}-${item.stock}`} item={item} /></section>}
    </>;
}
export function ReplenishmentsPage() {
    const { user } = useAuth(); const items = useChoices('/api/inventory'); const resource = usePaged('/api/inventory/replenishments'); const [selected, setSelected] = useState(null);
    return <><PageHeading title={msg(MSG.SUPPORT_REPLENISHMENTS)} /><ResourceState resource={items} /><SupportForm title={msg(MSG.SUPPORT_REQUEST)} initial={{ itemId: '', quantity: '', notes: '' }} reload={resource.reload} submit={f => change('/api/inventory/replenishments', { ...f, quantity: Number(f.quantity) })} fields={[{ name: 'itemId', label: msg(MSG.SUPPORT_ITEM), options: choices(items.data?.filter(x => !x.archived)), required: true }, { name: 'quantity', label: msg(MSG.SUPPORT_QUANTITY), type: 'number', min: 0.001, max: 1000000, step: '0.001', required: true }, { name: 'notes', label: msg(MSG.GHI_CHU), multiline: true, maxLength: 4000 }]} />
        <SupportTable resource={resource} columns={[{ key: 'itemId', label: msg(MSG.SUPPORT_ITEM), render: x => x.itemName || items.data?.find(i => i.id === x.itemId)?.name || x.itemId }, { key: 'quantity', label: msg(MSG.SUPPORT_QUANTITY) }, { key: 'status', label: msg(MSG.TRANG_THAI), render: x => supportLabel(x.status) }, { key: 'notes', label: msg(MSG.GHI_CHU) }, { key: 'reviewNotes', label: msg(MSG.BR_REVIEW_NOTES) }, { key: 'receivedQuantity', label: msg(MSG.BR_RECEIVED_QUANTITY) }]} actions={user.role === 'ClubManager' ? row => ['Pending','Approved','PartiallyReceived'].includes(row.status) && <button className="btn btn-outline-primary" onClick={() => setSelected(row)}>{msg(row.status === 'Pending' ? MSG.SUPPORT_REVIEW : MSG.BR_RECEIVE)}</button> : undefined} />
        {selected?.status === 'Pending' && <SupportForm key={selected.id} title={msg(MSG.SUPPORT_REVIEW)} initial={{ approve: 'false', notes: '' }} reload={() => { setSelected(null); resource.reload(); }} submit={f => change(`/api/inventory/replenishments/${id(selected.id)}/review`, { approve: f.approve === 'true', notes: f.notes })} fields={[{ name: 'approve', label: msg(MSG.SUPPORT_DECISION), options: [{ value: 'false', label: msg(MSG.SUPPORT_REJECTED) }, { value: 'true', label: msg(MSG.SUPPORT_APPROVED) }], required: true }, { name: 'notes', label: msg(MSG.GHI_CHU), multiline: true, maxLength: 4000 }]} />}
        {selected && ['Approved','PartiallyReceived'].includes(selected.status) && <SupportForm key={selected.id} title={msg(MSG.BR_RECEIVE)} initial={{ quantity: '', reason: '' }} reload={()=>{setSelected(null); resource.reload(); items.reload();}} submit={f=>change(`/api/inventory/replenishments/${id(selected.id)}/receive`,{quantity:Number(f.quantity),reason:f.reason.trim()})} fields={[{name:'quantity',label:msg(MSG.SUPPORT_QUANTITY),help:msg(MSG.BR_RECEIPT_HELP),type:'number',min:0.001,max:selected.quantity-(selected.receivedQuantity || 0),step:'0.001',required:true},{name:'reason',label:msg(MSG.BR_REASON),multiline:true,maxLength:2000,required:true}]}/>}
        <p>{msg(MSG.SUPPORT_REVIEW_STOCK_HELP)}</p>
    </>;
}
