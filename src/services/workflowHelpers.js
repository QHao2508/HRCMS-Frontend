export function isAssigned(horse, user, role) { return user?.role === role && horse?.assignments?.some(a => a.active && a.staffId === user.id && a.role === role); }
export const clubToday = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
export function localDateTime(value) { if (!value) return ""; const date = new Date(value); if (!Number.isFinite(date.getTime())) return ""; return new Intl.DateTimeFormat("sv-SE", { year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:"Asia/Ho_Chi_Minh" }).format(date).replace(" ","T"); }
export function scheduledPayload(value) { return `${value}:00+07:00`; }
