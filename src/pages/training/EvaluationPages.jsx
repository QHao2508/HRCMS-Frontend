import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { SESSION_STATUS } from '../../constants/training.js';
import { getEnumLabel } from '../../constants/enumLabels.js';
import { MSG, msg, UI_LOCALE } from '../../messages/index.js';
import { useRegistrationResource } from '../../context/useRegistrationResource.js';
import { listSessions } from '../../services/trainingService.js';
import { PageHeading, ResourceState, Pagination, StateBadge } from '../../components/WorkflowUI.jsx';
import '../../style/training-v2.css';

/** The API pages each result state separately; detail supplies the authoritative evaluation state. */
export function EvaluationQueue() {
    const [status, setStatus] = useState(SESSION_STATUS.Completed);
    const [page, setPage] = useState(1);
    const load = useCallback(() => listSessions({ page, pageSize: 20, status }), [page, status]);
    const resource = useRegistrationResource(load, { realtime: true });
    return <section className="training-page training-evaluation">
        <PageHeading title={msg(MSG.TRAINING_AWAITING_EVALUATION)} description={msg(MSG.THEO_DOI_BUOI_TAP_TRONG_PHAM_VI_CUA_BAN)} />
        <p className="muted-caption">{msg(MSG.TRAINING_EVALUATION_QUEUE_NOTE)}</p>
        <div className="surface-card"><label htmlFor="evaluation-status" className="form-label">{msg(MSG.TRANG_THAI)}</label><select id="evaluation-status" className="form-select" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}>
            {[SESSION_STATUS.Completed, SESSION_STATUS.IssueReported].map(value => <option key={value} value={value}>{getEnumLabel(value)}</option>)}
        </select></div>
        <section className="surface-card"><h2>{msg(MSG.TRAINING_AWAITING_EVALUATION)}</h2><ResourceState resource={resource} />{resource.data && <>
            <div className="table-responsive"><table className="table"><thead><tr><th>{msg(MSG.TRAINING_HORSE)}</th><th>{msg(MSG.THOI_GIAN)}</th><th>{msg(MSG.TRAINING_RIDER)}</th><th>{msg(MSG.TRANG_THAI)}</th><th /></tr></thead><tbody>{resource.data.items.map(session => <tr key={session.id}>
                <td>{session.horseName || msg(MSG.CHUA_CO_THONG_TIN)}</td><td>{new Date(session.scheduledAt).toLocaleString(UI_LOCALE, { timeZone: 'Asia/Ho_Chi_Minh' })}</td><td>{session.riderName || msg(MSG.CHUA_CO_THONG_TIN)}</td><td><StateBadge value={session.status} /></td><td><Link className="btn btn-outline-primary" to={`/training/evaluations/${session.id}`}>{msg(MSG.TRAINING_REVIEW_RESULT)}</Link></td>
            </tr>)}</tbody></table></div>
            {!resource.data.items.length && <p className="empty-state">{msg(MSG.KHONG_CO_BUOI_TAP_O_TRANG_THAI_NAY)}</p>}
            <Pagination data={resource.data} onChange={setPage} />
        </>}</section>
    </section>;
}
