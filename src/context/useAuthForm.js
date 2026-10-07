import { MSG, msg } from "../messages/index.js";
import { useRef, useState } from "react";

/**
 * Giữ values/errors/pending cho form auth, kiểm bằng validator và khóa bằng ref để không gửi hai request cùng lúc.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param initialValues Giá trị initialValues truyền vào useAuthForm; tham chiếu phần thân để xem cách dùng.
 * @param validate Giá trị validate truyền vào useAuthForm; tham chiếu phần thân để xem cách dùng.
 */
export function useAuthForm(initialValues, validate) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [pending, setPending] = useState(null);
    const busy = useRef(false);

    /**
     * Cập nhật field theo event và xóa lỗi cũ của field; giữ form controlled.
     * @param event Event UI; đọc target/currentTarget, chặn submit mặc định khi cần.
     */
    function onChange(event) {
        const { name, value } = event.target;
        setValues((previous) => ({ ...previous, [name]: value }));
        setErrors((previous) => ({ ...previous, [name]: "" }));
        setError("");
    }

    /**
     * Kiểm điều kiện form rồi gọi thao tác nghiệp vụ tương ứng; hook/lock ngăn request lặp và điều hướng chỉ sau thành công.
     * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
     * @param action Giá trị action truyền vào submit; tham chiếu phần thân để xem cách dùng.
     * @param validator Giá trị validator truyền vào submit; tham chiếu phần thân để xem cách dùng.
     * @param actionName Giá trị actionName truyền vào submit; tham chiếu phần thân để xem cách dùng.
     */
    async function submit(action, validator = validate, actionName = "submit") {
        if (busy.current) return;
        const nextErrors = validator(values);
        setErrors(nextErrors);
        setError("");
        if (Object.keys(nextErrors).length) return;
        busy.current = true;
        setPending(actionName);
        try {
            await action(values);
        } catch (failure) {
            setError(failure.message || msg(MSG.UNABLE_TO_COMPLETE_THE_REQUEST_PLEASE_TRY_AGAIN));
        } finally {
            busy.current = false;
            setPending(null);
        }
    }

    /**
     * Tạo props name/value/onChange/error cho AuthInput từ trạng thái hook form.
     * @param name Tên/key đầu vào theo mục đích hàm; xem kiểu và điều kiện kiểm trong thân hàm.
     */
    function field(name) {
        return { name, value: values[name], onChange, error: errors[name] };
    }

    return { values, errors, error, pending, field, submit };
}
