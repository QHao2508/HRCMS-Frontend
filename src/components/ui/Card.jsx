import { useId } from 'react';
import { Link } from 'react-router-dom';
import '../../style/ui.css';

/** Thẻ nội dung: tiêu đề 16/800, liên kết hoặc nút ở góc phải, thân tùy ý. */
export function Card({ title, action, children, className = '', flush = false }) {
    const headingId = useId();
    return <section className={`hc-card${flush ? ' is-flush' : ''} ${className}`.trim()} aria-labelledby={title ? headingId : undefined}>
        {(title || action) && <div className="hc-card-head">{title && <h2 id={headingId}>{title}</h2>}{action && <div className="hc-card-action">{action}</div>}</div>}
        {children}
    </section>;
}

/**
 * Thẻ KPI (mẫu M3). Có `to` thì cả thẻ là liên kết mở danh sách tương ứng.
 * @param options0 { label, value, hint, icon: Icon, to, progress: { value, max } }.
 */
export function StatCard({ label, value, hint, icon: Icon, to, progress }) {
    const ratio = progress && progress.max > 0 ? Math.min(100, Math.max(0, (progress.value / progress.max) * 100)) : null;
    const body = <>
        <span className="hc-stat-label">{label}{Icon && <Icon size={18} aria-hidden="true" />}</span>
        <span className="hc-stat-value">{value}{progress && <small>{' / '}{progress.max}</small>}</span>
        {ratio != null && <span className="hc-stat-progress" aria-hidden="true"><span style={{ width: `${ratio}%` }} /></span>}
        {hint && <span className="hc-stat-hint">{hint}</span>}
    </>;
    return to ? <Link className="hc-stat is-link" to={to}>{body}</Link> : <div className="hc-stat">{body}</div>;
}

/**
 * Ô "Cần bạn xử lý" (mẫu M3): số lớn, nhãn, gợi ý hành động; tông màu theo mức độ.
 * @param options0 { count, label, hint, to, tone: 'neutral' | 'danger' | 'warning' | 'info' }.
 */
export function ActionTile({ count, label, hint, to, tone = 'neutral' }) {
    return <Link className={`hc-action-tile tone-${tone}`} to={to}>
        <span className="hc-action-count">{count}</span>
        <span className="hc-action-label">{label}</span>
        {hint && <span className="hc-action-hint">{hint}</span>}
    </Link>;
}
