import { useEffect, useState } from "react";

// Keyed results and cleanup prevent an older request exposing the previous record.
export function useRegistrationResource(load) {
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState(null);
    useEffect(() => {
        let active = true;
        Promise.resolve().then(load).then(
            (data) => { if (active) setResult({ load, attempt, data }); },
            (error) => { if (active) setResult({ load, attempt, error }); },
        );
        return () => { active = false; };
    }, [load, attempt]);
    const current = result?.load === load && result?.attempt === attempt ? result : null;
    return { loading: !current, data: current?.data, error: current?.error, reload: () => setAttempt((value) => value + 1) };
}
