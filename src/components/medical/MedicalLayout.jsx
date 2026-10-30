import { useSearchParams } from 'react-router-dom';
import { Activity, ShieldCheck } from 'lucide-react';
import { MSG, msg } from '../../messages/index.js';
import PageHeader from '../ui/PageHeader.jsx';
import StatusBadge from '../ui/StatusBadge.jsx';
import Tabs from '../ui/Tabs.jsx';
import '../../style/medical.css';

const links = [
    ['/medical', MSG.MEDICAL_WORKSPACE_OVERVIEW],
    ['/medical/examination', MSG.MEDICAL_WORKSPACE_RECORDS],
    ['/medical/injury', MSG.MEDICAL_WORKSPACE_INJURIES],
    ['/medical/treatment', MSG.MEDICAL_WORKSPACE_TREATMENTS],
    ['/medical/restrictions', MSG.MEDICAL_WORKSPACE_RESTRICTIONS],
    ['/medical/follow-up', MSG.MEDICAL_WORKSPACE_FOLLOWUP],
];

/**
 * Khung chung của khu y tế: phần đầu trang và thanh tab giống các màn khác (không còn header nâu riêng).
 * Ngựa đang chọn (?horseId=) được giữ khi chuyển tab để bác sĩ không phải chọn lại.
 */
export default function MedicalLayout({ children }) {
    const [search] = useSearchParams();
    const patient = search.get('horseId');
    const patientQuery = patient ? `?horseId=${encodeURIComponent(patient)}` : '';
    return <section className="medical-app">
        <PageHeader eyebrow={<><Activity size={14} aria-hidden="true" />{' '}{msg(MSG.MEDICAL_WORKSPACE_EYEBROW)}</>} title={msg(MSG.MEDICAL_WORKSPACE_TITLE)} description={msg(MSG.MEDICAL_WORKSPACE_DESCRIPTION)}
            actions={<StatusBadge tone="info"><ShieldCheck size={14} aria-hidden="true" />{msg(MSG.MEDICAL_WORKSPACE_VET)}</StatusBadge>} />
        <Tabs label={msg(MSG.MEDICAL_WORKSPACE_NAV)} tabs={links.map(([to, key]) => ({ id: to, label: msg(key), to: to + patientQuery }))} />
        <div className="medical-content">{children}</div>
    </section>;
}
