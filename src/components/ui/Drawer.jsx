import { useEffect, useEffectEvent, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { MSG, msg } from '../../messages/index.js';
import { containDialogFocus } from '../../services/dialogFocus.js';
import '../../style/drawer.css';

/**
 * Ngăn kéo bên phải cho form thao tác (dùng cho form thao tác dài): giữ focus trong bảng, Esc hoặc nền mờ để đóng,
 * trả focus về nút đã mở khi đóng. Khi `busy` (đang lưu) thì không cho đóng để tránh mất dữ liệu.
 * @param options0 { open, title, onClose, busy, children, size: 'md' (480px) | 'lg' (760px, form nhiều cột) }.
 */
export default function Drawer({ open, title, onClose, busy = false, children, size = 'md' }) {
    const ref = useRef(null);
    const titleId = useId();
    const requestClose = () => { if (!busy) onClose?.(); };
    const close = useEffectEvent(requestClose);
    useEffect(() => {
        if (!open || !ref.current) return;
        const release = containDialogFocus(ref.current, close);
        const body = ref.current.ownerDocument.body;
        const overflow = body.style.overflow;
        body.style.overflow = 'hidden';
        return () => { body.style.overflow = overflow; release(); };
    }, [open]);
    if (!open) return null;
    return <div className="hc-drawer-layer">
        <div className="hc-drawer-backdrop" aria-hidden="true" onClick={requestClose} />
        <aside ref={ref} className={`hc-drawer is-${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <header className="hc-drawer-header">
                <h2 id={titleId}>{title}</h2>
                <button type="button" className="hc-drawer-close" onClick={requestClose} disabled={busy} aria-label={msg(MSG.DRAWER_CLOSE_LABEL, { title: typeof title === 'string' ? title : '' })}><X size={20} aria-hidden="true" /></button>
            </header>
            <div className="hc-drawer-body">{children}</div>
        </aside>
    </div>;
}
