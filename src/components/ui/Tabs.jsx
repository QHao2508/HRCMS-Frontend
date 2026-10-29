import { NavLink } from 'react-router-dom';
import '../../style/ui.css';

/**
 * Thanh tab gạch chân (mẫu M5). Tab có `to` là liên kết (giữ được URL), không có `to` thì là nút gọi onChange.
 * @param options0 { tabs: [{ id, label, to, count }], active, onChange, label }.
 */
export default function Tabs({ tabs, active, onChange, label }) {
    return <nav className="hc-tabs" aria-label={label}>{tabs.map(tab => {
        const content = <>{tab.label}{tab.count != null && <span className="hc-tab-count">{tab.count}</span>}</>;
        if (tab.to) return <NavLink key={tab.id} className={({ isActive }) => `hc-tab${isActive || tab.id === active ? ' is-active' : ''}`} to={tab.to} end>{content}</NavLink>;
        const selected = tab.id === active;
        return <button key={tab.id} type="button" className={`hc-tab${selected ? ' is-active' : ''}`} aria-current={selected ? 'page' : undefined} onClick={() => onChange?.(tab.id)}>{content}</button>;
    })}</nav>;
}
