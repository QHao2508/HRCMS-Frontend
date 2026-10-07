import { useState } from 'react';
import { BRAND_ASSET } from '../constants/branding.js';
import { MSG, msg } from '../messages/index.js';

/**
 * Đọc logo Azure qua URL API chung, khai báo kích thước để hạn chế nhảy bố cục và chuyển sang chữ HRCMS nếu ảnh không tải được.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { className = '', priority = false }. Các props/callback lấy từ caller.
 */
export default function BrandLogo({ className = '', priority = false }) {
    const [failed, setFailed] = useState(false);
    return failed ? <span className={`brand-logo-fallback ${className}`}>{msg(MSG.HRCMS)}</span>
        : <img className={className} src={BRAND_ASSET.Logo} alt={msg(MSG.BRAND_LOGO)} width={2752} height={1536}
            decoding="async" fetchPriority={priority ? 'high' : 'auto'} onError={() => setFailed(true)} />;
}
