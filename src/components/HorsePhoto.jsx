import { useEffect, useState } from 'react';
import { ImageOff, ImagePlus, RefreshCw } from 'lucide-react';
import { fetchHorsePhoto } from '../services/clubService.js';
import { MSG, msg } from '../messages/index.js';

/** Keep private photos behind the authenticated API; never substitute another horse's picture. */
export default function HorsePhoto({ id, name, metadata }) {
    const [attempt,setAttempt]=useState(0);
    const [result,setResult]=useState(null);
    const version=metadata?.attachmentId || '';
    const absent=metadata===null;
    useEffect(()=>{
        if(absent)return;
        let active=true,url;
        fetchHorsePhoto(id).then(blob=>{
            if(!active)return;
            url=URL.createObjectURL(blob);
            setResult({id,attempt,version,url});
        }).catch(error=>{if(active)setResult({id,attempt,version,error});});
        return ()=>{active=false;if(url)URL.revokeObjectURL(url);};
    },[id,attempt,version,absent]);
    const current=result?.id===id && result?.attempt===attempt && result?.version===version?result:null;
    const loading=!absent && !current;
    const status=current?.error?.status;
    const unavailable=!!current?.error;
    const Icon=absent?ImagePlus:ImageOff;
    return <figure className={`horse-portrait${current?.url?' has-photo':''}`}>
        {current?.url?<img className="horse-photo" src={current.url} alt={msg(MSG.UX_HORSE_PHOTO_ALT,{name:name || msg(MSG.HORSES_LABEL)})} onError={()=>setResult({id,attempt,version,error:{status:0}})}/>:<div className="horse-photo-placeholder">
            {loading?<span className="resource-spinner" aria-hidden="true"/>:<Icon size={38} aria-hidden="true"/>}
            <strong role={loading?'status':undefined}>{msg(loading?MSG.PHOTO_LOADING:absent?MSG.UX_HORSE_NO_PHOTO:MSG.UX_HORSE_PHOTO_UNAVAILABLE)}</strong>
            {!loading && <p>{msg(absent?MSG.UX_HORSE_PHOTO_ADD_HELP:status===403?MSG.UX_HORSE_PHOTO_FORBIDDEN:status>=500?MSG.UX_HORSE_PHOTO_STORAGE:MSG.UX_HORSE_PHOTO_RETRY_HELP)}</p>}
            {unavailable && status!==403 && <button type="button" className="btn btn-outline-primary" onClick={()=>setAttempt(value=>value+1)}><RefreshCw size={15} aria-hidden="true"/>{msg(MSG.THU_LAI)}</button>}
        </div>}
        <figcaption>{msg(MSG.ANH_NHAN_DIEN_NGUA)}</figcaption>
    </figure>;
}
