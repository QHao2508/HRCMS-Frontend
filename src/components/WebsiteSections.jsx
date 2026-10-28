import { Link } from 'react-router-dom';
import { FileText, Activity, HeartPulse } from 'lucide-react';
import { MSG, msg } from '../messages/index.js';
import { websiteAsset } from '../services/websiteStore.js';
import '../style/home.css';

const sections = [
    { id: 'hp-intake', icon: FileText, title: MSG.HOME_REFERENCE_F01_TITLE, description: MSG.HOME_REFERENCE_F01_DESCRIPTION, action: MSG.HOME_REFERENCE_VIEW_F01, tone: 'brown', destination: '#hp-workflow-intake' },
    { id: 'hp-training', icon: Activity, title: MSG.HOME_REFERENCE_F02_TITLE, description: MSG.HOME_REFERENCE_F02_DESCRIPTION, action: MSG.HOME_REFERENCE_VIEW_F02, tone: 'green', destination: '#hp-workflow-training' },
    { id: 'hp-health', icon: HeartPulse, title: MSG.HOME_REFERENCE_F03_TITLE, description: MSG.HOME_REFERENCE_F03_DESCRIPTION, action: MSG.HOME_REFERENCE_VIEW_F03, tone: 'orange', destination: '#hp-workflow-health' },
];
export default function WebsiteSections({ website, isAuthenticated = false, preview = false }) {
 const management = isAuthenticated ? '/dashboard' : '/login';
 return <><section className="hp-hero" aria-labelledby="hp-hero-title" style={website?.backgroundImageVersion?{backgroundImage:`linear-gradient(#eaddcae8,#eaddcae8),url("${websiteAsset("Background",website.backgroundImageVersion)}")`,backgroundSize:"cover",backgroundPosition:"center"}:undefined}>
                <div className="hp-container hp-hero-grid">
                    <div className="hp-hero-content">
                        <div className="hp-project-badge"><span aria-hidden="true" />{msg(MSG.HOME_REFERENCE_PROJECT_BADGE)}</div>
                        <h1 id="hp-hero-title">{website?.heroTitle || msg(MSG.UX_HOME_TITLE)}</h1>
                        <p className="hp-hero-description">{website?.heroDescription || msg(MSG.UX_HOME_BODY)}</p>
                        <div className="hp-hero-actions" inert={preview ? true : undefined}><Link className="hp-button hp-button-green" to={management}>{msg(isAuthenticated ? MSG.HOME_REFERENCE_MANAGEMENT : MSG.UX_HOME_ENTER)}</Link>{!isAuthenticated && <Link className="hp-button hp-button-outline" to="/register">{msg(MSG.UX_HOME_REGISTER)}</Link>}</div>
                        <dl className="hp-scope-stats"><div className="hp-tone-brown"><dt>{msg(MSG.HOME_REFERENCE_CORE_COUNT)}</dt><dd>{msg(MSG.HOME_REFERENCE_CORE_NAMES)}</dd></div><div className="hp-tone-green"><dt>{msg(MSG.HOME_REFERENCE_ROLE_COUNT)}</dt><dd>{msg(MSG.HOME_REFERENCE_ROLE_SUMMARY_SHORT)}</dd></div><div className="hp-tone-orange"><dt>{msg(MSG.HOME_REFERENCE_REPORT_COUNT)}</dt><dd>{msg(MSG.HOME_REFERENCE_SHARED)}</dd></div></dl>
                    </div>
                    <div className="hp-hero-image"><img src={website?.heroImageVersion?websiteAsset("Hero",website.heroImageVersion):"/images/home-scope-horse.jpg"} width={1200} height={896} alt={msg(MSG.HOME_REFERENCE_HORSE_ALT)} fetchPriority="high" /></div>
                </div>
            </section>

            <section className="hp-section hp-scope" id="hp-scope" aria-labelledby="hp-scope-title">
                <div className="hp-container">
                    <div className="hp-section-heading"><p className="hp-eyebrow hp-tone-orange">{msg(MSG.HOME_REFERENCE_SCOPE_EYEBROW)}</p><h2 id="hp-scope-title">{website?.featuresTitle || msg(MSG.HOME_REFERENCE_SCOPE_TITLE)}</h2><p>{website?.featuresDescription || msg(MSG.HOME_REFERENCE_SCOPE_BODY)}</p></div>
                    <div className="hp-core-grid" inert={preview ? true : undefined}>{sections.map((section,index) => <article className={`hp-core-card hp-tone-${section.tone}`} key={section.id} id={section.id}><div className="hp-core-icon" aria-hidden="true"><section.icon size={26} strokeWidth={1.8} /></div><h3>{website?.features?.[index]?.title || msg(section.title)}</h3><p>{website?.features?.[index]?.description || msg(section.description)}</p><a href={section.destination}>{msg(section.action)}</a></article>)}</div>
                </div>
            </section></>;
}
