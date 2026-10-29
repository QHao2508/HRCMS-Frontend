/**
 * Gắn nhãn cột (data-label) cho từng ô của mọi bảng trong vùng nội dung, để trên màn hình hẹp
 * CSS có thể xếp mỗi dòng thành một thẻ "Nhãn: giá trị" thay vì cắt bớt cột.
 * Ô gộp nhiều cột (thông báo rỗng, dòng chi tiết) được đánh dấu riêng để chiếm cả thẻ.
 */
export function labelTableCells(root) {
    if (!root?.querySelectorAll) return;
    for (const table of root.querySelectorAll('table')) {
        const headers = [...(table.tHead?.rows[0]?.cells || [])].map(cell => cell.textContent.trim());
        if (!headers.length) continue;
        table.classList.add('has-cell-labels');
        for (const body of table.tBodies) {
            for (const row of body.rows) {
                let column = 0;
                for (const cell of row.cells) {
                    if (cell.childElementCount > 1) cell.setAttribute('data-multi', 'true'); else cell.removeAttribute('data-multi');
                    if (cell.colSpan > 1) cell.setAttribute('data-span', 'true');
                    else if (headers[column] && !cell.hasAttribute('data-label')) cell.setAttribute('data-label', headers[column]);
                    column += cell.colSpan || 1;
                }
            }
        }
    }
}

/** Theo dõi nội dung động (tải dữ liệu, đổi trang) và gắn nhãn lại khi bảng thay đổi. */
export function observeTableLabels(root) {
    if (!root || typeof MutationObserver === 'undefined') return () => {};
    let frame = 0;
    const schedule = () => { if (frame) return; frame = requestAnimationFrame(() => { frame = 0; labelTableCells(root); }); };
    labelTableCells(root);
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); if (frame) cancelAnimationFrame(frame); };
}
