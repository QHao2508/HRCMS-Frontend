const selector = 'button, input, select, textarea, a[href], [tabindex]';

export function containDialogFocus(dialog, onClose) {
    const doc = dialog.ownerDocument;
    const previous = doc.activeElement;
    const controls = () => [...dialog.querySelectorAll(selector)].filter(element =>
        !element.disabled && element.tabIndex >= 0 && element.getClientRects().length > 0);
    const first = () => controls().find(element => element.matches('input, select, textarea')) || controls()[0];
    first()?.focus();
    const keydown = event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onClose();
        } else if (event.key === 'Tab') {
            const items = controls();
            const index = items.indexOf(doc.activeElement);
            if (index < 0 || (!event.shiftKey && index === items.length - 1) || (event.shiftKey && index === 0)) {
                event.preventDefault();
                (event.shiftKey ? items.at(-1) : items[0])?.focus();
            }
        }
    };
    const focusin = event => { if (!dialog.contains(event.target)) first()?.focus(); };
    doc.addEventListener('keydown', keydown, true);
    doc.addEventListener('focusin', focusin);
    return () => {
        doc.removeEventListener('keydown', keydown, true);
        doc.removeEventListener('focusin', focusin);
        if (previous?.isConnected) previous.focus();
    };
}
