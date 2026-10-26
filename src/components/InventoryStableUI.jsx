import { useEffect, useRef } from 'react';
import { MSG, msg } from '../messages/index.js';
import { Pagination, ResourceState } from './WorkflowUI.jsx';
import '../style/inventory-stable.css';

// Deliberately local to Inventory/Stable; shared SupportTable remains unchanged.
export function OperationsTable({ resource, columns, actions, title, emptyText = msg(MSG.SUPPORT_EMPTY) }) {
    const ready = !resource.loading && !resource.error && resource.data;
    return <section className="surface-card ops-table-card" aria-busy={!!resource.loading}>
        <h2>{title}</h2><ResourceState resource={resource} />
        {ready && <>{!resource.data.items.length ? <p className="ops-empty" role="status">{emptyText}</p> : <div className="table-responsive ops-scroll" role="region" aria-label={title} tabIndex={0}>
            <table className="table ops-table"><caption className="visually-hidden">{title}</caption><thead><tr>{columns.map(c => <th scope="col" key={c.key} className={c.numeric ? 'ops-number' : undefined}>{c.label}</th>)}{actions && <th scope="col">{msg(MSG.SUPPORT_ACTIONS)}</th>}</tr></thead>
                <tbody>{resource.data.items.map(row => <tr key={row.id}>{columns.map(c => <td key={c.key} className={[c.numeric ? 'ops-number' : '', c.key === 'name' ? 'ops-name' : ''].join(' ')}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}{actions && <td className="ops-actions">{actions(row)}</td>}</tr>)}</tbody>
            </table></div>}<Pagination data={resource.data} onChange={resource.setPage} /></>}
    </section>;
}
export function OperationsBadge({ state }) { return <span className={`ops-badge ops-${state.tone}`}>{state.label}</span>; }

export function OperationsDetail({ title, onClose, children }) {
    const heading = useRef(null);
    useEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }, []);
    return <section className="surface-card ops-detail"><div className="ops-section-heading"><h2 ref={heading} tabIndex={-1}>{title}</h2><button type="button" className="btn btn-outline-secondary" onClick={onClose}>{msg(MSG.OPS_CLOSE_DETAIL)}</button></div>{children}</section>;
}
