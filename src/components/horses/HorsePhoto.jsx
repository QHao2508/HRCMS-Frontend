import { useEffect, useState } from "react";
import { loadHorsePhoto } from "../../services/horsePhotoResource.js";

export function HorsePhotoView({ resource, name, onRetry, onImageError }) {
    if (!resource) return <div className="hrcms-horse-photo-placeholder" role="status">Đang tải ảnh ngựa...</div>;
    if (resource.error) {
        if (resource.error.status === 404) return <div className="hrcms-horse-photo-placeholder" role="status">Chưa có ảnh ngựa.</div>;
        return <div className="hrcms-horse-photo-placeholder"><p role="alert">{resource.error.status === 403 ? "Bạn không có quyền xem ảnh ngựa này." : "Không thể tải ảnh ngựa."}</p>
            <button type="button" className="hrcms-registration-button hrcms-registration-button-outline" onClick={onRetry}>Thử tải ảnh</button></div>;
    }
    return <img className="hrcms-horse-photo-image" src={resource.url} alt={`Ảnh của ${name || "ngựa"}`} onError={onImageError} />;
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
