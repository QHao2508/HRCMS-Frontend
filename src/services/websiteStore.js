import {useEffect,useSyncExternalStore} from 'react';
import api from './api.js';
let value=null,inFlight=null,lastRead=0;const listeners=new Set();
export function publishWebsite(data){value=data;lastRead=Date.now();for(const listener of listeners)listener();return data;}
export function refreshWebsite(force=false){if(!force&&value&&Date.now()-lastRead<60000)return Promise.resolve(value);if(inFlight)return inFlight;inFlight=api.get('/api/website').then(r=>publishWebsite(r.data)).finally(()=>{inFlight=null;});return inFlight;}
const subscribe=listener=>{listeners.add(listener);return()=>listeners.delete(listener);};
export function useWebsite(){const data=useSyncExternalStore(subscribe,()=>value,()=>null);useEffect(()=>{refreshWebsite().catch(()=>{});const refresh=()=>{if(document.visibilityState==='visible')refreshWebsite(true).catch(()=>{});};document.addEventListener('visibilitychange',refresh);return()=>document.removeEventListener('visibilitychange',refresh);},[]);return data;}
export const websiteAsset=(kind,version)=>'/api/website/assets/'+kind+'?v='+encodeURIComponent(version);
