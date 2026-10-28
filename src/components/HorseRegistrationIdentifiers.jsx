import { MSG, msg } from '../messages/index.js';
import { systemRegistrationCode } from '../services/horseIdentifiers.js';

export default function HorseRegistrationIdentifiers({ horse }) {
    return <>
        <div><dt>{msg(MSG.HORSE_SYSTEM_CODE)}</dt><dd>{systemRegistrationCode(horse) || '—'}</dd></div>
        <div><dt>{msg(MSG.HORSE_EXTERNAL_CODE)}</dt><dd>{horse?.externalRegistrationNumber || msg(MSG.HORSE_EXTERNAL_MISSING)}</dd></div>
    </>;
}
