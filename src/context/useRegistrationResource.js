import { useEffect, useState } from "react";

// Keyed results and cleanup prevent an older request exposing the previous record.
/**
 * Tải dữ liệu theo loader và phiên hiện tại, bỏ response cũ khi unmount/đổi loader; trả loading, error, data và reload.
 * Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.
 * @param load Giá trị load truyền vào useRegistrationResource; tham chiếu phần thân để xem cách dùng.
 */
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
    return { loading: !current, data: current?.data, error: current?.error, reload:
    /**
     * Yêu cầu loader chạy lại để lấy trạng thái thật từ API, không tự giả lập dữ liệu thành công.
     */
    () => setAttempt((value) => value + 1) };
}
