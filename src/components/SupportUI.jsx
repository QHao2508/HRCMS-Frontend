import {choices} from '../services/supportResources.js';
import { useEffect, useId, useRef, useState } from 'react';
import { useUnsavedChanges } from '../context/useUnsavedChanges.js';
import { MSG, msg } from '../messages/index.js';
import { useMutation } from '../context/useMutation.js';
import { Field, MutationState, Pagination, ResourceState } from './WorkflowUI.jsx';
import Drawer from './ui/Drawer.jsx';
import { Plus } from 'lucide-react';

/**
 * Form thao tác dùng chung. `collapsible`: chỉ hiện một nút trên trang, form mở trong ngăn kéo bên phải
 * (giữ focus trong ngăn kéo, Esc để đóng, hỏi lại nếu đang có thay đổi chưa lưu).
 */
export function SupportForm({ title, fields, initial = {}, submit, reload, disabled = false, submitDisabled = false, derive, submitLabel, collapsible = false, danger = false }) {
    const [form, setForm] = useState(initial);
    const [open, setOpen] = useState(!collapsible);
    const headingId = useId(); const formId = useId(); const panel = useRef(null);
    const dirty = JSON.stringify(form) !== JSON.stringify(initial);
    useUnsavedChanges(dirty);
    const mutation = useMutation();
    const blocked = typeof submitDisabled === 'function' ? submitDisabled(form) : submitDisabled;
    useEffect(() => { if (collapsible && open) panel.current?.querySelector('input:not([type="hidden"]), select, textarea')?.focus(); }, [open, collapsible]);
    const close = () => { if (dirty && !window.confirm(msg(MSG.UX_DISCARD))) return; setForm(initial); setOpen(false); };
    const body = <><MutationState mutation={mutation} reload={reload} />
        <form id={formId} ref={panel} onSubmit={e => { e.preventDefault(); if (disabled || mutation.pending || mutation.uncertain || blocked) return; mutation.run(() => submit(form), () => { setForm(initial); reload(); if (collapsible) setOpen(false); }); }}>
            <fieldset disabled={disabled || mutation.pending || mutation.uncertain}><div className="row g-3">
                {(typeof fields === 'function' ? fields(form) : fields).map(field => <Field key={field.name} {...field} value={form[field.name] ?? ''} onChange={e => { const next = { ...form, [field.name]: e.target.value }; setForm(derive ? derive(next, field.name) : next); }} />)}
            </div><div className={collapsible ? 'hc-drawer-actions' : 'form-action-bar'}><button className={danger ? 'btn btn-danger' : 'btn btn-primary'} type="submit" disabled={blocked}>{mutation.pending ? msg(MSG.DANG_XU_LY) : submitLabel || msg(MSG.SUPPORT_SAVE)}</button>{collapsible && <button type="button" className="btn btn-outline-secondary" onClick={close} disabled={mutation.pending}>{msg(MSG.UI_CLOSE)}</button>}{dirty && <span className="form-text" role="status">{msg(MSG.UX_UNSAVED)}</span>}</div></fieldset>
        </form></>;
    if (collapsible) return <div className="form-launcher"><button type="button" className={danger ? 'btn btn-outline-danger' : 'btn btn-primary'} aria-haspopup="dialog" disabled={disabled} onClick={() => setOpen(true)}>{!danger && <><Plus size={18} aria-hidden="true" />{' '}</>}{title}</button>
        <Drawer open={open} title={title} busy={mutation.pending} onClose={close}>{body}</Drawer></div>;
    return <section className="surface-card support-form" aria-labelledby={headingId}><div className="card-heading"><h2 id={headingId}>{title}</h2></div>{body}</section>;
}
export function SupportTable({ resource, columns, actions, tableClassName = 'table' }) {
    return <section className="surface-card" aria-busy={!!resource.loading}><ResourceState resource={resource} />{resource.data && <>
        {!resource.data.items.length ? <div className="empty-state"><strong>{msg(MSG.SUPPORT_EMPTY)}</strong><p>{msg(MSG.UX_EMPTY_HELP)}</p></div> : <><p className="table-scroll-hint">{msg(MSG.UX_TABLE_SCROLL)}</p><div className="table-responsive" role="region" aria-label={msg(MSG.SUPPORT_ACTIONS)} tabIndex={0}><table className={`${tableClassName} support-data-table`}><thead><tr>{columns.map(c => <th scope="col" key={c.key}>{c.label}</th>)}{actions && <th scope="col">{msg(MSG.SUPPORT_ACTIONS)}</th>}</tr></thead>
            <tbody>{resource.data.items.map(row => <tr key={row.id}>{columns.map(c => <td key={c.key} data-label={c.label}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}{actions && <td data-label={msg(MSG.SUPPORT_ACTIONS)}>{actions(row)}</td>}</tr>)}</tbody></table></div></>}
        <Pagination data={resource.data} onChange={resource.setPage} /></>}</section>;
}
export function HorseSelect({ resource, value, onChange, optional = false }) {
    return <section className="surface-card filter-panel"><ResourceState resource={resource} /><Field label={msg(MSG.MEDICAL_HORSE)} name="horseId" value={value} options={choices(resource.data)} required={!optional} onChange={e => onChange(e.target.value)} /></section>;
}
