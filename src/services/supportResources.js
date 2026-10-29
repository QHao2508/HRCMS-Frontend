import { clubDateTime } from './displayDate.js';
import {useCallback,useState} from 'react';
import { MSG, msg } from '../messages/index.js';
import {useRegistrationResource} from '../context/useRegistrationResource.js';
import {allPages,read} from './supportService.js';
import {getEnumLabel} from '../constants/enumLabels.js';
export function useChoices(path, params) {
    const key = JSON.stringify(params || {});
    const load = useCallback(() => path ? allPages(path, JSON.parse(key)) : Promise.resolve([]), [path, key]);
    return useRegistrationResource(load, { realtime: true });
}
export function usePaged(path, params = {}) {
    const [page, setPage] = useState(1);
    const key = JSON.stringify(params);
    const load = useCallback(() => path ? read(path, { ...JSON.parse(key), page, pageSize: 20 }) : Promise.resolve({ items: [], page: 1, pageSize: 20, total: 0 }), [path, key, page]);
    const resource = useRegistrationResource(load, { realtime: true });
    return { ...resource, setPage };
}
export const choices = (items = [], name = 'name') => [{ value: '', label: msg(MSG.SUPPORT_SELECT) }, ...items.map(x => ({ value: x.id, label: x[name] || x.userName || x.id }))];
export const when = clubDateTime;
const statusKeys = { PartiallyReceived: MSG.BR_PARTIAL, Received: MSG.BR_RECEIVED, Pending: MSG.SUPPORT_PENDING, InProgress: MSG.SUPPORT_PROGRESS, Completed: MSG.SUPPORT_COMPLETED, Skipped: MSG.SUPPORT_SKIPPED, IssueReported: MSG.SUPPORT_ISSUE, Approved: MSG.SUPPORT_APPROVED, Rejected: MSG.SUPPORT_REJECTED, Clean: MSG.SUPPORT_CLEAN, NeedsCleaning: MSG.SUPPORT_DIRTY };
export function supportLabel(value) { return Object.hasOwn(statusKeys, value) ? msg(statusKeys[value]) : getEnumLabel(value); }
