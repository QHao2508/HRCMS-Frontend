import BrandLogo from "../components/BrandLogo.jsx";
import { MSG, msg } from "../messages/index.js";
import { Link } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout.jsx";
import { useAuth } from "../context/useAuth.js";
import "../style/home.css";

/**
 * Hiển thị nhận diện thương hiệu và phần chào mừng; nút vào hệ thống đi đến login hoặc dashboard theo phiên đã khôi phục.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 */
export default function Home() {
    const { isAuthenticated, loading } = useAuth();
    return <PublicLayout className="home-layout">
        <main className="home-main">
            <section className="home-hero-card" aria-labelledby="home-title">
                <div className="home-logo-panel"><BrandLogo className="home-hero-logo" priority /></div>
                <div className="home-hero-content">
                <h1 id="home-title">{msg(MSG.HOME_WELCOME)}<br />{msg(MSG.HRCMS)}</h1>
                <h2>{msg(MSG.HE_THONG_QUAN_LY_CAU_LAC_BO_VA_HUAN_LUYEN_NGUA)}</h2>
                <p>{msg(MSG.THEO_DOI_HO_SO_NGUA_DANG_KY_THAM_GIA_CAU_LAC_BO_VA_QUAN_LY_HOAT_DONG_HUA)}</p>
                {loading ? <p className="home-session-status" role="status">{msg(MSG.LOADING_DANG_KIEM_TRA_PHIEN_DANG_NHAP)}</p>
                    : <Link className="home-login-button" to={isAuthenticated ? "/dashboard" : "/login"}>{msg(MSG.VAO_HE_THONG_QUAN_LY)}</Link>}
                </div>
            </section>
        </main>
    </PublicLayout>;
}
