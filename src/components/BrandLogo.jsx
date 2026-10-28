import { useState } from 'react';
import {useWebsite,websiteAsset} from '../services/websiteStore.js';
import { MSG, msg } from '../messages/index.js';
import { prepareLogo } from '../utils/logoBackground.js';

const preparedLogos = new Map();

/**
 * Chỉ hiển thị logo CMS mới nhất; chờ cấu hình và xử lý nền trước khi hiện ảnh.
 * Nhãn/thông báo lấy từ catalog; enum và dữ liệu người dùng giữ nguyên giá trị.
 * @param options0 Đối tượng destructuring: { className = '', priority = false }. Các props/callback lấy từ caller.
 */
export default function BrandLogo({ className = '', priority = false }) {
    const website=useWebsite();
    const custom=website?.logoVersion?websiteAsset('Logo',website.logoVersion):null;
    const [failedSources,setFailedSources]=useState([]);
    const [prepared,setPrepared]=useState(null);
    const src=custom && !failedSources.includes(custom)?custom:null;
    const readyUrl=prepared?.source===src?prepared.url:preparedLogos.get(src);
    return !src ? <span className={`brand-logo-placeholder ${className}`} aria-busy={!website} aria-label={msg(MSG.BRAND_LOGO)} />
        : <img className={`${className} is-custom-logo${readyUrl?'':' is-logo-loading'}`} src={readyUrl || src} crossOrigin="anonymous" onLoad={event=>{
                if(readyUrl)return;
                try {
                    const url=prepareLogo(event.currentTarget) || src;
                    if(url){
                        if(preparedLogos.size>=16)preparedLogos.delete(preparedLogos.keys().next().value);
                        preparedLogos.set(src,url);setPrepared({source:src,url});
                    }
                } catch { setPrepared({source:src,url:src}); }
            }} alt={msg(MSG.BRAND_LOGO)} width={2752} height={1536}
            decoding="async" fetchPriority={priority ? 'high' : 'auto'} onError={() => setFailedSources(current=>[...current,src])} />;
}
