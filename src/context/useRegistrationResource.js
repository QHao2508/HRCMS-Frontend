import { useEffect, useState, useSyncExternalStore } from "react";
import { getRealtimeRevision, subscribeRealtime } from "../services/realtimeEvents.js";
const ignoreRealtime = () => () => {};
const zeroRevision = () => 0;

// Keyed results and cleanup prevent an older request exposing the previous record.
/**
 * Tải dữ liệu theo loader và phiên hiện tại, bỏ response cũ khi unmount/đổi loader; trả loading, error, data và reload.
 * Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.
 * @param load Giá trị load truyền vào useRegistrationResource; tham chiếu phần thân để xem cách dùng.
 */
export function useRegistrationResource(load, { realtime = false } = {}) {
    const revision = useSyncExternalStore(realtime ? subscribeRealtime : ignoreRealtime, realtime ? getRealtimeRevision : zeroRevision, zeroRevision);
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState(null);
    useEffect(() => {
        let active = true;
        Promise.resolve().then(load).then(
            (data) => { if (active) setResult({ load, attempt, revision, data }); },
            (error) => { if (active) setResult({ load, attempt, revision, error }); },
        );
        return () => { active = false; };
    }, [load, attempt, revision]);
    const current = result?.load === load && result?.attempt === attempt && result?.revision === revision ? result : null;
    return { loading: !current, data: current?.data, error: current?.error, reload:
    /**
     * Yêu cầu loader chạy lại để lấy trạng thái thật từ API, không tự giả lập dữ liệu thành công.
     */
    () => setAttempt((value) => value + 1) };
}
