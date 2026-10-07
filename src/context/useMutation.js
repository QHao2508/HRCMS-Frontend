import { useRef, useState } from "react";
export function useMutation() {
    const gate = useRef(false);
    const [state, setState] = useState({ pending: false, error: null, notice: "", uncertain: false });
    async function run(action, onSuccess, notice = "Đã lưu thay đổi.") {
        if (gate.current || state.uncertain) return false;
        gate.current = true;
        setState({ pending: true, error: null, notice: "", uncertain: false });
        try { const data = await action(); if (onSuccess) await onSuccess(data); setState({ pending: false, error: null, notice, uncertain: false }); return true; }
        catch (error) { setState({ pending: false, error, notice: "", uncertain: !error.status || error.status >= 500 || [403,404,409].includes(error.status) }); return false; }
        finally { gate.current = false; }
    }
    function reset() { if (!gate.current) setState({ pending: false, error: null, notice: "", uncertain: false }); }
    return { ...state, run, reset };
}
