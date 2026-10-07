import BrandLogo from './BrandLogo.jsx';

/**
 * Trình bày cùng huy hiệu logo trong mọi header bằng CSS crop, giữ nguyên ảnh gốc và màu theme.
 */
export default function BrandMark() {
    return <span className="brand-crest" aria-hidden="true"><BrandLogo className="brand-header-logo" /></span>;
}
