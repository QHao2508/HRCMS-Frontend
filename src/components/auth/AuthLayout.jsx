export default function AuthLayout({ children, footerActions, contentSized = false }) {
    return (
        <div className={`hrcms-auth-shell${contentSized ? " hrcms-auth-shell-content" : ""}`}>
            <header className="hrcms-auth-header">
                <div className="hrcms-auth-brand" aria-label="HRCMS">
                    <span className="hrcms-auth-brand-mark" aria-hidden="true" />
                    <span>HRCMS</span>
                </div>
                <span className="hrcms-auth-portal-title">CỔNG QUẢN TRỊ CHIẾN MÃ HOÀNG GIA</span>
            </header>

            <main className="hrcms-auth-main">{children}</main>

            <footer className="hrcms-auth-footer">
                <div className="hrcms-auth-footer-top">
                    <div className="hrcms-auth-footer-brand">
                        <strong>HRCMS</strong>
                        <p>Hệ thống Quản lý và Huấn luyện Chiến mã Hoàng Gia. Bảo mật, tối ưu và chuyên nghiệp cho các câu lạc bộ đua ngựa quy mô lớn.</p>
                    </div>
                    <div className="hrcms-auth-footer-support">
                        <strong>LIÊN HỆ HỖ TRỢ</strong>
                        <p>Hotline: 1900-HRCMS</p>
                        <p>Email: support@hrcms.gov.vn</p>
                        {footerActions}
                    </div>
                </div>
                <div className="hrcms-auth-footer-divider">
                    <img src="/figma/auth/footer-divider.svg" alt="" />
                </div>
                <p className="hrcms-auth-copyright">Bản quyền © 2026 HRCMS. Tất cả các quyền được bảo lưu.</p>
            </footer>
        </div>
    );
}
