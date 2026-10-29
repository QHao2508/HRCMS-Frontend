import { MSG, msg } from '../messages/index.js';

export default function ProgressSteps({ steps, current }) {
    return <ol className="workflow-progress" aria-label={msg(MSG.UX_PROGRESS)}>{steps.map((step, index) => <li key={step} className={index < current ? 'is-complete' : index === current ? 'is-current' : ''} aria-current={index === current ? 'step' : undefined}><span aria-hidden="true">{index + 1}</span><strong>{step}</strong></li>)}</ol>;
}
