import { MSG, msg } from "../messages/index.js";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import { MapPinOff } from 'lucide-react';
import { Skeleton, StatusPage } from "../components/ui/States.jsx";

/**
 * Trang URL không tồn tại; đưa về login/dashboard theo phiên và không hiển thị đường dẫn nhạy cảm.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function NotFound() {
    const { loading, isAuthenticated } = useAuth();
    if (loading) return <Skeleton lines={2} />;
    return <main className="error-page-shell">
        <StatusPage icon={MapPinOff} titleId="not-found-title" title={msg(MSG.PAGE_NOT_FOUND)} description={msg(MSG.THE_PAGE_YOU_REQUESTED_COULD_NOT_BE_FOUND)}
            actions={<><Link className="btn btn-primary" to={isAuthenticated ? "/dashboard" : "/login"}>{isAuthenticated ? msg(MSG.BACK_TO_DASHBOARD) : msg(MSG.BACK_TO_SIGN_IN)}</Link>
                <Link className="btn btn-outline-secondary" to="/">{msg(MSG.UI_GO_HOME)}</Link></>} />
    </main>;
}
