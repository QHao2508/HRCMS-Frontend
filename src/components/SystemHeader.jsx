import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, ArrowUpRight } from 'lucide-react';
import BrandMark from './BrandMark.jsx';
import NotificationBell from './NotificationBell.jsx';
import LogoutButton from './auth/LogoutButton.jsx';
import { useAuth } from '../context/useAuth.js';
import { getRoleLabel } from '../constants/roles.js';
import { getUserDisplayName } from '../utils/userDisplay.js';
import { MSG, msg } from '../messages/index.js';
import '../style/system-header.css';

export default function SystemHeader() {
    const { user, isAuthenticated } = useAuth();
    const headerRef = useRef(null);
    useEffect(() => {
        const header = headerRef.current;
        const update = () => document.documentElement.style.setProperty('--hc-header-height', `${header.getBoundingClientRect().height}px`);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(header);
        return () => observer.disconnect();
    }, []);
    return <header ref={headerRef} className="system-header">
        <div className="system-header-inner">
            <div className="system-brand-group"><Link className="system-brand" to="/" aria-label={msg(MSG.HRCMS_TRANG_CHU)}><BrandMark /><span>{msg(MSG.HRCMS)}</span></Link></div>
            <span className="system-portal-title">{msg(MSG.CONG_QUAN_TRI_CHIEN_MA_HOANG_GIA)}</span>
            {isAuthenticated && <div className="system-account-controls">
                <Link className="system-dashboard-link" to="/dashboard">{msg(MSG.HOME_REFERENCE_MANAGEMENT)}<ArrowUpRight size={15} aria-hidden="true" /></Link>
                <NotificationBell /><div className="system-profile"><span className="system-avatar" aria-hidden="true"><UserRound size={19} /></span><div className="system-account"><span title={getUserDisplayName(user)}>{getUserDisplayName(user)}</span><small title={getRoleLabel(user?.role)}>{getRoleLabel(user?.role)}</small></div></div>
                <LogoutButton />
            </div>}
        </div>
    </header>;
}
