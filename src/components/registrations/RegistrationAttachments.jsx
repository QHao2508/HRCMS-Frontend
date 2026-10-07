import { useRef, useState } from "react";
import { ATTACHMENT_TYPES, ATTACHMENT_LABELS } from "../../constants/registration.js";
import { fetchAttachment, validateAttachment } from "../../services/registrationAttachments.js";
import RegistrationError from "./RegistrationError.jsx";

const empty = { type: "HorsePhoto", file: null, certificateNumber: "", issueDate: "", expiryDate: "" };
export default function RegistrationAttachments({ registrationId, attachments, editable, busy, onUpload }) {
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
            // Give the browser time to begin downloading before releasing memory.
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (failure) { setError(failure); }
        finally { downloadLock.current = false; setDownloading(null); }
    }
    return <section aria-labelledby="attachments-title" className="border rounded p-3 my-3">
        <h2 id="attachments-title" className="h5">Attachments</h2>
        <p>Include a horse photo and a certificate before submitting. Uploaded files cannot currently be removed or replaced through this workflow.</p>
        <RegistrationError error={error} />
        {!attachments.length ? <p>No attachments uploaded yet.</p> : <ul className="list-group mb-3">
            {attachments.map((item) => <li className="list-group-item" key={item.id}>
                <div className="d-flex flex-wrap justify-content-between gap-2">
                    <div><strong>{item.fileName}</strong> <span className="text-body-secondary">({Object.hasOwn(ATTACHMENT_LABELS, item.type) ? ATTACHMENT_LABELS[item.type] : "Attachment"}, {Math.ceil(item.length / 1024)} KiB)</span>
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
            <fieldset disabled={busy}>
                <legend className="h6">Upload attachment</legend>
                <p className="text-body-secondary">Up to 20 files, 10 MiB each. PNG/JPEG photos; PNG/JPEG/PDF documents. File contents are checked by the server.</p>
                <div className="row g-3">
                    <div className="col-md-4"><label htmlFor="attachment-type" className="form-label">Type</label>
                        <select id="attachment-type" name="type" value={values.type} onChange={change} className="form-select">
                            {ATTACHMENT_TYPES.map((type) => <option key={type} value={type}>{ATTACHMENT_LABELS[type]}</option>)}
                        </select></div>
                    <div className="col-md-8"><label htmlFor="attachment-file" className="form-label">File</label>
                        <input id="attachment-file" name="file" type="file" ref={fileInput} onChange={change} className="form-control"
                            accept={values.type === "HorsePhoto" ? ".png,.jpg,.jpeg" : ".png,.jpg,.jpeg,.pdf"} /></div>
                    {values.type === "Certificate" && <>
                        <div className="col-md-4"><label htmlFor="certificateNumber" className="form-label">Certificate number (optional)</label>
                            <input id="certificateNumber" name="certificateNumber" value={values.certificateNumber} onChange={change} maxLength={100} className="form-control" /></div>
                        {[["issueDate", "Issue date"], ["expiryDate", "Expiry date"]].map(([name, label]) => <div className="col-md-4" key={name}>
                            <label htmlFor={name} className="form-label">{label} (optional)</label>
                            <input id={name} name={name} type="date" value={values[name]} onChange={change} className="form-control" />
                        </div>)}
                    </>}
                </div>
                <button className="btn btn-outline-primary mt-3" type="submit">Upload attachment</button>
            </fieldset>
        </form>}
    </section>;
}
