import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Only declared list filters are read/written; retain unrelated context such as horseId. */
export function useListFilters(defaults) {
    const [params,setParams] = useSearchParams();
    const query = params.toString();
    const schema = JSON.stringify(defaults);
    const filter = useMemo(() => {
        const search = new URLSearchParams(query);
        return Object.fromEntries(Object.entries(JSON.parse(schema)).map(([key,fallback]) => {
            const raw = search.get(key);
            if (raw === null) return [key,fallback];
            if (typeof fallback === 'number') {
                const value = Number(raw);
                return [key,Number.isSafeInteger(value) && value > 0 && value <= 2147483647 ? value : fallback];
            }
            return [key,raw];
        }));
    }, [query,schema]);
    const update = useCallback(next => {
        const values = typeof next === 'function' ? next(filter) : next;
        setParams(previous => {
            const search = new URLSearchParams(previous);
            for (const [key,fallback] of Object.entries(JSON.parse(schema))) {
                const value = values[key] ?? fallback;
                if (String(value) === String(fallback)) search.delete(key);
                else search.set(key,String(value));
            }
            return search;
        });
    }, [filter,schema,setParams]);
    return [filter,update];
}
