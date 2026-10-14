import { useState } from 'react';
import { Field } from './WorkflowUI.jsx';
import { MSG, msg } from '../messages/index.js';
const surfaces = ['Cát', 'Cỏ', 'Đất', 'Đường đua tổng hợp'];
export default function TrainingSurfaceField({ value, onChange, name = 'surface' }) {
    const [custom, setCustom] = useState(false);
    const isOther = custom || (!!value && !surfaces.includes(value));
    return <div className="col-md-6"><div className="row g-2">
        <Field wide label={msg(MSG.MAT_SAN)} name={name + '-choice'} value={isOther ? '__other' : value} required options={[
            {value:'',label:msg(MSG.SURFACE_SELECT)}, ...surfaces.map(surface => ({value:surface,label:surface})), {value:'__other',label:msg(MSG.SURFACE_OTHER)},
        ]} onChange={e => {
            const other = e.target.value === '__other'; setCustom(other);
            onChange({target:{name,value:other ? '' : e.target.value}});
        }}/>
        {isOther && <Field wide label={msg(MSG.SURFACE_CUSTOM)} name={name} value={value} onChange={onChange} required maxLength={200}/>}
    </div></div>;
}