import '../../style/ui.css';

/**
 * Nhãn trạng thái dùng 5 cặp màu của hệ thống thiết kế (đạt tương phản 4.5:1); luôn có chữ, không chỉ dựa vào màu.
 * @param options0 { tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral', dot = false, children }.
 */
export default function StatusBadge({ tone = 'neutral', dot = false, children }) {
    return <span className={`hc-badge tone-${tone}`}>{dot && <span className="hc-badge-dot" aria-hidden="true" />}{children}</span>;
}
