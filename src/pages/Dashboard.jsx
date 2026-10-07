import { MSG, msg } from "../messages/index.js";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/useAuth.js";
import { useRegistrationResource } from "../context/useRegistrationResource.js";
import { getRoleLabel,isKnownRole } from "../constants/roles.js";
import { getUserDisplayName } from "../utils/userDisplay.js";
import { getNavigationForRole } from "../routes/navigation.js";
import { PageHeading,ResourceState } from "../components/WorkflowUI.jsx";
const cards=[['horseCount',msg(MSG.NGUA_TRONG_PHAM_VI)],['activePlans',msg(MSG.KE_HOACH_DANG_HOAT_DONG)],['sessionsToday',msg(MSG.BUOI_TAP_HOM_NAY)],['overdueSessions',msg(MSG.BUOI_TAP_QUA_HAN)],['restrictedHorses',msg(MSG.NGUA_CO_HAN_CHE)],['unreadNotifications',msg(MSG.THONG_BAO_CHUA_DOC)]];
/**
 * Hiển thị aggregate từ một endpoint và menu theo role; role lạ chỉ nhận cảnh báo/phạm vi an toàn.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function Dashboard() {
    const {user}=useAuth();const known=isKnownRole(user?.role);
    /**
     * Đọc dữ liệu cần cho component qua service/API; hook resource quản lý loading, response muộn và lỗi.
     */
    const load=useCallback(()=>known ? api.get('/api/dashboard').then(r=>r.data) : Promise.resolve(null),[known]);
    const resource=useRegistrationResource(load);
    return <section aria-labelledby="dashboard-title"><PageHeading id="dashboard-title" title={msg(MSG.TONG_QUAN)} description={msg(MSG.XIN_CHAO, { p0: getUserDisplayName(user) })}/><div className="surface-card"><dl className="summary-grid"><div><dt>{msg(MSG.TAI_KHOAN)}</dt><dd>{user?.userName || msg(MSG.CHUA_CO_THONG_TIN)}</dd></div><div><dt>{msg(MSG.VAI_TRO)}</dt><dd>{getRoleLabel(user?.role)}</dd></div></dl>{!known && <p role="alert">{msg(MSG.YOUR_ACCOUNT_ROLE_IS_NOT_RECOGNIZED_CONTACT_CLUB_MANAGEMENT_FOR_ASSISTAN)}</p>}</div>{known && <><ResourceState resource={resource}/>{resource.data && <div className="row g-3 mb-4">{cards.map(([field,label])=><div className="col-6 col-lg-4" key={field}><div className="surface-card h-100 m-0"><div className="muted-caption">{label}</div><div className="fs-2 fw-semibold mt-2">{resource.data[field]}</div></div></div>)}</div>}<section className="surface-card"><h2>{msg(MSG.TRUY_CAP_NHANH)}</h2><div className="inline-actions">{getNavigationForRole(user.role).filter(item=>item.to!=="/dashboard").map(item=><Link key={item.to} className="btn btn-outline-primary" to={item.to}>{item.label}</Link>)}</div></section></>}</section>;
}
