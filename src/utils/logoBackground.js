/** Remove only neutral light pixels connected to the image edge; preserve enclosed details. */
export function prepareLogo(image) {
    const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = pixels;
    const seen = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0, tail = 0;
    function enqueue(index) {
        if (seen[index]) return;
        seen[index] = 1;
        const offset = index * 4;
        const low = Math.min(data[offset], data[offset + 1], data[offset + 2]);
        const high = Math.max(data[offset], data[offset + 1], data[offset + 2]);
        if (data[offset + 3] < 16 || (low >= 220 && high - low <= 30)) queue[tail++] = index;
    }
    for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
    for (let y = 0; y < height; y++) { enqueue(y * width); enqueue(y * width + width - 1); }
    while (head < tail) {
        const index = queue[head++];
        data[index * 4 + 3] = 0;
        const x = index % width, y = Math.floor(index / width);
        if (x > 0) enqueue(index - 1);
        if (x + 1 < width) enqueue(index + 1);
        if (y > 0) enqueue(index - width);
        if (y + 1 < height) enqueue(index + width);
    }
    let left = width, top = height, right = -1, bottom = -1;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 16) {
            left = Math.min(left, x); right = Math.max(right, x);
            top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
    }
    // Keep the original if the image has no visible foreground.
    if (right < left) return null;
    context.putImageData(pixels, 0, 0);
    const result = document.createElement('canvas');
    const padding = Math.max(2, Math.round(Math.max(right - left, bottom - top) * .025));
    result.width = right - left + 1 + padding * 2;
    result.height = bottom - top + 1 + padding * 2;
    result.getContext('2d').drawImage(canvas, left, top, right - left + 1, bottom - top + 1, padding, padding, right - left + 1, bottom - top + 1);
    return result.toDataURL('image/png');
}
