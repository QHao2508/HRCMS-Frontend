import {choices} from '../services/supportResources.js';
import { useEffect, useId, useRef, useState } from 'react';
import { useUnsavedChanges } from '../context/useUnsavedChanges.js';
import { MSG, msg } from '../messages/index.js';
import { useMutation } from '../context/useMutation.js';
import { Field, MutationState, Pagination, ResourceState } from './WorkflowUI.jsx';

export function SupportForm({ title, fields, initial = {}, submit, reload, disabled = false, submitDisabled = false, derive, submitLabel, collapsible = false }) {
    const [form, setForm] = useState(initial);
    const [open, setOpen] = useState(!collapsible);
    const headingId = useId(); const formId = useId(); const panel = useRef(null);
    const dirty = JSON.stringify(form) !== JSON.stringify(initial);
    useUnsavedChanges(dirty);
    const mutation = useMutation();
    useEffect(() => { if (collapsible && open) panel.current?.querySelector('input:not([type="hidden"]), select, textarea')?.focus(); }, [open, collapsible]);
    return <section className="surface-card support-form" aria-labelledby={headingId}><div className="card-heading"><h2 id={headingId}>{title}</h2>{collapsible && <button type="button" className="btn btn-outline-primary" aria-expanded={open} aria-controls={formId} disabled={mutation.pending || mutation.uncertain} onClick={() => { if (open && dirty && !window.confirm(msg(MSG.UX_DISCARD))) return; if (open) setForm(initial); setOpen(!open); }}>{msg(open ? MSG.UX_CLOSE_FORM : MSG.UX_OPEN_FORM)}</button>}</div><MutationState mutation={mutation} reload={reload} />
        <form id={formId} ref={panel} hidden={!open} onSubmit={e => { e.preventDefault(); if (disabled || mutation.pending || mutation.uncertain || (typeof submitDisabled === 'function' ? submitDisabled(form) : submitDisabled)) return; mutation.run(() => submit(form), () => { setForm(initial); reload(); }); }}>
            <fieldset disabled={disabled || mutation.pending || mutation.uncertain}><div className="row g-3">
                {(typeof fields === 'function' ? fields(form) : fields).map(field => <Field key={field.name} {...field} value={form[field.name] ?? ''} onChange={e => { const next = { ...form, [field.name]: e.target.value }; setForm(derive ? derive(next, field.name) : next); }} />)}
            </div><div className="form-action-bar"><button className="btn btn-primary" type="submit" disabled={typeof submitDisabled === 'function' ? submitDisabled(form) : submitDisabled}>{mutation.pending ? msg(MSG.DANG_XU_LY) : submitLabel || msg(MSG.SUPPORT_SAVE)}</button>{dirty && <span className="form-text" role="status">{msg(MSG.UX_UNSAVED)}</span>}</div></fieldset>
        </form></section>;
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
