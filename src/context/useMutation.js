import { MSG, msg } from "../messages/index.js";
import { useRef, useState } from "react";
/**
 * Quản lý thao tác ghi với pending/error/notice; đánh dấu uncertain khi kết quả máy chủ chưa chắc chắn để tránh retry mù.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export function useMutation() {
    const gate = useRef(false);
    const [state, setState] = useState({ pending: false, error: null, notice: "", uncertain: false });
    /**
     * Khóa lượt thao tác đang chạy, gọi hàm ghi rồi reload/callback; ghi nhận thành công hoặc lỗi và yêu cầu đối soát khi kết quả chưa chắc chắn.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     * @param action Giá trị action truyền vào run; tham chiếu phần thân để xem cách dùng.
     * @param onSuccess Giá trị onSuccess truyền vào run; tham chiếu phần thân để xem cách dùng.
     * @param notice Giá trị notice truyền vào run; tham chiếu phần thân để xem cách dùng.
     */
    async function run(action, onSuccess, notice = msg(MSG.DA_LUU_THAY_DOI)) {
        if (gate.current || state.uncertain) return false;
        gate.current = true;
        setState({ pending: true, error: null, notice: "", uncertain: false });
        try { const data = await action(); if (onSuccess) await onSuccess(data); setState({ pending: false, error: null, notice, uncertain: false }); return true; }
        catch (error) { setState({ pending: false, error, notice: "", uncertain: !error.status || error.status >= 500 || [403,404,409].includes(error.status) }); return false; }
        finally { gate.current = false; }
    }
    /**
     * Xóa lỗi/thông báo/trạng thái uncertain của hook trước một lượt thao tác mới đã được kiểm tra.
     */
    function reset() { if (!gate.current) setState({ pending: false, error: null, notice: "", uncertain: false }); }
    return { ...state, run, reset };
}
