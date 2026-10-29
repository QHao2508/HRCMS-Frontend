import { MSG, msg } from "../messages/index.js";
import { Link } from "react-router-dom";
import { ShieldAlert } from 'lucide-react';
import { StatusPage } from "../components/ui/States.jsx";

/**
 * Giải thích tài khoản không có quyền và đưa về dashboard an toàn.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function PermissionDenied() {
    return <StatusPage icon={ShieldAlert} titleId="permission-denied-title" title={msg(MSG.PERMISSION_DENIED)} description={msg(MSG.YOUR_SIGNED_IN_ACCOUNT_DOES_NOT_HAVE_PERMISSION_TO_VIEW_THIS_PAGE)}
        actions={<Link className="btn btn-primary" to="/dashboard">{msg(MSG.BACK_TO_DASHBOARD)}</Link>} />;
}
