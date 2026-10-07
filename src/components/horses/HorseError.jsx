export default function HorseError({ error }) {
    if (!error) return null;
    const message = error.status === 403 ? "You do not have access to this Horse."
        : error.status === 404 ? "This Horse could not be found."
            : error.status === 409 ? "This Horse is archived or is not available in its current state."
                : error.status >= 500 ? "The server could not load Horse information. Please try again."
                    : error.message || "Unable to load Horse information. Please try again.";
    return <div className="alert alert-danger" role="alert">{message}</div>;
}
