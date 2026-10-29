import { useEffect, useEffectEvent, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { MSG, msg } from '../../messages/index.js';
import { containDialogFocus } from '../../services/dialogFocus.js';
import '../../style/ui.css';

/**
 * Hộp thoại giữa màn hình cho xác nhận ngắn hoặc xem chi tiết. Giữ focus bên trong, Esc / nền mờ để đóng,
 * trả focus về nút đã mở; khi `busy` thì không cho đóng. Form dài dùng Drawer thay vì Modal.
 * @param options0 { open, title, onClose, busy, footer, children, size: 'md' | 'lg' }.
 */
export default function Modal({ open, title, onClose, busy = false, footer, children, size = 'md' }) {
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
    return <div className="hc-modal-layer">
        <div className="hc-modal-backdrop" aria-hidden="true" onClick={requestClose} />
        <div ref={ref} className={`hc-modal is-${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <header className="hc-modal-header"><h2 id={titleId}>{title}</h2>
                <button type="button" className="hc-modal-close" onClick={requestClose} disabled={busy} aria-label={msg(MSG.DRAWER_CLOSE_LABEL, { title: typeof title === 'string' ? title : '' })}><X size={20} aria-hidden="true" /></button></header>
            <div className="hc-modal-body">{children}</div>
            {footer && <footer className="hc-modal-footer">{footer}</footer>}
        </div>
    </div>;
}
