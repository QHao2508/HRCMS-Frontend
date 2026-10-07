import { healthDisplay } from "../../constants/horses.js";

export default function HealthStatus({ value }) {
    const display = healthDisplay(value);
    return <span className={`badge text-bg-${display.color}`}>{display.label}</span>;
}
