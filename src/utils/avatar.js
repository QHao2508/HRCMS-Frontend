// Ảnh đại diện bằng chữ cái đầu; màu chọn ổn định theo tên để cùng một người luôn cùng một màu.
const tones = ['brown', 'green', 'blue', 'violet', 'red', 'sand'];

/** Lấy tối đa 2 chữ cái đầu của tên (bỏ dấu tiếng Việt cho gọn), ví dụ "Bạch Vân" → "BV". */
export function initials(name = '') {
    const words = String(name).trim().split(/\s+/).filter(Boolean);
    const letters = (words.length > 1 ? [words[0], words[words.length - 1]] : words).map(word => word[0]);
    return letters.join('').toLocaleUpperCase('vi-VN') || '?';
}

export function toneFor(name = '') {
    let hash = 0;
    for (const char of String(name)) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
    return tones[hash % tones.length];
}

