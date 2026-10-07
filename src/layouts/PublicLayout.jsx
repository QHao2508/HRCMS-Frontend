import BrandMark from "../components/BrandMark.jsx";
import { MSG, msg } from "../messages/index.js";
import { Link } from "react-router-dom";

/**
 * Dựng header/logo trỏ về Home, nội dung và footer cho các trang public; className chỉ điều chỉnh theme của màn hình gọi.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { children, className = "" }. Các props/callback lấy từ caller.
 */
export default function PublicLayout({ children, className = "" }) {
    return <div className={`public-layout${className ? ` ${className}` : ""}`}>
        <header className="public-header">
            <Link className="brand" to="/" aria-label={msg(MSG.HRCMS_TRANG_CHU)}><BrandMark /><span>{msg(MSG.HRCMS)}</span></Link>
            <span className="portal-title">{msg(MSG.CONG_QUAN_TRI_CHIEN_MA_HOANG_GIA)}</span>
        </header>
        {children}
        <footer className="public-footer">
            <div className="footer-columns">
                <div><div className="footer-title">{msg(MSG.HRCMS)}</div><p>{msg(MSG.HE_THONG_QUAN_LY_VA_HUAN_LUYEN_CHIEN_MA_HOANG_GIA_BAO_MAT_TOI_UU_VA_CHUY)}</p></div>
                <div><div className="footer-support">{msg(MSG.LIEN_HE_HO_TRO)}</div><p>{msg(MSG.LIEN_HE_BAN_QUAN_LY_CAU_LAC_BO_DE_DUOC_HO_TRO_TAI_KHOAN_VA_HO_SO)}</p></div>
            </div>
            <div className="footer-copyright">{msg(MSG.HRCMS_HE_THONG_QUAN_LY_CAU_LAC_BO_VA_HUAN_LUYEN_NGUA)}</div>
        </footer>
    </div>;
}
