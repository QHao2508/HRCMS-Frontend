export default function TrainingTemplateError({ error }) {
    if (!error) return null;
    const message = error.status >= 500 ? "The server could not complete the Training Template request. Please try again."
        : error.status === 403 ? "You do not have permission to access or change Training Templates."
            : error.status === 404 ? "This Training Template could not be found."
                : error.status === 409 ? "The Training Template changed or conflicts with its current state. Reload before continuing."
                    : error.message || "Unable to complete the Training Template request.";
    return <div className="alert alert-danger" role="alert">{message}</div>;
}
