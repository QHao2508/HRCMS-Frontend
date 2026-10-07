import { VI } from './vi.js';
export { MSG } from './messageKeys.js';
export const UI_LOCALE = 'vi-VN';

/** Format trusted catalog text; React escapes interpolated values when rendering. */
export function msg(key, parameters = {}) {
    if (!Object.hasOwn(VI, key)) throw new Error('Unknown message key: ' + key);
    return VI[key].replace(/\{(\w+)\}/g, (_, name) => {
        if (!Object.hasOwn(parameters, name)) throw new Error('Missing message parameter: ' + name);
        return String(parameters[name]);
    });
}
