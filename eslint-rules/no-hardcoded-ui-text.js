const displayAttributes = new Set(['label', 'title', 'description', 'placeholder', 'aria-label', 'alt', 'submitLabel', 'pendingLabel', 'help']);
export default {
    meta: { type: 'suggestion', schema: [], messages: { hardcoded: 'Move displayed text to messages/vi.js and use msg(MSG.KEY).' } },
    create
    /**
     * Khởi tạo visitor ESLint kiểm text hiển thị hardcoded; không chạy trong ứng dụng browser.
     * @param context Giá trị context truyền vào create; tham chiếu phần thân để xem cách dùng.
     */
    (context) {
        return {
            JSXText
    /**
     * Báo lint khi JSX chứa chữ hiển thị hardcoded, yêu cầu chuyển vào messages/vi.js.
     * @param node Giá trị node truyền vào JSXText; tham chiếu phần thân để xem cách dùng.
     */
    (node) { if (node.value.trim()) context.report({ node, messageId: 'hardcoded' }); },
            JSXAttribute
    /**
     * Báo lint khi thuộc tính label/title/placeholder/ARIA dùng chuỗi hiển thị trực tiếp.
     * @param node Giá trị node truyền vào JSXAttribute; tham chiếu phần thân để xem cách dùng.
     */
    (node) {
                if (displayAttributes.has(node.name.name) && node.value?.type === 'Literal' && typeof node.value.value === 'string' && node.value.value.trim()) context.report({ node, messageId: 'hardcoded' });
            },
            Property
    /**
     * Báo lint khi option/object label chứa text hardcoded thay vì message key.
     * @param node Giá trị node truyền vào Property; tham chiếu phần thân để xem cách dùng.
     */
    (node) {
                if (!node.computed && (node.key.name || node.key.value) === 'label' && node.value.type === 'Literal' && typeof node.value.value === 'string' && node.value.value.trim()) context.report({ node, messageId: 'hardcoded' });
            },
        };
    },
};
