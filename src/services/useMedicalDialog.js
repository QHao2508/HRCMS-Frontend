import { useEffect, useEffectEvent, useRef } from 'react';
import { containDialogFocus } from './dialogFocus.js';

export function useMedicalDialog(open, saving, onClose) {
    const ref = useRef(null);
    const close = useEffectEvent(() => { if (!saving) onClose(); });
    useEffect(() => {
        if (open && ref.current) return containDialogFocus(ref.current, close);
    }, [open]);
    return ref;
}
