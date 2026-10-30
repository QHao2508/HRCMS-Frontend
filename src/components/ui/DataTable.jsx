import { MSG, msg } from '../../messages/index.js';
import '../../style/ui.css';

/** Thanh công cụ phía trên danh sách: ô tìm, select, nút; tự xuống dòng trên màn hẹp. */
export function Toolbar({ children }) {
    return <div className="hc-toolbar">{children}</div>;
}

/**
 * Nhóm chip lọc nhanh có số đếm (mẫu M4). Chip đang chọn có aria-pressed="true".
 * @param options0 { options: [{ value, label, count, dot }], value, onChange, label }.
 */
export function FilterChips({ options, value, onChange, label = msg(MSG.UI_FILTER_GROUP) }) {
    return <div className="hc-chips" role="group" aria-label={label}>{options.map(option => {
        const active = option.value === value;
        return <button key={String(option.value)} type="button" className={`hc-chip${active ? ' is-active' : ''}`} aria-pressed={active} onClick={() => onChange(option.value)}>
            {option.dot && <span className={`hc-chip-dot tone-${option.dot}`} aria-hidden="true" />}{option.label}{option.count != null && <b>{option.count}</b>}
        </button>;
    })}</div>;
}

/**
 * Bảng dữ liệu dùng chung (mẫu M4): tiêu đề cột có scope, số căn phải, trạng thái rỗng thay cho bảng trống.
 * Trên điện thoại bảng tự thành thẻ nhờ tableLabels.js; không cần khai báo thêm.
 * @param options0 { columns: [{ key, label, render, align, nowrap }], rows, rowKey = 'id', empty, caption }.
 */
export function DataTable({ columns, rows, rowKey = 'id', empty, caption }) {
    if (!rows?.length) return empty ?? null;
    return <div className="hc-table-wrap table-responsive" {...(caption ? { tabIndex: 0, role: 'region', 'aria-label': caption } : {})}>
        <table className="table hc-table">
            {caption && <caption className="visually-hidden">{caption}</caption>}
            <thead><tr>{columns.map(column => <th key={column.key} scope="col" className={column.align === 'end' ? 'text-end' : undefined}>{column.label}</th>)}</tr></thead>
            <tbody>{rows.map((row, index) => <tr key={row[rowKey] ?? index}>{columns.map(column => <td key={column.key} className={[column.align === 'end' ? 'text-end' : '', column.nowrap ? 'text-nowrap' : ''].join(' ').trim() || undefined}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>)}</tbody>
        </table>
    </div>;
}

function pageWindow(current, pages) {
    const set = new Set([1, pages, current - 1, current, current + 1]);
    const list = [...set].filter(page => page >= 1 && page <= pages).sort((a, b) => a - b);
    return list.flatMap((page, index) => index && page - list[index - 1] > 1 ? ['gap-' + page, page] : [page]);
}

/**
 * Phân trang có số trang (mẫu M4): "Hiển thị 1–20 trong 48", Trước / 1 2 3 / Sau. Ẩn khi không có dữ liệu.
 * @param options0 { page, pageSize, total, onChange }.
 */
export function Pagination({ page = 1, pageSize = 20, total = 0, onChange }) {
    if (!total) return null;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(Math.max(1, page), pages);
    const from = (current - 1) * pageSize + 1, to = Math.min(total, current * pageSize);
    return <nav className="hc-pagination" aria-label={msg(MSG.PHAN_TRANG)}>
        <span>{msg(MSG.UI_SHOWING, { from, to, total })}</span>
        {pages > 1 && <span className="hc-pages">
            <button type="button" className="hc-page" disabled={current <= 1} onClick={() => onChange(current - 1)}>{msg(MSG.TRUOC)}</button>
            {pageWindow(current, pages).map(item => typeof item === 'string' ? <span key={item} className="hc-page-gap" aria-hidden="true">{msg(MSG.SYMBOL_ELLIPSIS)}</span>
                : <button key={item} type="button" className={`hc-page is-number${item === current ? ' is-current' : ''}`} aria-current={item === current ? 'page' : undefined} aria-label={msg(MSG.UI_PAGE_N, { page: item })} onClick={() => onChange(item)}>{item}</button>)}
            <button type="button" className="hc-page" disabled={current >= pages} onClick={() => onChange(current + 1)}>{msg(MSG.SAU)}</button>
        </span>}
    </nav>;
}
