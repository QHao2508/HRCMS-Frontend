import { NavLink, useSearchParams } from 'react-router-dom';
import { Activity, ClipboardPlus, HeartPulse, ShieldCheck, Stethoscope, Bandage, ClipboardCheck } from 'lucide-react';
import { MSG, msg } from '../../messages/index.js';
import '../../style/medical.css';

const links = [
    ['/medical', MSG.MEDICAL_WORKSPACE_OVERVIEW, Stethoscope],
    ['/medical/examination', MSG.MEDICAL_WORKSPACE_RECORDS, ClipboardPlus],
    ['/medical/injury', MSG.MEDICAL_WORKSPACE_INJURIES, Bandage],
    ['/medical/treatment', MSG.MEDICAL_WORKSPACE_TREATMENTS, HeartPulse],
    ['/medical/restrictions', MSG.MEDICAL_WORKSPACE_RESTRICTIONS, ShieldCheck],
    ['/medical/follow-up', MSG.MEDICAL_WORKSPACE_FOLLOWUP, ClipboardCheck],
];

export default function MedicalLayout({ children }) {
    const [search] = useSearchParams();
    const patient = search.get('horseId');
    const patientQuery = patient ? `?horseId=${encodeURIComponent(patient)}` : '';
    return <section className="medical-app">
        <header className="medical-workspace-heading">
            <div><span className="medical-workspace-eyebrow"><Activity size={16} aria-hidden="true" />{msg(MSG.MEDICAL_WORKSPACE_EYEBROW)}</span>
                <h1>{msg(MSG.MEDICAL_WORKSPACE_TITLE)}</h1><p>{msg(MSG.MEDICAL_WORKSPACE_DESCRIPTION)}</p></div>
            <span className="medical-clinician-badge"><ShieldCheck size={18} aria-hidden="true" />{msg(MSG.MEDICAL_WORKSPACE_VET)}</span>
        </header>
        <div className="medical-body">
            <nav className="medical-nav" aria-label={msg(MSG.MEDICAL_WORKSPACE_NAV)}>
                {links.map(([to, key, Icon]) => <NavLink key={to} to={to + patientQuery} end={to === '/medical'}
                    className={({ isActive }) => `medical-nav-link${isActive ? ' active' : ''}`}>
                    <Icon size={18} aria-hidden="true" /><span>{msg(key)}</span>
                </NavLink>)}
            </nav>
            <div className="medical-content">{children}</div>
        </div>
    </section>;
}
