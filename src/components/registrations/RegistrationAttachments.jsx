import { useRef, useState } from "react";
import { ATTACHMENT_TYPES, ATTACHMENT_LABELS } from "../../constants/registration.js";
import { fetchAttachment, validateAttachment } from "../../services/registrationAttachments.js";
import RegistrationError from "./RegistrationError.jsx";

const empty = { type: "HorsePhoto", file: null, certificateNumber: "", issueDate: "", expiryDate: "" };
const ownerTypeLabels = { HorsePhoto: "Ảnh ngựa", Certificate: "Giấy chứng nhận", MedicalDocument: "Tài liệu sức khỏe" };

export default function RegistrationAttachments({ registrationId, attachments, editable, busy, onUpload, owner = false, manager = false }) {
    const [values, setValues] = useState(empty);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(null);
    const downloadLock = useRef(false);
    const fileInput = useRef(null);
    function change(event) {
        const { name, value, files } = event.target;
        setValues((previous) => ({ ...previous, [name]: name === "file" ? files[0] || null : value }));
        setError(null);
    }
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
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (failure) { setError(failure); }
        finally { downloadLock.current = false; setDownloading(null); }
    }
    const typeLabel = (type) => owner || manager
        ? ownerTypeLabels[type] || "Tài liệu"
        : Object.hasOwn(ATTACHMENT_LABELS, type) ? ATTACHMENT_LABELS[type] : "Attachment";
    if (manager) return <div className="hrcms-manager-attachments">
        <div className="hrcms-registration-table-scroll hrcms-manager-attachment-scroll">
            <table className="hrcms-registration-table hrcms-manager-attachment-table">
                <thead><tr><th scope="col">Tài liệu</th><th scope="col">Loại / kích thước</th><th scope="col">Thao tác</th></tr></thead>
                <tbody>{attachments.length ? attachments.map((item) => <tr key={item.id}>
                    <td><strong>{item.fileName}</strong>
                        {item.certificateNumber && <small>Số chứng nhận: {item.certificateNumber}</small>}
                        {(item.issueDate || item.expiryDate) && <small>Ngày cấp / hết hạn: {item.issueDate || "—"} / {item.expiryDate || "—"}</small>}
                    </td>
                    <td>{typeLabel(item.type)} · {Math.ceil(item.length / 1024)} KiB</td>
                    <td><button type="button" className="hrcms-registration-table-action" disabled={!!downloading}
                        onClick={() => download(item)}>{downloading === item.id ? "Đang tải..." : "Tải xuống"}</button></td>
                </tr>) : <tr><td colSpan={3}>Chưa có tài liệu đính kèm.</td></tr>}</tbody>
            </table>
        </div>
        <RegistrationError error={error} />
    </div>;
    return <section aria-labelledby="attachments-title"
        className={owner ? "hrcms-registration-card hrcms-registration-attachments" : "border rounded p-3 my-3"}>
        <h2 id="attachments-title" className={owner ? undefined : "h5"}>{owner ? "Tài liệu đính kèm" : "Attachments"}</h2>
        <p className={owner ? "hrcms-registration-card-description" : undefined}>
            {owner
                ? "Thêm ảnh ngựa và giấy chứng nhận trước khi gửi. Tệp đã tải lên hiện chưa thể xóa hoặc thay thế."
                : "Include a horse photo and a certificate before submitting. Uploaded files cannot currently be removed or replaced through this workflow."}
        </p>
        <RegistrationError error={error} />
        {!attachments.length
            ? <p className={owner ? "hrcms-registration-empty" : undefined}>
                {owner ? "Chưa có tệp đính kèm." : "No attachments uploaded yet."}
            </p>
            : owner
                ? <div className="hrcms-registration-table-scroll"><table className="hrcms-registration-table">
                    <thead><tr><th scope="col">Tệp</th><th scope="col">Loại tài liệu</th>
                        <th scope="col">Số tài liệu</th><th scope="col">Thao tác</th></tr></thead>
                    <tbody>{attachments.map((item) => <tr key={item.id}>
                        <td><strong>{item.fileName}</strong><small>{Math.ceil(item.length / 1024)} KiB</small></td>
                        <td>{typeLabel(item.type)}</td>
                        <td>{item.certificateNumber || "—"}
                            {item.issueDate && <small>Ngày cấp: {item.issueDate}</small>}
                            {item.expiryDate && <small>Hết hạn: {item.expiryDate}</small>}
                        </td>
                        <td><button type="button" className="hrcms-registration-table-action" disabled={!!downloading}
                            onClick={() => download(item)}>{downloading === item.id ? "Đang tải..." : "Tải xuống"}</button></td>
                    </tr>)}</tbody>
                </table></div>
                : <ul className="list-group mb-3">
                    {attachments.map((item) => <li className="list-group-item" key={item.id}>
                        <div className="d-flex flex-wrap justify-content-between gap-2">
                            <div><strong>{item.fileName}</strong> <span className="text-body-secondary">
                                ({typeLabel(item.type)}, {Math.ceil(item.length / 1024)} KiB)</span>
                                {item.certificateNumber && <div>Certificate number: {item.certificateNumber}</div>}
                                {item.issueDate && <div>Issued: {item.issueDate}</div>}
                                {item.expiryDate && <div>Expires: {item.expiryDate}</div>}
                            </div>
                            <button type="button" className="btn btn-outline-primary" disabled={!!downloading} onClick={() => download(item)}>
                                {downloading === item.id ? "Downloading..." : "Download"}
                            </button>
                        </div>
                    </li>)}
                </ul>}
        {editable && <form onSubmit={upload} noValidate>
            <fieldset disabled={busy} className={owner ? "hrcms-registration-upload-fieldset" : undefined}>
                <legend className={owner ? undefined : "h6"}>{owner ? "Tải tài liệu lên" : "Upload attachment"}</legend>
                <p className={owner ? "hrcms-registration-card-description" : "text-body-secondary"}>
                    {owner
                        ? "Tối đa 20 tệp, mỗi tệp 10 MiB. Ảnh PNG/JPEG; tài liệu PNG/JPEG/PDF. Máy chủ kiểm tra nội dung tệp."
                        : "Up to 20 files, 10 MiB each. PNG/JPEG photos; PNG/JPEG/PDF documents. File contents are checked by the server."}
                </p>
                <div className={owner ? "hrcms-registration-upload-fields" : "row g-3"}>
                    <div className={owner ? "hrcms-registration-field" : "col-md-4"}>
                        <label htmlFor="attachment-type" className={owner ? undefined : "form-label"}>{owner ? "Loại tài liệu" : "Type"}</label>
                        <select id="attachment-type" name="type" value={values.type} onChange={change}
                            className={owner ? "hrcms-registration-input" : "form-select"}>
                            {ATTACHMENT_TYPES.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}
                        </select>
                    </div>
                    <div className={owner ? "hrcms-registration-field hrcms-registration-field-wide" : "col-md-8"}>
                        {owner
                            ? <div className="hrcms-registration-file-control">
                                <label id="attachment-file-label" htmlFor="attachment-file">Tệp</label>
                                <label htmlFor="attachment-file" className="hrcms-registration-upload-zone">
                                    <img src="/figma/registration/upload-cloud.svg" alt="" width="24" height="24" />
                                    <strong>{values.file?.name || "Chọn tệp"}</strong>
                                    <small>{values.type === "HorsePhoto" ? "Ảnh PNG/JPEG" : "Tài liệu PNG/JPEG/PDF"} · Tối đa 10 MiB</small>
                                </label>
                                <input id="attachment-file" name="file" type="file" ref={fileInput} onChange={change}
                                    className="hrcms-registration-file-input" aria-labelledby="attachment-file-label"
                                    accept={values.type === "HorsePhoto" ? ".png,.jpg,.jpeg" : ".png,.jpg,.jpeg,.pdf"} />
                            </div>
                            : <><label htmlFor="attachment-file" className="form-label">File</label>
                                <input id="attachment-file" name="file" type="file" ref={fileInput} onChange={change} className="form-control"
                                    accept={values.type === "HorsePhoto" ? ".png,.jpg,.jpeg" : ".png,.jpg,.jpeg,.pdf"} /></>}
                    </div>
                    {values.type === "Certificate" && <>
                        <div className={owner ? "hrcms-registration-field" : "col-md-4"}>
                            <label htmlFor="certificateNumber" className={owner ? undefined : "form-label"}>
                                {owner ? "Số chứng nhận (nếu có)" : "Certificate number (optional)"}
                            </label>
                            <input id="certificateNumber" name="certificateNumber" value={values.certificateNumber}
                                onChange={change} maxLength={100} className={owner ? "hrcms-registration-input" : "form-control"} />
                        </div>
                        {[["issueDate", owner ? "Ngày cấp (nếu có)" : "Issue date (optional)"],
                            ["expiryDate", owner ? "Ngày hết hạn (nếu có)" : "Expiry date (optional)"]].map(([name, label]) =>
                            <div className={owner ? "hrcms-registration-field" : "col-md-4"} key={name}>
                                <label htmlFor={name} className={owner ? undefined : "form-label"}>{label}</label>
                                <input id={name} name={name} type="date" value={values[name]} onChange={change}
                                    className={owner ? "hrcms-registration-input" : "form-control"} />
                            </div>)}
                    </>}
                </div>
                <button className={owner ? "hrcms-registration-button hrcms-registration-button-outline hrcms-registration-upload-action" : "btn btn-outline-primary mt-3"}
                    type="submit">{owner ? "Tải tệp lên" : "Upload attachment"}</button>
            </fieldset>
        </form>}
    </section>;
}
