import { statusDisplay } from "../../constants/registration.js";
import "../../style/flow1.css";

export default function RegistrationStatus({ status }) {
    const display = statusDisplay(status);
    return <span className={`hrcms-registration-status hrcms-registration-status-${display.color}`}>{display.label}</span>;
}
