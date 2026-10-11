import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import { getUserDisplayName } from "../../utils/userDisplay.js";
import { getRoleLabel } from "../../constants/roles.js";
import { MSG, msg } from "../../messages/index.js";
import "../../style/medical.css";
const links = [["/medical", "Tổng quan thú y"], ["/medical/examination", "Hồ sơ thăm khám"], ["/medical/injury", "Chấn thương"], ["/medical/treatment", "Phác đồ điều trị"], ["/medical/restrictions", "Hạn chế vận động"], ["/medical/follow-up", "Tái khám và xác nhận hồi phục"]];
export default function MedicalLayout({ children }) {
    const { user } = useAuth();
    return <section className="medical-app"><header className="medical-header"><strong>{msg(MSG.MEDICAL_MODULE)}</strong><div>{getUserDisplayName(user)}{" · "}{getRoleLabel(user.role)}</div></header><div className="medical-body"><aside className="medical-sidebar"><nav className="medical-nav">{links.map(([to, text]) => <NavLink key={to} to={to} end={to === "/medical"} className={({ isActive }) => `medical-nav-link ${isActive ? "active" : ""}`}>{text}</NavLink>)}</nav></aside><div className="medical-content">{children}</div></div></section>;
}
