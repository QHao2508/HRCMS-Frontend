import {choices} from '../services/supportResources.js';
import { useState } from 'react';
import { MSG, msg } from '../messages/index.js';
import { useMutation } from '../context/useMutation.js';
import { Field, MutationState, Pagination, ResourceState } from './WorkflowUI.jsx';

export function SupportForm({ title, fields, initial = {}, submit, reload, disabled = false, submitDisabled = false, derive }) {
    const [form, setForm] = useState(initial);
    const mutation = useMutation();
    return <section className="surface-card"><h2>{title}</h2><MutationState mutation={mutation} reload={reload} />
        <form onSubmit={e => { e.preventDefault(); if (disabled || mutation.pending || mutation.uncertain || (typeof submitDisabled === 'function' ? submitDisabled(form) : submitDisabled)) return; mutation.run(() => submit(form), () => { setForm(initial); reload(); }); }}>
            <fieldset disabled={disabled || mutation.pending || mutation.uncertain}><div className="row g-3">
                {(typeof fields === 'function' ? fields(form) : fields).map(field => <Field key={field.name} {...field} value={form[field.name] ?? ''} onChange={e => { const next = { ...form, [field.name]: e.target.value }; setForm(derive ? derive(next, field.name) : next); }} />)}
            </div><button className="btn btn-primary mt-3" type="submit" disabled={typeof submitDisabled === 'function' ? submitDisabled(form) : submitDisabled}>{msg(MSG.SUPPORT_SAVE)}</button></fieldset>
        </form></section>;
}
export function SupportTable({ resource, columns, actions }) {
    return <section className="surface-card"><ResourceState resource={resource} />{resource.data && <>
        {!resource.data.items.length && <p>{msg(MSG.SUPPORT_EMPTY)}</p>}
        <div className="table-responsive"><table className="table"><thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}{actions && <th>{msg(MSG.SUPPORT_ACTIONS)}</th>}</tr></thead>
            <tbody>{resource.data.items.map(row => <tr key={row.id}>{columns.map(c => <td key={c.key}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}{actions && <td>{actions(row)}</td>}</tr>)}</tbody></table></div>
        <Pagination data={resource.data} onChange={resource.setPage} /></>}</section>;
}
export function HorseSelect({ resource, value, onChange, optional = false }) {
    return <section className="surface-card"><ResourceState resource={resource} /><Field label={msg(MSG.MEDICAL_HORSE)} name="horseId" value={value} options={choices(resource.data)} required={!optional} onChange={e => onChange(e.target.value)} /></section>;
}
