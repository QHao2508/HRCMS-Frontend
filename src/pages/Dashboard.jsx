import { useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/useAuth.js";
import { useRegistrationResource } from "../context/useRegistrationResource.js";
import { getRoleLabel,isKnownRole } from "../constants/roles.js";
import { getUserDisplayName } from "../utils/userDisplay.js";
import { getNavigationForRole } from "../routes/navigation.js";
import { PageHeading,ResourceState } from "../components/WorkflowUI.jsx";
const cards=[['horseCount','Ngựa trong phạm vi'],['activePlans','Kế hoạch đang hoạt động'],['sessionsToday','Buổi tập hôm nay'],['overdueSessions','Buổi tập quá hạn'],['restrictedHorses','Ngựa có hạn chế'],['unreadNotifications','Thông báo chưa đọc']];
export default function Dashboard() {
    const {user}=useAuth();const known=isKnownRole(user?.role);
    const load=useCallback(()=>known ? api.get('/api/dashboard').then(r=>r.data) : Promise.resolve(null),[known]);
    const resource=useRegistrationResource(load);
    return <section aria-labelledby="dashboard-title"><PageHeading id="dashboard-title" title="Tổng quan" description={`Xin chào, ${getUserDisplayName(user)}.`}/><div className="surface-card"><dl className="summary-grid"><div><dt>Tài khoản</dt><dd>{user?.userName || "Chưa có thông tin"}</dd></div><div><dt>Vai trò</dt><dd>{getRoleLabel(user?.role)}</dd></div></dl>{!known && <p role="alert">Your account role is not recognized. Contact club management for assistance.</p>}</div>{known && <><ResourceState resource={resource}/>{resource.data && <div className="row g-3 mb-4">{cards.map(([field,label])=><div className="col-6 col-lg-4" key={field}><div className="surface-card h-100 m-0"><div className="muted-caption">{label}</div><div className="fs-2 fw-semibold mt-2">{resource.data[field]}</div></div></div>)}</div>}<section className="surface-card"><h2>Truy cập nhanh</h2><div className="inline-actions">{getNavigationForRole(user.role).filter(item=>item.to!=="/dashboard").map(item=><Link key={item.to} className="btn btn-outline-primary" to={item.to}>{({Horses:"Ngựa của tôi","Horse registrations":"Yêu cầu đăng ký","Registration review":"Duyệt hồ sơ","Training templates":"Giáo án mẫu","Training plans":"Kế hoạch huấn luyện","Training sessions":"Buổi tập"})[item.label] || item.label}</Link>)}</div></section></>}</section>;
}
