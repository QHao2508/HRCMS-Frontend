export default function TrainingSessionError({ error }) {
    if (!error) return null;
    const message = error.status >= 500 ? "The server could not complete the Training Session request. Reload before continuing."
        : error.status === 403 ? "You do not have access to this Training Session or permission to change it."
            : error.status === 404 ? "This Training Session, plan, Horse, or WorkRider could not be found."
                : error.status === 409 ? "The session conflicts with its current plan, medical, rider, or timestamp state. Its scheduled time was not changed; reload before continuing."
                    : error.message || "Unable to complete the Training Session request.";
    return <div className="alert alert-danger" role="alert">{message}</div>;
}
