const displayAttributes = new Set(['label', 'title', 'description', 'placeholder', 'aria-label', 'alt', 'submitLabel', 'pendingLabel', 'help']);
// Chữ cái bất kỳ ngôn ngữ; ký hiệu đơn như "—", "·", "/" hay khoảng trắng không bị coi là câu chữ.
const hasWords = text => typeof text === 'string' && /\p{L}{2,}/u.test(text);

/**
 * Tìm chuỗi hiển thị nằm trong biểu thức: chuỗi thường, template string, nhánh ?: và ||/&&/??.
 * @param node Biểu thức trong {...} của JSX hoặc giá trị thuộc tính hiển thị.
 */
function textNodes(node) {
    if (!node) return [];
    if (node.type === 'Literal') return hasWords(node.value) ? [node] : [];
    if (node.type === 'TemplateLiteral') return node.quasis.some(q => hasWords(q.value.cooked)) ? [node] : [];
    if (node.type === 'ConditionalExpression') return [...textNodes(node.consequent), ...textNodes(node.alternate)];
    if (node.type === 'LogicalExpression') return [...textNodes(node.left), ...textNodes(node.right)];
    return [];
}

export default {
    meta: { type: 'suggestion', schema: [], messages: { hardcoded: 'Move displayed text to messages/vi.js and use msg(MSG.KEY).' } },
    /**
     * Khởi tạo visitor ESLint kiểm text hiển thị hardcoded; không chạy trong ứng dụng browser.
     * @param context Ngữ cảnh ESLint dùng để báo lỗi.
     */
    create(context) {
        const report = node => context.report({ node, messageId: 'hardcoded' });
        return {
            // Chữ viết thẳng giữa thẻ JSX.
            JSXText(node) { if (node.value.trim()) report(node); },
            // Chữ trong {...} giữa thẻ JSX, kể cả template string và nhánh điều kiện.
            JSXExpressionContainer(node) {
                if (node.parent?.type === 'JSXAttribute') return;
                textNodes(node.expression).forEach(report);
            },
            // Thuộc tính hiển thị (label/title/placeholder/ARIA...) dùng chuỗi trực tiếp hoặc trong {...}.
            JSXAttribute(node) {
                if (!displayAttributes.has(node.name.name) || !node.value) return;
                if (node.value.type === 'Literal') { if (typeof node.value.value === 'string' && node.value.value.trim()) report(node); return; }
                if (node.value.type === 'JSXExpressionContainer') textNodes(node.value.expression).forEach(report);
            },
            // Nhãn option/object khai báo bằng chuỗi thay vì message key.
            Property(node) {
                if (!node.computed && (node.key.name || node.key.value) === 'label') textNodes(node.value).forEach(report);
            },
        };
    },
};
