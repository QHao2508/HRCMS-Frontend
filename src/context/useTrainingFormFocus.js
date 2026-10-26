import { useEffect, useRef } from 'react';

// The opening token changes only after an explicit user action, never a reload.
export function useTrainingFormFocus(opening, ready = true) {
    const panel = useRef(null);
    const focused = useRef(null);
    useEffect(() => {
        if (!opening) { focused.current = null; return; }
        if (!ready || focused.current === opening || !panel.current) return;
        const target = panel.current.querySelector('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)') || panel.current.querySelector('[data-training-form-heading]');
        if (!target) return;
        focused.current = opening;
        const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hc-header-height')) || 80;
        const rect = panel.current.getBoundingClientRect();
        if (rect.top < top + 16 || rect.top > window.innerHeight - 160 || target.getBoundingClientRect().bottom > window.innerHeight) {
            panel.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
        target.focus({ preventScroll: true });
    }, [opening, ready]);
    return panel;
}
