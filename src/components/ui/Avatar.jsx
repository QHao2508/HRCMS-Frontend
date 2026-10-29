import { initials, toneFor } from '../../utils/avatar.js';

/**
 * Hình vuông bo góc (mặc định) hoặc tròn chứa chữ cái đầu. Chỉ để trang trí: tên đầy đủ luôn được viết cạnh nó.
 * @param options0 { name, size = 'md' | 'sm' | 'lg', round = false }.
 */
export default function Avatar({ name, size = 'md', round = false }) {
    return <span className={`hc-avatar is-${size} tone-${toneFor(name)}${round ? ' is-round' : ''}`} aria-hidden="true">{initials(name)}</span>;
}
