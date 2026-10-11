import { FileText, CalendarDays, HeartPulse } from 'lucide-react';
import { MSG, msg } from '../../messages/index.js';

const benefits = [
    { icon: FileText, title: MSG.AUTH_INTRO_RECORDS, body: MSG.AUTH_INTRO_RECORDS_BODY },
    { icon: CalendarDays, title: MSG.AUTH_INTRO_TRAINING, body: MSG.AUTH_INTRO_TRAINING_BODY },
    { icon: HeartPulse, title: MSG.AUTH_INTRO_HEALTH, body: MSG.AUTH_INTRO_HEALTH_BODY },
];

/** Shared product introduction for public account forms. */
export default function AuthIntro() {
    return <aside className="auth-intro" aria-labelledby="auth-intro-title">
        <div className="auth-intro-copy">
            <p className="auth-intro-eyebrow">{msg(MSG.AUTH_INTRO_EYEBROW)}</p>
            <h2 id="auth-intro-title">{msg(MSG.AUTH_INTRO_TITLE)}</h2>
            <p>{msg(MSG.AUTH_INTRO_BODY)}</p>
            <ul className="auth-benefits">{benefits.map(({ icon: Icon, title, body }) => <li key={title}>
                <span className="auth-benefit-icon"><Icon size={22} aria-hidden="true" /></span>
                <div><h3>{msg(title)}</h3><p>{msg(body)}</p></div>
            </li>)}</ul>
        </div>
        <img className="auth-intro-photo" src="/images/home-scope-horse.jpg" width={1200} height={896} alt={msg(MSG.HOME_REFERENCE_HORSE_ALT)} />
    </aside>;
}
