import { useCallback, useState } from 'react';
import { MSG, msg } from '../messages/index.js';
import { useRegistrationResource } from '../context/useRegistrationResource.js';
import { getPublicReferenceData } from '../services/trainingSchedulingService.js';
import { ResourceState } from './WorkflowUI.jsx';
export default function PublicRacingReference() {
    const [opened, setOpened] = useState(false);
    return <section className="surface-card"><h2>{msg(MSG.REAL_TITLE)}</h2><p>{msg(MSG.REAL_HELP)}</p><button className="btn btn-outline-primary" type="button" aria-expanded={opened} onClick={() => setOpened(!opened)}>{msg(MSG.REAL_OPEN)}</button>{opened && <ReferenceContent/>}</section>;
}
function ReferenceContent() {
    const load = useCallback(() => getPublicReferenceData(), []);
    const resource = useRegistrationResource(load);
    const sourceLink = row => <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer">{msg(MSG.REAL_SOURCE)}</a>;
    return <div className="mt-3"><ResourceState resource={resource}/>{resource.data && <><div className="table-responsive"><table className="table"><thead><tr><th scope="col">{msg(MSG.TEN_NGUA)}</th><th scope="col">{msg(MSG.HORSE_EXTERNAL_CODE)}</th><th scope="col">{msg(MSG.REAL_ORIGIN)}</th><th scope="col">{msg(MSG.SIRE_BO)}</th><th scope="col">{msg(MSG.DAM_ME)}</th><th scope="col">{msg(MSG.REAL_STATUS)}</th><th scope="col">{msg(MSG.REAL_SOURCE)}</th></tr></thead><tbody>{resource.data.horses.map(row => <tr key={row.externalId}><td>{row.name}</td><td>{row.externalId}</td><td>{row.origin}</td><td>{row.sire}</td><td>{row.dam}</td><td>{msg(row.sourceStatus === 'Retired' ? MSG.REAL_RETIRED : MSG.REAL_LISTED)}</td><td>{sourceLink(row)}</td></tr>)}</tbody></table></div><h3>{msg(MSG.REAL_TRAINERS)}</h3><div className="availability-grid">{resource.data.trainers.map(row => <article className="availability-resource" key={row.externalId}><h4>{row.name}</h4><p>{row.evidenceSummary}</p>{sourceLink(row)}</article>)}</div></>}</div>;
}
