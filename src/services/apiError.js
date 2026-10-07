const statusMessages = {
    400: "Please check the submitted information.",
    401: "Your session is no longer valid. Please sign in again.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "The record has changed or this action is not allowed in its current state.",
    413: "The request is too large.",
    429: "Too many requests. Please wait before trying again.",
};

export async function normalizeApiError(error) {
    let data = error.response?.data;
    // Downloads can receive a JSON error even when responseType is blob.
    if (typeof Blob !== "undefined" && data instanceof Blob) data = await data.text();
    if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { data = null; }
    }
    const details = data && typeof data === "object" ? data : {};
    const message = [details.detail, details.message, details.error?.message, details.error, details.title]
        .find((value) => typeof value === "string" && value.trim());
    error.status = error.response?.status ?? null;
    error.traceId = details.traceId ?? null;
    error.referenceId = details.referenceId ?? null;
    error.validationErrors = details.errors ?? null;
    error.message = details.error === "invalid_credentials"
        ? "Invalid email or password."
        : message || statusMessages[error.status]
            || (error.status ? "The server could not complete the request. Please try again."
                : error.code === "ECONNABORTED" ? "The request timed out. Please try again."
                    : "Unable to reach the server. Check your connection and try again.");
    return error;
}
