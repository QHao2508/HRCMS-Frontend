export default function TrainingPlanError({ error }) {
    if (!error) return null;
    const message = error.status >= 500 ? "The server could not complete the Training Plan request. Please try again."
        : error.status === 403 ? "You do not have access to this Training Plan or permission to change it."
            : error.status === 404 ? "This Training Plan, Horse, or template could not be found."
                : error.status === 409 ? "The Training Plan conflicts with its current state. Reload before continuing."
                    : error.message || "Unable to complete the Training Plan request.";
    return <div className="alert alert-danger" role="alert">{message}</div>;
}
