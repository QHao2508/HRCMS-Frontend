export function getLoginRedirect(location) {
    return { to: "/login", replace: true, state: { from: location } };
}

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
