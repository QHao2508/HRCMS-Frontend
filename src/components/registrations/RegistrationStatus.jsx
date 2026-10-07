import { statusDisplay } from "../../constants/registration.js";

export default function RegistrationStatus({ status }) {
    const display = statusDisplay(status);
    return <span className={`badge text-bg-${display.color}`}>{display.label}</span>;
}
