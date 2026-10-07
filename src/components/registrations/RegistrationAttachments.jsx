import { RegistrationPhotoPreview } from './HorsePhotoInput.jsx';
import { ATTACHMENT_TYPE } from "../../constants/registration.js";
import { MSG, msg } from "../../messages/index.js";
import { useRef, useState } from "react";
import { ATTACHMENT_TYPES, ATTACHMENT_LABELS, INTAKE_LIMITS } from "../../constants/registration.js";
import { fetchAttachment, validateAttachment } from "../../services/registrationAttachments.js";
import RegistrationError from "./RegistrationError.jsx";

const empty = { type: ATTACHMENT_TYPE.HorsePhoto, file: null, certificateNumber: "", issueDate: "", expiryDate: "" };
/**
 * Hiển thị metadata/preview ảnh, upload tài liệu và download có quyền; khóa lượt tải để tránh thao tác lặp.
 * Object URL chỉ là tài nguyên bộ nhớ browser; được revoke khi không còn dùng.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { registrationId, attachments, editable, busy, onUpload }. Các props/callback lấy từ caller.
 */
export default function RegistrationAttachments({ registrationId, attachments, editable, busy, onUpload }) {
    const [values, setValues] = useState(empty);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(null);
    const downloadLock = useRef(false);
    const fileInput = useRef(null);
    /**
     * Cập nhật form theo name/value và reset lựa chọn phụ thuộc khi cần, không tự sửa dữ liệu server.
     * @param event Event UI; đọc target/currentTarget, chặn submit mặc định khi cần.
     */
    function change(event) {
        const { name, value, files } = event.target;
        setValues((previous) => ({ ...previous, [name]: name === "file" ? files[0] || null : value }));
        setError(null);
    }
    /**
     * Kiểm file và trạng thái thao tác, gọi upload API rồi tải lại metadata để UI chỉ hiển thị tệp đã lưu.
     * @param event Event UI; đọc target/currentTarget, chặn submit mặc định khi cần.
     */
    async function upload(event) {
        event.preventDefault();
        if (busy) return;
        const message = validateAttachment(values, attachments.length);
        if (message) { setError(new Error(message)); return; }
        setError(null);
        if (await onUpload(values)) {
            setValues(empty);
            if (fileInput.current) fileInput.current.value = "";
        }
    }
    /**
     * Tải blob có quyền, tạo liên kết download trong bộ nhớ và thu hồi object URL; không dùng URL private trực tiếp.
     * Object URL chỉ là tài nguyên bộ nhớ browser; được revoke khi không còn dùng.
     * @param item Giá trị item truyền vào download; tham chiếu phần thân để xem cách dùng.
     */
    async function download(item) {
        if (downloadLock.current) return;
        downloadLock.current = true;
        setDownloading(item.id);
        setError(null);
        try {
            const blob = await fetchAttachment(registrationId, item.id);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = item.fileName || "attachment";
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            // Give the browser time to begin downloading before releasing memory.
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (failure) { setError(failure); }
        finally { downloadLock.current = false; setDownloading(null); }
    }
    return <section aria-labelledby="attachments-title" className="surface-card upload-zone">
        <h2 id="attachments-title" className="h5">{msg(MSG.FILE_DINH_KEM)}</h2>
        <p>{msg(MSG.HO_SO_CAN_CO_ANH_NGUA_VA_CHUNG_NHAN_TRUOC_KHI_GUI_CAC_FILE_DA_TAI_LEN_DU)}</p>
        <RegistrationError error={error} />
        <RegistrationPhotoPreview registrationId={registrationId} attachmentId={attachments.filter(item => item.type === ATTACHMENT_TYPE.HorsePhoto).at(-1)?.id} />
        {!attachments.length ? <p>{msg(MSG.CHUA_CO_FILE_DINH_KEM)}</p> : <ul className="list-group mb-3">
            {attachments.map((item) => <li className="list-group-item" key={item.id}>
                <div className="d-flex flex-wrap justify-content-between gap-2">
                    <div><strong>{item.fileName}</strong> <span className="text-body-secondary">{msg(MSG.SYMBOL)}{Object.hasOwn(ATTACHMENT_LABELS, item.type) ? ATTACHMENT_LABELS[item.type] : msg(MSG.ATTACHMENT)}{msg(MSG.SYMBOL_2)}{' '}{Math.ceil(item.length / 1024)}{' '}{msg(MSG.KIB)}</span>
                        {item.certificateNumber && <div>{msg(MSG.SO_CHUNG_NHAN)}{' '}{item.certificateNumber}</div>}
                        {item.issueDate && <div>{msg(MSG.NGAY_CAP)}{' '}{item.issueDate}</div>}
                        {item.expiryDate && <div>{msg(MSG.NGAY_HET_HAN)}{' '}{item.expiryDate}</div>}
                    </div>
                    <button type="button" className="btn btn-outline-primary" disabled={!!downloading} onClick={() => download(item)}>
                        {downloading === item.id ? msg(MSG.DANG_TAI) : msg(MSG.TAI_XUONG)}
                    </button>
                </div>
            </li>)}
        </ul>}
        {editable && <form onSubmit={upload} noValidate>
            <fieldset disabled={busy}>
                <legend className="h6">{msg(MSG.TAI_FILE_LEN)}</legend>
                <p className="text-body-secondary">{msg(MSG.ATTACHMENT_LIMITS, { count: INTAKE_LIMITS.maxAttachments, size: INTAKE_LIMITS.maxFileBytes / 1048576 })}</p>
                <div className="row g-3">
                    <div className="col-md-4"><label htmlFor="attachment-type" className="form-label">{msg(MSG.LOAI_TAI_LIEU)}</label>
                        <select id="attachment-type" name="type" value={values.type} onChange={change} className="form-select">
                            {ATTACHMENT_TYPES.map((type) => <option key={type} value={type}>{ATTACHMENT_LABELS[type]}</option>)}
                        </select></div>
                    <div className="col-md-8"><label htmlFor="attachment-file" className="form-label">{msg(MSG.CHON_FILE)}</label>
                        <input id="attachment-file" name="file" type="file" ref={fileInput} onChange={change} className="form-control"
                            accept={values.type === ATTACHMENT_TYPE.HorsePhoto ? ".png,.jpg,.jpeg" : ".png,.jpg,.jpeg,.pdf"} /></div>
                    {values.type === ATTACHMENT_TYPE.Certificate && <>
                        <div className="col-md-4"><label htmlFor="certificateNumber" className="form-label">{msg(MSG.SO_CHUNG_NHAN_KHONG_BAT_BUOC)}</label>
                            <input id="certificateNumber" name="certificateNumber" value={values.certificateNumber} onChange={change} maxLength={100} className="form-control" /></div>
                        {[["issueDate", msg(MSG.NGAY_CAP_2)], ["expiryDate", msg(MSG.NGAY_HET_HAN_2)]].map(([name, label]) => <div className="col-md-4" key={name}>
                            <label htmlFor={name} className="form-label">{label}{' '}{msg(MSG.KHONG_BAT_BUOC)}</label>
                            <input id={name} name={name} type="date" value={values[name]} onChange={change} onInput={change} className="form-control" />
                        </div>)}
                    </>}
                </div>
                <button className="btn btn-outline-primary mt-3" type="submit">{msg(MSG.TAI_FILE_LEN)}</button>
            </fieldset>
        </form>}
    </section>;
}
