import { useEffect } from 'react';

/** Browser refresh/close protection; in-app close actions separately confirm before discarding. */
export function useUnsavedChanges(dirty) {
    useEffect(() => {
        if (!dirty) return;
        const prevent = event => { event.preventDefault(); event.returnValue = ''; };
        window.addEventListener('beforeunload', prevent);
        return () => window.removeEventListener('beforeunload', prevent);
    }, [dirty]);
}
