import api from "./api.js";
import { ATTACHMENT_TYPES, INTAKE_LIMITS } from "../constants/registration.js";
import { validDate } from "./registrationValidation.js";

const path = (id) => `/api/registrations/${encodeURIComponent(id)}/attachments`;
export async function listAttachments(id) { return (await api.get(path(id))).data; }
export function validateAttachment({ file, type, certificateNumber = "", issueDate = "", expiryDate = "" }, count = 0) {
    if (!ATTACHMENT_TYPES.includes(type)) return "Choose a supported intake attachment type.";
    if (!file || file.size === 0) return "Choose a non-empty file.";
    if (file.size > INTAKE_LIMITS.maxFileBytes) return "Each file must be 10 MiB or smaller.";
    if (count >= INTAKE_LIMITS.maxAttachments) return "The registration has reached its 20-file limit.";
    if (file.name.length > 200) return "The filename must be at most 200 characters.";
    if (!(type === "HorsePhoto" ? /\.(png|jpe?g)$/i : /\.(png|jpe?g|pdf)$/i).test(file.name)) return type === "HorsePhoto" ? "Horse photos must be PNG or JPEG." : "Choose a PNG, JPEG or PDF file.";
    if (type === "Certificate") {
        if (certificateNumber.length > 100) return "Certificate number must be at most 100 characters.";
        if ((issueDate && !validDate(issueDate)) || (expiryDate && !validDate(expiryDate))) return "Enter valid certificate dates.";
        if (issueDate && expiryDate && expiryDate < issueDate) return "Expiry date cannot precede issue date.";
    }
    return "";
}
export function attachmentFormData(values) {
    const form = new FormData();
    form.append("file", values.file);
    form.append("type", values.type);
    if (values.type === "Certificate") {
        for (const name of ["certificateNumber", "issueDate", "expiryDate"]) {
            if (values[name]?.trim()) form.append(name, values[name].trim());
        }
    }
    return form;
}
export async function uploadAttachment(id, values) {
    return (await api.post(path(id), attachmentFormData(values))).data;
}
export async function fetchAttachment(id, attachmentId) {
    return (await api.get(`${path(id)}/${encodeURIComponent(attachmentId)}`, { responseType: "blob" })).data;
}
