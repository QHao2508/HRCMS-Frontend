import { Link } from "react-router-dom";

export default function PublicLayout({ children }) {
    return <div className="public-layout">
        <header className="public-header">
            <Link className="brand" to="/login"><span className="brand-mark" aria-hidden="true" />HRCMS</Link>
            <span className="portal-title">CỔNG QUẢN TRỊ CHIẾN MÃ HOÀNG GIA</span>
        </header>
        {children}
        <footer className="public-footer">
            <div className="footer-columns">
                <div><div className="footer-title">HRCMS</div><p>Hệ thống Quản lý và Huấn luyện Chiến mã Hoàng Gia. Bảo mật, tối ưu và chuyên nghiệp cho các câu lạc bộ đua ngựa quy mô lớn.</p></div>
                <div><div className="footer-support">Liên hệ hỗ trợ</div><p>Liên hệ ban quản lý câu lạc bộ để được hỗ trợ tài khoản và hồ sơ.</p></div>
            </div>
            <div className="footer-copyright">HRCMS · Hệ thống quản lý câu lạc bộ và huấn luyện ngựa</div>
        </footer>
    </div>;
}
