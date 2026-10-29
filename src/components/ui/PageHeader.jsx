import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import '../../style/ui.css';

/**
 * Phần đầu trang (mẫu M3–M7): nút quay lại tùy chọn, nhãn nhỏ, tiêu đề Lora 30, mô tả và vùng nút bên phải.
 * @param options0 { title, description, eyebrow, back: { to, label }, actions, id }.
 */
export default function PageHeader({ title, description, eyebrow, back, actions, id }) {
    return <div className="hc-page-header">
        {back && <Link className="hc-back-link" to={back.to}><ArrowLeft size={16} aria-hidden="true" />{back.label}</Link>}
        <div className="hc-page-header-row">
            <div className="hc-page-header-text">
                {eyebrow && <p className="hc-eyebrow">{eyebrow}</p>}
                <h1 id={id}>{title}</h1>
                {description && <p className="hc-page-description">{description}</p>}
            </div>
            {actions && <div className="hc-page-actions">{actions}</div>}
        </div>
    </div>;
}
