import { MSG, msg } from '../../messages/index.js';
import { FIELD_LABELS } from '../../constants/registrationWizard.js';
import { focusRegistrationField } from '../../services/registrationFocus.js';

export default function RegistrationErrors({ errors, onStep }) {
    const items = Object.entries(errors);
    if (!items.length) return null;
    return <div className="wizard-error-summary" role="alert"><strong>{msg(MSG.UX_WIZARD_ERRORS, {count:items.length})}</strong><ul>{items.map(([name,error]) => <li key={name}><button type="button" onClick={() => focusRegistrationField(name,onStep)}>{FIELD_LABELS[name]}{' · '}{error}</button></li>)}</ul></div>;
}
