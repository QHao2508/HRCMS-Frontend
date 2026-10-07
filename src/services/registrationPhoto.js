import { createRegistration, updateRegistration } from './registrationService.js';
import { uploadAttachment } from './registrationAttachments.js';
import { ATTACHMENT_TYPE } from '../constants/registration.js';
import { MSG, msg } from '../messages/index.js';

/** Save the record before uploading. onSaved retains its ID even if the photo upload fails. */
export async function saveDraftWithPhoto({ registrationId, values, file, onSaved }) {
    const record = registrationId ? await updateRegistration(registrationId, values) : await createRegistration(values);
    if (!record?.id) throw new Error(msg(MSG.PHOTO_INVALID_DRAFT_RESPONSE));
    onSaved(record);
    if (file) await uploadAttachment(record.id, { file, type: ATTACHMENT_TYPE.HorsePhoto });
    return record;
}
