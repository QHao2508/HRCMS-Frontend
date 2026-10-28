import { useEffect, useEffectEvent, useRef } from 'react';
import { containDialogFocus } from './dialogFocus.js';
import { MSG, msg } from '../messages/index.js';

export function confirmMedicalClose(ref, onClose) {
    if (ref.current?.dataset.dirty === 'true' && !window.confirm(msg(MSG.UX_DISCARD))) return;
    onClose();
}

export function useMedicalDialog(open, saving, onClose) {
    const ref = useRef(null);
    const close = useEffectEvent(() => { if (!saving) confirmMedicalClose(ref,onClose); });
    useEffect(() => {
        if (!open || !ref.current) return;
        const dialog = ref.current;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const dirty = () => { dialog.dataset.dirty = 'true'; };
        const beforeUnload = event => { if (dialog.dataset.dirty === 'true') {event.preventDefault();event.returnValue='';} };
        dialog.addEventListener('input',dirty);
        dialog.addEventListener('change',dirty);
        window.addEventListener('beforeunload',beforeUnload);
        const releaseFocus = containDialogFocus(dialog, close);
        return () => {
            dialog.removeEventListener('input',dirty);
            dialog.removeEventListener('change',dirty);
            window.removeEventListener('beforeunload',beforeUnload);
            document.body.style.overflow = previousOverflow;
            releaseFocus();
        };
    }, [open]);
    return ref;
}
