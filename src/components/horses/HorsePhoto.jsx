import { useEffect, useState } from "react";
import { loadHorsePhoto } from "../../services/horsePhotoResource.js";

export function HorsePhotoView({ resource, name, onRetry, onImageError }) {
    if (!resource) return <p role="status">Loading Horse photo...</p>;
    if (resource.error) {
        if (resource.error.status === 404) return <p>No Horse photo is available.</p>;
        return <div><p role="alert">{resource.error.status === 403 ? "You do not have access to this Horse photo." : "The Horse photo could not be loaded."}</p>
            <button type="button" className="btn btn-outline-secondary" onClick={onRetry}>Retry photo</button></div>;
    }
    return <img className="img-fluid rounded" src={resource.url} alt={`Photo of ${name || "Horse"}`} onError={onImageError}
        style={{ maxHeight: "320px", objectFit: "contain" }} />;
}
export default function HorsePhoto({ horseId, name }) {
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState(null);
    const [failedUrl, setFailedUrl] = useState(null);
    useEffect(() => loadHorsePhoto(horseId, (resource) => setResult({ horseId, attempt, resource })), [horseId, attempt]);
    const resource = result?.horseId === horseId && result?.attempt === attempt ? result.resource : null;
    const displayed = resource?.url && resource.url === failedUrl ? { error: new Error("Image unavailable") } : resource;
    return <HorsePhotoView resource={displayed} name={name} onRetry={() => setAttempt((value) => value + 1)} onImageError={() => setFailedUrl(resource?.url)} />;
}
