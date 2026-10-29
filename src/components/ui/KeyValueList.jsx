import '../../style/ui.css';

/**
 * Danh sách nhãn – giá trị hai cột (thay summary-grid). Giá trị rỗng hiện "—".
 * @param options0 { items: [[label, value]], columns = 2 }.
 */
export function KeyValueList({ items, columns = 2 }) {
    return <dl className={`hc-kv cols-${columns}`}>{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value === null || value === undefined || value === '' ? '—' : value}</dd></div>)}</dl>;
}

/**
 * Dòng thời gian (mẫu M5): chấm màu theo tông, tiêu đề, người thực hiện, thời điểm.
 * @param options0 { items: [{ id, title, actor, at, tone }] }.
 */
export function Timeline({ items }) {
    return <ol className="hc-timeline">{items.map(item => <li key={item.id} className={`tone-${item.tone || 'neutral'}`}>
        <span className="hc-timeline-dot" aria-hidden="true" />
        <div><p><strong>{item.title}</strong>{item.actor && <> {'— '}{item.actor}</>}</p>{item.at && <time>{item.at}</time>}</div>
    </li>)}</ol>;
}
