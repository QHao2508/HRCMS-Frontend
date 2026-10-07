import { useEffect, useState, useRef } from 'react';
import { MSG, msg } from '../../messages/index.js';
import { ATTACHMENT_TYPE, INTAKE_LIMITS } from '../../constants/registration.js';
import { validateAttachment, fetchAttachment } from '../../services/registrationAttachments.js';

/**
 * Chọn/kiểm ảnh ngựa và preview bằng object URL trong bộ nhớ; giải phóng URL khi thay ảnh/unmount, không lưu file local.
 * Object URL chỉ là tài nguyên bộ nhớ browser; được revoke khi không còn dùng.
 * Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { file, onChange, disabled }. Các props/callback lấy từ caller.
 */
export function HorsePhotoInput({ file, onChange, disabled }) {
    const image = useRef(null);
    const [error, setError] = useState('');
    const input = useRef(null);
    useEffect(() => {
        if (!file || !image.current) return;
        const element = image.current;
        const url = URL.createObjectURL(file); element.src = url;
        return () => { element.removeAttribute('src'); URL.revokeObjectURL(url); };
    }, [file]);
    /**
     * Đọc file được chọn, kiểm PNG/JPEG và dung lượng trước khi cập nhật state; không upload file lỗi.
     * @param event Event UI; đọc target/currentTarget, chặn submit mặc định khi cần.
     */
    function choose(event) {
        const selected = event.target.files?.[0] || null;
        const failure = selected ? validateAttachment({ file: selected, type: ATTACHMENT_TYPE.HorsePhoto }) : '';
        setError(failure);
        if (failure) { event.target.value = ''; return; }
        onChange(selected);
    }
    /**
     * Xóa lựa chọn ảnh và reset input để có thể chọn lại cùng file.
     */
    function remove() { if (input.current) input.current.value = ''; setError(''); onChange(null); }
    return <div className="surface-card upload-zone">
        <label className="form-label h2" htmlFor="new-horse-photo">{msg(MSG.ANH_NHAN_DIEN_NGUA)}</label>
        <p className="muted-caption">{msg(MSG.PHOTO_PICKER_HELP, { size: INTAKE_LIMITS.maxFileBytes / 1048576 })}</p>
        <input ref={input} id="new-horse-photo" className="visually-hidden" type="file" accept=".png,.jpg,.jpeg" disabled={disabled} onChange={choose} aria-describedby="new-horse-photo-error" />
        <div className="d-flex align-items-center gap-2 mt-2"><label htmlFor="new-horse-photo" className={`btn btn-outline-primary ${disabled ? 'disabled' : ''}`} aria-disabled={disabled}>{msg(MSG.PHOTO_SELECT)}</label><span className="text-break">{file?.name || msg(MSG.PHOTO_NONE_SELECTED)}</span></div>
        {error && <p id="new-horse-photo-error" className="text-danger" role="alert">{error}</p>}
        {file && <div className="mt-3"><img ref={image} className="horse-photo" alt={msg(MSG.PHOTO_PREVIEW)} /><p>{file.name}</p><button className="btn btn-outline-secondary" type="button" onClick={remove} disabled={disabled}>{msg(MSG.PHOTO_REMOVE_SELECTION)}</button></div>}
    </div>;
}

/**
 * Tải ảnh đã lưu qua API kiểm quyền, bỏ response muộn và revoke object URL khi đổi ảnh hoặc rời trang.
 * Object URL chỉ là tài nguyên bộ nhớ browser; được revoke khi không còn dùng.
 * Effect phối hợp dữ liệu/tài nguyên ngoài React; cần cleanup và bỏ response cũ khi unmount/đổi dependency.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { registrationId, attachmentId }. Các props/callback lấy từ caller.
 */
export function RegistrationPhotoPreview({ registrationId, attachmentId }) {
    const [photo, setPhoto] = useState({ id: null, url: null, failed: false });
    useEffect(() => {
        if (!attachmentId) return;
        let active = true, url;
        fetchAttachment(registrationId, attachmentId).then(blob => {
            if (active) { url = URL.createObjectURL(blob); setPhoto({ id: attachmentId, url, failed: false }); }
        }).catch(() => { if (active) setPhoto({ id: attachmentId, url: null, failed: true }); });
        return () => { active = false; if (url) URL.revokeObjectURL(url); };
    }, [registrationId, attachmentId]);
    if (!attachmentId) return null;
    if (photo.id !== attachmentId) return <p role="status">{msg(MSG.PHOTO_LOADING)}</p>;
    return photo.url ? <img className="horse-photo mb-3" src={photo.url} alt={msg(MSG.ANH_NHAN_DIEN_NGUA)} /> : <p className="text-body-secondary">{msg(MSG.PHOTO_LOAD_FAILED)}</p>;
}
