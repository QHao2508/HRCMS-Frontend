export default function RegistrationError({ error }) {
    if (!error) return null;
    // Only show normalized business errors, never server diagnostics or trace IDs.
    const message = error.status >= 500 ? "The server could not complete the request. Please try again."
        : error.status === 403 ? "You do not have permission to access this registration or perform this action."
            : error.status === 404 ? "This registration or attachment could not be found."
                : error.message || "Unable to complete the request. Please try again.";
    return <div className="alert alert-danger" role="alert">{message}</div>;
}
