import {choices} from '../services/supportResources.js';
import { useEffect, useId, useRef, useState } from 'react';
import { useUnsavedChanges } from '../context/useUnsavedChanges.js';
import { MSG, msg } from '../messages/index.js';
import { useMutation } from '../context/useMutation.js';
import { Field, MutationState, Pagination, ResourceState } from './WorkflowUI.jsx';
import Drawer from './ui/Drawer.jsx';
import { EmptyState } from './ui/States.jsx';
import { Plus } from 'lucide-react';

/**
 * Form thao tác dùng chung.
 * - `collapsible`: trên trang chỉ có một nút; form mở trong ngăn kéo bên phải.
 * - `drawer` + `onClose`: form luôn nằm trong ngăn kéo đang mở (trang cha quyết định khi nào hiện), dùng cho thao tác trên một dòng.
 * Đóng khi còn thay đổi chưa lưu thì hỏi lại ngay trong ngăn kéo (không dùng hộp thoại của trình duyệt).
 */
export function SupportForm({ title, fields, initial = {}, submit, reload, disabled = false, submitDisabled = false, derive, submitLabel, collapsible = false, danger = false, drawer = false, onClose, intro, size }) {
    const [form, setForm] = useState(initial);
    const [open, setOpen] = useState(!collapsible);
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    const headingId = useId(); const formId = useId(); const panel = useRef(null);
    const dirty = JSON.stringify(form) !== JSON.stringify(initial);
    useUnsavedChanges(dirty);
    const mutation = useMutation();
    const blocked = typeof submitDisabled === 'function' ? submitDisabled(form) : submitDisabled;
    const inDrawer = collapsible || drawer;
    useEffect(() => { if (inDrawer && open) panel.current?.querySelector('input:not([type="hidden"]), select, textarea')?.focus(); }, [open, inDrawer]);
    const finish = () => { setForm(initial); setConfirmDiscard(false); if (collapsible) setOpen(false); onClose?.(); };
    const close = () => { if (dirty) { setConfirmDiscard(true); return; } finish(); };
    const body = <><MutationState mutation={mutation} reload={reload} />{intro}
        <form id={formId} ref={panel} onSubmit={e => { e.preventDefault(); if (disabled || mutation.pending || mutation.uncertain || blocked) return; mutation.run(() => submit(form), () => { setForm(initial); reload(); if (collapsible) setOpen(false); onClose?.(); }); }}>
            <fieldset disabled={disabled || mutation.pending || mutation.uncertain}><div className="row g-3">
                {(typeof fields === 'function' ? fields(form) : fields).map(field => <Field key={field.name} {...field} value={form[field.name] ?? ''} onChange={e => { const next = { ...form, [field.name]: e.target.value }; setForm(derive ? derive(next, field.name) : next); setConfirmDiscard(false); }} />)}
            </div>
            {inDrawer && confirmDiscard && <div className="hc-discard" role="alert"><p>{msg(MSG.UX_DISCARD)}</p><div><button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setConfirmDiscard(false)}>{msg(MSG.UX_KEEP_EDITING)}</button><button type="button" className="btn btn-danger btn-sm" onClick={finish}>{msg(MSG.UX_DISCARD_CONFIRM)}</button></div></div>}
            <div className={inDrawer ? 'hc-drawer-actions' : 'form-action-bar'}>{inDrawer && <button type="button" className="btn btn-outline-secondary" onClick={close} disabled={mutation.pending}>{msg(MSG.HUY)}</button>}<button className={`${danger ? 'btn btn-danger' : 'btn btn-primary'}${inDrawer ? ' ms-auto' : ''}`} type="submit" disabled={blocked}>{mutation.pending ? msg(MSG.DANG_XU_LY) : submitLabel || msg(MSG.SUPPORT_SAVE)}</button>{!inDrawer && dirty && <span className="form-text" role="status">{msg(MSG.UX_UNSAVED)}</span>}</div></fieldset>
        </form></>;
    if (drawer) return <Drawer open title={title} size={size} busy={mutation.pending} onClose={close}>{body}</Drawer>;
    if (collapsible) return <div className="form-launcher"><button type="button" className={danger ? 'btn btn-outline-danger' : 'btn btn-primary'} aria-haspopup="dialog" disabled={disabled} onClick={() => setOpen(true)}>{!danger && <><Plus size={18} aria-hidden="true" />{' '}</>}{title}</button>
        <Drawer open={open} title={title} size={size} busy={mutation.pending} onClose={close}>{body}</Drawer></div>;
    return <section className="hc-card support-form" aria-labelledby={headingId}><div className="hc-card-head"><h2 id={headingId}>{title}</h2></div>{body}</section>;
}
export function SupportTable({ resource, columns, actions, tableClassName = 'table' }) {
    return <section className="hc-card is-flush support-table-card" aria-busy={!!resource.loading}><ResourceState resource={resource} />{resource.data && <>
        {!resource.data.items.length ? <EmptyState title={msg(MSG.SUPPORT_EMPTY)} description={msg(MSG.UX_EMPTY_HELP)} /> : <><p className="table-scroll-hint">{msg(MSG.UX_TABLE_SCROLL)}</p><div className="table-responsive hc-table-wrap" role="region" aria-label={msg(MSG.SUPPORT_ACTIONS)} tabIndex={0}><table className={`${tableClassName} hc-table support-data-table`}><thead><tr>{columns.map(c => <th scope="col" key={c.key}>{c.label}</th>)}{actions && <th scope="col">{msg(MSG.SUPPORT_ACTIONS)}</th>}</tr></thead>
            <tbody>{resource.data.items.map(row => <tr key={row.id}>{columns.map(c => <td key={c.key} data-label={c.label}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}{actions && <td data-label={msg(MSG.SUPPORT_ACTIONS)}>{actions(row)}</td>}</tr>)}</tbody></table></div></>}
        <Pagination data={resource.data} onChange={resource.setPage} /></>}</section>;
}
export function HorseSelect({ resource, value, onChange, optional = false }) {
    return <section className="surface-card filter-panel"><ResourceState resource={resource} /><Field label={msg(MSG.MEDICAL_HORSE)} name="horseId" value={value} options={choices(resource.data)} required={!optional} onChange={e => onChange(e.target.value)} /></section>;
}
