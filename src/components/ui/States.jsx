import { Inbox, CircleAlert } from 'lucide-react';
import { MSG, msg } from '../../messages/index.js';
import '../../style/ui.css';

/**
 * Trạng thái rỗng (mẫu M8): biểu tượng, một câu giải thích, nút hành động tùy chọn.
 * @param options0 { title, description, action, icon: Icon }.
 */
export function EmptyState({ title = msg(MSG.SUPPORT_EMPTY), description, action, icon: Icon = Inbox }) {
    return <div className="hc-empty"><Icon size={28} aria-hidden="true" /><p className="hc-empty-title">{title}</p>{description && <p>{description}</p>}{action}</div>;
}

/** Khung xương khi tải lần đầu, kèm chữ cho trình đọc màn hình. */
export function Skeleton({ lines = 3 }) {
    return <div className="hc-skeleton" role="status" aria-live="polite"><span className="visually-hidden">{msg(MSG.DANG_TAI_DU_LIEU)}</span>
        {Array.from({ length: lines }, (_, index) => <i key={index} aria-hidden="true" />)}</div>;
}

/** Lỗi tải dữ liệu có nút thử lại. Không hiện chi tiết kỹ thuật cho người dùng. */
export function ErrorState({ message = msg(MSG.UI_LOAD_FAILED), onRetry }) {
    return <div className="hc-error-state" role="alert"><CircleAlert size={22} aria-hidden="true" /><p>{message}</p>{onRetry && <button type="button" className="btn btn-outline-primary" onClick={onRetry}>{msg(MSG.TAI_LAI)}</button>}</div>;
}

/**
 * Trang trạng thái toàn màn (403/404): biểu tượng, tiêu đề, câu giải thích, các nút đi tiếp.
 * @param options0 { icon: Icon, title, description, actions, titleId }.
 */
export function StatusPage({ icon: Icon, title, description, actions, titleId }) {
    return <section className="hc-status-page" aria-labelledby={titleId}>
        {Icon && <span className="hc-status-icon" aria-hidden="true"><Icon size={32} /></span>}
        <h1 id={titleId}>{title}</h1>
        {description && <p>{description}</p>}
        {actions && <div className="hc-status-actions">{actions}</div>}
    </section>;
}
