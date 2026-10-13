import { useState } from 'react';
import { Field } from './WorkflowUI.jsx';
import { MSG, msg } from '../messages/index.js';
const phases = [['Base', MSG.PHASE_BASE], ['Build', MSG.PHASE_BUILD], ['Peak', MSG.PHASE_PEAK], ['Technique', MSG.PHASE_TECHNIQUE], ['Recovery', MSG.PHASE_RECOVERY]];
export default function TrainingPhaseField({ value, onChange }) {
    const [custom, setCustom] = useState(false);
    const isOther = custom || (!!value && !phases.some(([phase]) => phase === value));
    return <div className="col-md-6"><div className="row g-2">
        <Field wide label={msg(MSG.GIAI_DOAN)} name="phase-choice" value={isOther ? '__other' : value} required options={[
            {value:'',label:msg(MSG.PHASE_SELECT)}, ...phases.map(([phase,label]) => ({value:phase,label:msg(label)})), {value:'__other',label:msg(MSG.PHASE_OTHER)},
        ]} onChange={e => {
            const other = e.target.value === '__other'; setCustom(other);
            onChange({target:{name:'phase',value:other ? '' : e.target.value}});
        }}/>
        {isOther && <Field wide label={msg(MSG.PHASE_CUSTOM)} name="phase" value={value} onChange={onChange} required maxLength={100}/>}
    </div></div>;
}