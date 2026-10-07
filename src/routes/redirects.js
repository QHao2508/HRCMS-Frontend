/**
 * Tạo redirect login cùng pathname/search/hash đích để sau đăng nhập quay lại đúng màn hình.
 * @param location Giá trị location truyền vào getLoginRedirect; tham chiếu phần thân để xem cách dùng.
 */
export function getLoginRedirect(location) {
    return { to: "/login", replace: true, state: { from: location } };
}

/**
 * Chọn URL nội bộ an toàn từ state, chặn URL ngoài và vòng lặp login; fallback về dashboard.
 * @param state Giá trị state truyền vào getLoginDestination; tham chiếu phần thân để xem cách dùng.
 */
export function getLoginDestination(state) {
    const from = state?.from;
    const pathname = from?.pathname;
    if (typeof pathname !== "string" || !pathname.startsWith("/") || pathname.startsWith("//")
        || /[\\?#]/.test(pathname)) return "/dashboard";
    try {
        const url = new URL(pathname, "http://local");
        const decodedPath = decodeURIComponent(url.pathname);
        // React Router matches case-insensitively and permits trailing slashes.
        if (decodedPath.replace(/\/+$/, "").toLowerCase() === "/login"
            || decodedPath.startsWith("//") || decodedPath.includes("\\")) return "/dashboard";
        const search = typeof from.search === "string" && from.search.startsWith("?") ? from.search : "";
        const hash = typeof from.hash === "string" && from.hash.startsWith("#") ? from.hash : "";
        return `${url.pathname}${search}${hash}`;
    } catch {
        return "/dashboard";
    }
}
