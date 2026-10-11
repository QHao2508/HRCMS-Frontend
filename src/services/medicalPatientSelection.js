import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

// Keep the selected patient while moving between medical tabs. API scope remains authoritative.
export function useMedicalPatientSelection() {
    const [search, setSearch] = useSearchParams();
    const updateSearch = useRef(setSearch);
    useEffect(() => { updateSearch.current = setSearch; }, [setSearch]);
    const selected = search.get('horseId') || '';
    const select = useCallback(value => updateSearch.current(current => {
        const next = new URLSearchParams(current);
        const patient = typeof value === 'function' ? value(current.get('horseId') || '') : value;
        if (patient) next.set('horseId', patient); else next.delete('horseId');
        return next;
    }, { replace: true }), []);
    return [selected, select];
}
