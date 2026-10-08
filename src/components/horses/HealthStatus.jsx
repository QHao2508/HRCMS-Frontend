import { healthDisplay } from "../../constants/horses.js";

export default function HealthStatus({ value }) {
    const display = healthDisplay(value);
    return <span className={`hrcms-horse-health-status hrcms-horse-health-${display.color}`}>{display.label}</span>;
}
