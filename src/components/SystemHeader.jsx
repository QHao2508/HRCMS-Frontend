import { Link } from 'react-router-dom';
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
    return <header className="system-header">
        <div className="system-header-inner">
            <Link className="system-brand" to="/" aria-label={msg(MSG.HRCMS_TRANG_CHU)}><BrandMark /><span>{msg(MSG.HRCMS)}</span></Link>
            <span className="system-portal-title">{msg(MSG.CONG_QUAN_TRI_CHIEN_MA_HOANG_GIA)}</span>
            {isAuthenticated && <div className="system-account-controls">
                <Link className="system-dashboard-link" to="/dashboard">{msg(MSG.HOME_REFERENCE_MANAGEMENT)}</Link>
                <div className="system-account"><span>{getUserDisplayName(user)}</span><small>{getRoleLabel(user?.role)}</small></div>
                <NotificationBell /><LogoutButton />
            </div>}
        </div>
    </header>;
}
