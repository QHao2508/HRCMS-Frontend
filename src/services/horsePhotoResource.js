import { getHorsePhoto } from "./horseService.js";

// One effect owns one object URL. Ignore late responses after route changes or
// unmount, and revoke an existing URL on cleanup (including StrictMode cleanup).
export function loadHorsePhoto(id, publish) {
    let active = true;
    let url = null;
    getHorsePhoto(id).then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        publish({ url });
    }).catch((error) => { if (active) publish({ error }); });
    return () => {
        active = false;
        if (url) { URL.revokeObjectURL(url); url = null; }
    };
}
