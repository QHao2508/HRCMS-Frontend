import { treatmentFrequency } from "../services/treatmentFrequency.js";
import { useCallback } from 'react';
import { MSG, msg } from '../messages/index.js';
import { getEnumLabel } from '../constants/enumLabels.js';
import { can } from '../constants/permissions.js';
import { useRegistrationResource } from '../context/useRegistrationResource.js';
import { change, id, read } from '../services/supportService.js';
import { usePaged, when } from '../services/supportResources.js';
import { clubToday } from '../services/workflowHelpers.js';
import { ResourceState, StateBadge } from './WorkflowUI.jsx';
import { SupportForm, SupportTable } from './SupportUI.jsx';

const date = value => value ? new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—';
function restrictionText(r) {
    const parts = [];
    if (r.blockAllTraining) parts.push(msg(MSG.HMED_BLOCK_ALL));
    if (r.trainingLock) parts.push(msg(MSG.HMED_LOCK));
    if (r.noSprint) parts.push(msg(MSG.HMED_NO_SPRINT));
    if (r.maxIntensity) parts.push(msg(MSG.HMED_MAX_INTENSITY, { value: getEnumLabel(r.maxIntensity) }));
    if (r.maxDistanceMetres != null) parts.push(msg(MSG.HMED_MAX_DISTANCE, { value: r.maxDistanceMetres }));
    return parts.join(' · ');
}
function Restrictions({ items }) {
    return <><h3 className="h5 mt-3">{msg(MSG.HMED_RESTRICTIONS)}</h3>
        {!items.length ? <p>{msg(MSG.HMED_NO_RESTRICTIONS)}</p> : <ul>{items.map(r => <li key={r.id}><strong>{restrictionText(r)}</strong>{r.reason && ` — ${r.reason}`}{' ('}{msg(MSG.HMED_UNTIL, { value: r.validUntil ? date(r.validUntil) : msg(MSG.HMED_NO_END) })}{')'}</li>)}</ul>}</>;
}

/**
 * Khung sức khỏe trong hồ sơ ngựa theo ma trận quyền: Manager/HeadTrainer/Chủ ngựa/Vet xem tóm tắt y tế
 * (Vet và Manager thấy thêm ghi chú lâm sàng); mọi vai trò khác chỉ xem hạn chế vận động đang hiệu lực.
 */
export function HorseHealthPanel({ horseId, user }) {
    const overviewAllowed = can(user, 'medicalOverview');
    const load = useCallback(() => read(`/api/horses/${id(horseId)}/medical/${overviewAllowed ? 'overview' : 'summary'}`), [horseId, overviewAllowed]);
    const resource = useRegistrationResource(load, { realtime: true });
    const data = resource.data;
    return <section id="horse-health" className="surface-card"><h2>{msg(MSG.HMED_TITLE)}</h2><ResourceState resource={resource} />
        {data && <>
            <p>{msg(MSG.HMED_STATUS)}{': '}<StateBadge value={data.healthStatus} /></p>
            {overviewAllowed && <>
                <p className="form-text">{msg(MSG.HMED_READONLY)}{!data.includesClinicalNotes && ` ${msg(MSG.HMED_OWNER_NOTE)}`}</p>
                <h3 className="h5">{msg(MSG.HMED_CASES)}</h3>
                {!data.cases.length ? <p>{msg(MSG.HMED_NO_CASES)}</p> : <div className="table-responsive"><table className="table"><thead><tr><th scope="col">{msg(MSG.HMED_REASON)}</th><th scope="col">{msg(MSG.HMED_DIAGNOSIS)}</th><th scope="col">{msg(MSG.HMED_STATUS)}</th><th scope="col">{msg(MSG.HMED_OPENED)}</th><th scope="col">{msg(MSG.HMED_LAST)}</th><th scope="col"><span className="visually-hidden">{msg(MSG.SUPPORT_ACTIONS)}</span></th></tr></thead>
                    <tbody>{data.cases.map(c => <tr key={c.recordId}><td>{c.reason}{data.includesClinicalNotes && <div className="form-text">{c.symptoms && <div>{msg(MSG.HMED_SYMPTOMS)}{': '}{c.symptoms}</div>}{c.findings && <div>{msg(MSG.HMED_FINDINGS)}{': '}{c.findings}</div>}{c.notes && <div>{msg(MSG.HMED_NOTES)}{': '}{c.notes}</div>}</div>}</td><td>{c.diagnosis}</td><td><StateBadge value={c.healthStatus} /></td><td>{when(c.openedAt)}</td><td>{when(c.lastExaminationAt)}</td>
                        <td><span className={`badge ${c.resolved ? 'text-bg-success' : 'text-bg-warning'}`}>{msg(c.resolved ? MSG.HMED_CASE_RESOLVED : MSG.HMED_CASE_OPEN)}</span><div className="form-text">{msg(MSG.HMED_FOLLOWUPS, { count: c.followUps })}</div></td></tr>)}</tbody></table></div>}
                <h3 className="h5 mt-3">{msg(MSG.HMED_TREATMENTS)}</h3>
                {!data.treatments.length ? <p>{msg(MSG.HMED_NO_TREATMENTS)}</p> : <ul>{data.treatments.map(t => <li key={t.id}><strong>{t.objective}</strong>{' — '}{[t.instructions, t.medication, treatmentFrequency(t.frequency)].filter(Boolean).join(' · ')}{' ('}{date(t.startDate)}{') '}<span className={`badge ${t.completed ? 'text-bg-success' : 'text-bg-secondary'}`}>{msg(t.completed ? MSG.HMED_PLAN_DONE : MSG.HMED_PLAN_ACTIVE)}</span></li>)}</ul>}
            </>}
            <Restrictions items={data.restrictions} />
        </>}
    </section>;
}

/** Số đo thể chất: mọi vai trò trong phạm vi xem lịch sử; Manager, Vet, Groom ghi số đo mới. */
export function HorseMeasurements({ horseId, user, reload, archived }) {
    const path = `/api/horses/${id(horseId)}/measurements`;
    const resource = usePaged(path);
    return <section id="horse-measurements"><h2 className="mt-4">{msg(MSG.HMED_MEASURE_TITLE)}</h2><SupportTable resource={resource} columns={[{ key: 'date', label: msg(MSG.HMED_MEASURE_DATE), render: x => date(x.date) }, { key: 'heightCm', label: msg(MSG.HMED_MEASURE_HEIGHT) }, { key: 'weightKg', label: msg(MSG.HMED_MEASURE_WEIGHT) }]} />
        {can(user, 'measurementWrite') && !archived && <SupportForm title={msg(MSG.HMED_MEASURE_ADD)} initial={{ date: clubToday(), heightCm: '', weightKg: '' }} reload={() => { resource.reload(); reload?.(); }}
            submit={f => change(path, { date: f.date, heightCm: Number(f.heightCm), weightKg: Number(f.weightKg) })}
            fields={[{ name: 'date', label: msg(MSG.HMED_MEASURE_DATE), type: 'date', max: clubToday(), required: true }, { name: 'heightCm', label: msg(MSG.HMED_MEASURE_HEIGHT), type: 'number', min: 1, max: 300, step: '0.1', required: true }, { name: 'weightKg', label: msg(MSG.HMED_MEASURE_WEIGHT), type: 'number', min: 1, max: 2000, step: '0.1', required: true }]} />}
    </section>;
}
