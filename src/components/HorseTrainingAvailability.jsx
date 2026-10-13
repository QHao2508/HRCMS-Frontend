import { useState } from 'react';
import { MSG, msg } from '../messages/index.js';
import { TRAINING_TYPE, INTENSITY } from '../constants/training.js';
import { Field } from './WorkflowUI.jsx';
import TrainingAvailability from './TrainingAvailability.jsx';
export default function HorseTrainingAvailability({ horseId }) {
    const [form, setForm] = useState({ scheduledAt: '', durationMinutes: 60, trainingType: TRAINING_TYPE.Trot, intensity: INTENSITY.Light, distanceMetres: 1000, riderId: '' });
    const change = e => setForm({ ...form, [e.target.name]: e.target.value });
    return <section className="surface-card"><h2>{msg(MSG.SCHED_TITLE)}</h2><div className="row g-3"><Field name="previewTrainingType" label={msg(MSG.LOAI_BAI_TAP)} value={form.trainingType} onChange={e=>setForm({...form,trainingType:e.target.value})} options={Object.values(TRAINING_TYPE)}/><Field name="durationMinutes" label={msg(MSG.BR_DURATION)} type="number" min={1} max={480} step={1} value={form.durationMinutes} onChange={change}/><Field name="intensity" label={msg(MSG.CUONG_DO)} value={form.intensity} onChange={change} options={Object.values(INTENSITY)}/><Field name="distanceMetres" label={msg(MSG.QUANG_DUONG_M)} type="number" min={1} max={100000} value={form.distanceMetres} onChange={change}/></div><TrainingAvailability horseId={horseId} form={form}/></section>;
}
