import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { MSG, msg } from '../../messages/index.js';

export default function PasswordInput(props) {
    const [visible, setVisible] = useState(false);
    const Icon = visible ? EyeOff : Eye;
    return <div className="password-control"><input {...props} type={visible ? 'text' : 'password'} /><button type="button" className="password-toggle" disabled={props.disabled} aria-label={msg(visible ? MSG.UX_HIDE_PASSWORD : MSG.UX_SHOW_PASSWORD)} aria-pressed={visible} onClick={() => setVisible(value => !value)}><Icon size={18} aria-hidden="true" /></button></div>;
}
