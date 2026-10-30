import { MSG, msg } from '../messages/index.js';
import { Pagination, ResourceState } from './WorkflowUI.jsx';
import '../style/inventory-stable.css';
import StatusBadge from './ui/StatusBadge.jsx';

// Deliberately local to Inventory/Stable; shared SupportTable remains unchanged.
export function OperationsTable({ resource, columns, actions, title, emptyText = msg(MSG.SUPPORT_EMPTY) }) {
    const ready = !resource.loading && !resource.error && resource.data;
    return <section className="hc-card is-flush ops-table-card" aria-busy={!!resource.loading}>
        <div className="hc-card-head"><h2>{title}</h2></div><ResourceState resource={resource} />
        {ready && <>{!resource.data.items.length ? <div className="ops-empty hc-empty" role="status"><p className="hc-empty-title">{emptyText}</p></div> : <div className="table-responsive hc-table-wrap ops-scroll" role="region" aria-label={title} tabIndex={0}>
            <table className="table hc-table ops-table"><caption className="visually-hidden">{title}</caption><thead><tr>{columns.map(c => <th scope="col" key={c.key} className={c.numeric ? 'ops-number' : undefined}>{c.label}</th>)}{actions && <th scope="col">{msg(MSG.SUPPORT_ACTIONS)}</th>}</tr></thead>
                <tbody>{resource.data.items.map(row => <tr key={row.id}>{columns.map(c => <td key={c.key} data-label={c.label} className={[c.numeric ? 'ops-number' : '', c.key === 'name' ? 'ops-name' : ''].join(' ')}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}{actions && <td className="ops-actions" data-label={msg(MSG.SUPPORT_ACTIONS)}>{actions(row)}</td>}</tr>)}</tbody>
            </table></div>}<Pagination data={resource.data} onChange={resource.setPage} /></>}
    </section>;
}
const badgeTones = { success: 'success', warning: 'warning', danger: 'danger', info: 'info', occupied: 'info', neutral: 'neutral' };
export function OperationsBadge({ state }) { return <StatusBadge tone={badgeTones[state.tone] || 'neutral'} dot>{state.label}</StatusBadge>; }

