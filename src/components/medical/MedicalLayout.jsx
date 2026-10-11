import { NavLink } from "react-router-dom";




import "../../style/medical.css";
const links = [["/medical", "Tổng quan thú y"], ["/medical/examination", "Hồ sơ thăm khám"], ["/medical/injury", "Chấn thương"], ["/medical/treatment", "Phác đồ điều trị"], ["/medical/restrictions", "Hạn chế vận động"], ["/medical/follow-up", "Tái khám và xác nhận hồi phục"]];
export default function MedicalLayout({ children }) {
    return <section className="medical-app"><div className="medical-body"><aside className="medical-sidebar"><nav className="medical-nav">{links.map(([to, text]) => <NavLink key={to} to={to} end={to === "/medical"} className={({ isActive }) => `medical-nav-link ${isActive ? "active" : ""}`}>{text}</NavLink>)}</nav></aside><div className="medical-content">{children}</div></div></section>;
}
