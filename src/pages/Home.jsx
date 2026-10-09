import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, FileText, Activity, HeartPulse } from 'lucide-react';
import { useAuth } from '../context/useAuth.js';
import { MSG, msg } from '../messages/index.js';
import BrandLogo from '../components/BrandLogo.jsx';
import BrandMark from '../components/BrandMark.jsx';
import {useWebsite,websiteAsset} from '../services/websiteStore.js';
import '../style/home.css';

const sections = [
    { id: 'hp-intake', icon: FileText, title: MSG.HOME_REFERENCE_F01_TITLE, description: MSG.HOME_REFERENCE_F01_DESCRIPTION, action: MSG.HOME_REFERENCE_VIEW_F01, tone: 'brown', destination: '#hp-workflow-intake' },
    { id: 'hp-training', icon: Activity, title: MSG.HOME_REFERENCE_F02_TITLE, description: MSG.HOME_REFERENCE_F02_DESCRIPTION, action: MSG.HOME_REFERENCE_VIEW_F02, tone: 'green', destination: '#hp-workflow-training' },
    { id: 'hp-health', icon: HeartPulse, title: MSG.HOME_REFERENCE_F03_TITLE, description: MSG.HOME_REFERENCE_F03_DESCRIPTION, action: MSG.HOME_REFERENCE_VIEW_F03, tone: 'orange', destination: '#hp-workflow-health' },
];
const boundary = [
    ['hp-workflow-intake', MSG.HOME_REFERENCE_STEP_01, MSG.HOME_REFERENCE_INTAKE_TITLE, MSG.HOME_REFERENCE_INTAKE_BODY],
    ['hp-workflow-health', MSG.HOME_REFERENCE_STEP_02, MSG.HOME_REFERENCE_HEALTH_TITLE, MSG.HOME_REFERENCE_HEALTH_BODY],
    ['hp-workflow-training', MSG.HOME_REFERENCE_STEP_03, MSG.HOME_REFERENCE_TRAINING_TITLE, MSG.HOME_REFERENCE_TRAINING_BODY],
    ['hp-workflow-report', MSG.HOME_REFERENCE_STEP_04, MSG.HOME_REFERENCE_REPORT_TITLE, MSG.HOME_REFERENCE_REPORT_BODY],
];
const roles = [
    { name: MSG.HOME_REFERENCE_OWNER, title: MSG.HOME_REFERENCE_OWNER_TITLE, body: MSG.HOME_REFERENCE_OWNER_BODY, tone: 'brown' },
    { name: MSG.HOME_REFERENCE_MANAGER, title: MSG.HOME_REFERENCE_MANAGER_TITLE, body: MSG.HOME_REFERENCE_MANAGER_BODY, tone: 'green' },
    { name: MSG.HOME_REFERENCE_HEADTRAINER, title: MSG.HOME_REFERENCE_HEADTRAINER_TITLE, body: MSG.HOME_REFERENCE_HEADTRAINER_BODY, tone: 'orange' },
    { name: MSG.HOME_REFERENCE_TRAINER, title: MSG.HOME_REFERENCE_TRAINER_TITLE, body: MSG.HOME_REFERENCE_TRAINER_BODY, tone: 'dark' },
    { name: MSG.HOME_REFERENCE_RIDER, title: MSG.HOME_REFERENCE_RIDER_TITLE, body: MSG.HOME_REFERENCE_RIDER_BODY, tone: 'green' },
    { name: MSG.HOME_REFERENCE_VET, title: MSG.HOME_REFERENCE_VET_TITLE, body: MSG.HOME_REFERENCE_VET_BODY, tone: 'orange' },
    { name: MSG.HOME_REFERENCE_GROOM, title: MSG.HOME_REFERENCE_GROOM_TITLE, body: MSG.HOME_REFERENCE_GROOM_BODY, tone: 'dark' },
];

/** Public product overview with existing authenticated management routes. */
export default function Home() {
    const { isAuthenticated } = useAuth();
    const website=useWebsite();
    const [menuOpen, setMenuOpen] = useState(false);
    const management = isAuthenticated ? '/dashboard' : '/login';
    const closeMenu = () => setMenuOpen(false);

    return <div className="hp" id="hp-top">
        <a className="visually-hidden-focusable hp-skip" href="#hp-main">{msg(MSG.HOME_REFERENCE_SKIP)}</a>
        <header className="hp-header">
            <div className="hp-container hp-header-inner">
                <Link className="hp-brand" to="/" aria-label={msg(MSG.HRCMS_TRANG_CHU)}><BrandMark /><span>{msg(MSG.HRCMS)}</span></Link>
                <button className="hp-menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="hp-navigation" aria-label={msg(menuOpen ? MSG.HOME_REFERENCE_CLOSE_MENU : MSG.HOME_REFERENCE_OPEN_MENU)} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
                <nav className={`hp-navigation${menuOpen ? ' is-open' : ''}`} id="hp-navigation" aria-label={msg(MSG.HOME_REFERENCE_NAV)}>
                    <a className="is-active" href="#hp-top" aria-current="page" onClick={closeMenu}>{msg(MSG.HOME_REFERENCE_HOME)}</a>
                    <a href="#hp-intake" onClick={closeMenu}>{msg(MSG.HOME_REFERENCE_HORSE_RECORDS)}</a>
                    <a href="#hp-training" onClick={closeMenu}>{msg(MSG.HOME_REFERENCE_TRAINING_NAV)}</a>
                    <a href="#hp-health" onClick={closeMenu}>{msg(MSG.HOME_REFERENCE_MEDICAL_NAV)}</a>
                    <a href="#hp-roles" onClick={closeMenu}>{msg(MSG.HOME_REFERENCE_PERMISSIONS)}</a>
                    <div className="hp-mobile-actions"><a href="#hp-footer" onClick={closeMenu}>{msg(MSG.HOME_REFERENCE_SUPPORT)}</a><Link className="hp-button hp-button-brown" to={management} onClick={closeMenu}>{msg(isAuthenticated ? MSG.HOME_REFERENCE_MANAGEMENT : MSG.HOME_REFERENCE_VIEW_SCOPE)}</Link></div>
                </nav>
                <div className="hp-header-actions"><a className="hp-support-link" href="#hp-footer">{msg(MSG.HOME_REFERENCE_SUPPORT)}</a><Link className="hp-button hp-button-brown" to={management}>{msg(isAuthenticated ? MSG.HOME_REFERENCE_MANAGEMENT : MSG.HOME_REFERENCE_VIEW_SCOPE)}</Link></div>
            </div>
        </header>

        <main id="hp-main">
            <section className="hp-hero" aria-labelledby="hp-hero-title" style={website?.backgroundImageVersion?{backgroundImage:`linear-gradient(#eaddcae8,#eaddcae8),url("${websiteAsset("Background",website.backgroundImageVersion)}")`,backgroundSize:"cover",backgroundPosition:"center"}:undefined}>
                <div className="hp-container hp-hero-grid">
                    <div className="hp-hero-content">
                        <div className="hp-project-badge"><span aria-hidden="true" />{msg(MSG.HOME_REFERENCE_PROJECT_BADGE)}</div>
                        <h1 id="hp-hero-title">{website?.heroTitle || <>{msg(MSG.HOME_REFERENCE_HERO_LINE_ONE)}<br />{msg(MSG.HOME_REFERENCE_HERO_LINE_TWO)}{' '}<span>{msg(MSG.HOME_REFERENCE_SCOPE_NAME)}</span></>}</h1>
                        <p className="hp-hero-description">{website?.heroDescription || msg(MSG.HOME_REFERENCE_HERO_BODY)}</p>
                        <div className="hp-hero-actions"><Link className="hp-button hp-button-green" to={management}>{msg(isAuthenticated ? MSG.HOME_REFERENCE_MANAGEMENT : MSG.HOME_REFERENCE_VIEW_SCOPE)}</Link><a className="hp-button hp-button-outline" href="#hp-scope">{msg(MSG.HOME_REFERENCE_LEARN_SCOPE)}</a></div>
                        <dl className="hp-scope-stats"><div className="hp-tone-brown"><dt>{msg(MSG.HOME_REFERENCE_CORE_COUNT)}</dt><dd>{msg(MSG.HOME_REFERENCE_CORE_NAMES)}</dd></div><div className="hp-tone-green"><dt>{msg(MSG.HOME_REFERENCE_ROLE_COUNT)}</dt><dd>{msg(MSG.HOME_REFERENCE_ROLE_SUMMARY_SHORT)}</dd></div><div className="hp-tone-orange"><dt>{msg(MSG.HOME_REFERENCE_REPORT_COUNT)}</dt><dd>{msg(MSG.HOME_REFERENCE_SHARED)}</dd></div></dl>
                    </div>
                    <div className="hp-hero-image"><img src={website?.heroImageVersion?websiteAsset("Hero",website.heroImageVersion):"/images/home-scope-horse.jpg"} width={1200} height={896} alt={msg(MSG.HOME_REFERENCE_HORSE_ALT)} fetchPriority="high" /></div>
                </div>
            </section>

            <section className="hp-section hp-scope" id="hp-scope" aria-labelledby="hp-scope-title">
                <div className="hp-container">
                    <div className="hp-section-heading"><p className="hp-eyebrow hp-tone-orange">{msg(MSG.HOME_REFERENCE_SCOPE_EYEBROW)}</p><h2 id="hp-scope-title">{website?.featuresTitle || msg(MSG.HOME_REFERENCE_SCOPE_TITLE)}</h2><p>{website?.featuresDescription || msg(MSG.HOME_REFERENCE_SCOPE_BODY)}</p></div>
                    <div className="hp-core-grid">{sections.map((section,index) => <article className={`hp-core-card hp-tone-${section.tone}`} key={section.id} id={section.id}><div className="hp-core-icon" aria-hidden="true"><section.icon size={26} strokeWidth={1.8} /></div><h3>{website?.features?.[index]?.title || msg(section.title)}</h3><p>{website?.features?.[index]?.description || msg(section.description)}</p><a href={section.destination}>{msg(section.action)}</a></article>)}</div>
                </div>
            </section>

            <section className="hp-section hp-boundary" id="hp-boundary" aria-labelledby="hp-boundary-title">
                <div className="hp-container"><div className="hp-section-heading"><p className="hp-eyebrow hp-tone-green">{msg(MSG.HOME_REFERENCE_BOUNDARY_EYEBROW)}</p><h2 id="hp-boundary-title">{msg(MSG.HOME_REFERENCE_BOUNDARY_TITLE)}</h2></div><ol className="hp-boundary-grid">{boundary.map(([id,number,title,body]) => <li className="hp-boundary-card" key={number} id={id}><span className="hp-step-number" aria-hidden="true">{msg(number)}</span><h3>{msg(title)}</h3><p>{msg(body)}</p></li>)}</ol></div>
            </section>

            <section className="hp-section hp-roles" id="hp-roles" aria-labelledby="hp-roles-title">
                <div className="hp-container"><div className="hp-role-heading"><div><p className="hp-eyebrow hp-tone-brown">{msg(MSG.HOME_REFERENCE_ROLE_EYEBROW)}</p><h2 id="hp-roles-title">{msg(MSG.HOME_REFERENCE_ROLE_TITLE)}</h2></div><p>{msg(MSG.HOME_REFERENCE_ROLE_SUMMARY)}</p></div><div className="hp-role-grid">{roles.map((role,index) => <article className={`hp-role-card${index >= 4 ? ' hp-role-small' : ''}`} key={role.name}><p className={`hp-role-name hp-tone-${role.tone}`}>{msg(role.name)}</p><h3>{msg(role.title)}</h3><p>{msg(role.body)}</p></article>)}</div></div>
            </section>

            <section className="hp-cta" aria-labelledby="hp-cta-title"><div className="hp-container"><h2 id="hp-cta-title">{msg(MSG.HOME_REFERENCE_CTA_TITLE)}</h2><p>{msg(MSG.HOME_REFERENCE_CTA_BODY)}</p><Link className="hp-button hp-button-dark" to={management}>{msg(isAuthenticated ? MSG.HOME_REFERENCE_MANAGEMENT : MSG.HOME_REFERENCE_VIEW_SCOPE)}</Link></div></section>
        </main>

        <footer className="hp-footer" id="hp-footer">
            <div className="hp-container"><div className="hp-footer-columns"><div className="hp-footer-brand"><Link className="hp-brand" to="/"><BrandLogo className="hp-brand-logo" priority /></Link><p>{msg(MSG.HOME_REFERENCE_FOOTER_BODY)}</p></div><div><h2>{msg(MSG.HOME_REFERENCE_FOOTER_MODULES)}</h2><ul><li><a href="#hp-intake">{msg(MSG.HOME_REFERENCE_FOOTER_F01)}</a></li><li><a href="#hp-training">{msg(MSG.HOME_REFERENCE_FOOTER_F02)}</a></li><li><a href="#hp-health">{msg(MSG.HOME_REFERENCE_FOOTER_F03)}</a></li></ul></div><div><h2>{msg(MSG.HOME_REFERENCE_FOOTER_PROJECT)}</h2><ul><li><Link to={management}>{msg(isAuthenticated ? MSG.HOME_REFERENCE_MANAGEMENT : MSG.HOME_REFERENCE_VIEW_SCOPE)}</Link></li><li><a href="#hp-roles">{msg(MSG.HOME_REFERENCE_TEAM)}</a></li><li><a href="#hp-boundary">{msg(MSG.HOME_REFERENCE_SCOPE_DOCUMENT)}</a></li></ul></div></div><div className="hp-footer-bottom"><p>{msg(MSG.HOME_REFERENCE_COPYRIGHT,{year:new Date().getFullYear()})}</p><div className="hp-legal-links"><details className="hp-footer-disclosure"><summary>{msg(MSG.HOME_REFERENCE_TERMS)}</summary><p>{msg(MSG.HOME_REFERENCE_POLICY_GUIDE)}</p></details><details className="hp-footer-disclosure"><summary>{msg(MSG.HOME_REFERENCE_PRIVACY)}</summary><p>{msg(MSG.HOME_REFERENCE_POLICY_GUIDE)}</p></details></div></div></div>
        </footer>
    </div>;
}
