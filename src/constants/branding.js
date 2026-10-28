import { apiUrl } from '../services/apiBase.js';

export const BRAND_ASSET = Object.freeze({
    Logo: '/images/hrcms-logo.png',
    RemoteLogo: apiUrl('/api/branding/logo?v=153411c4096984a2'),
});
