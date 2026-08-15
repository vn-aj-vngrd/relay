export function formatSessionDate(value: Date, timeZone = "Asia/Manila") {
  return new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone }).format(value);
}
export function formatSessionDateLong(value: Date, timeZone = "Asia/Manila") {
  return new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "long", day: "numeric", timeZone }).format(value);
}
export function formatSessionTime(start: Date, end: Date, timeZone = "Asia/Manila") {
  const formatter = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone });
  return `${formatter.format(start)}–${formatter.format(end)}`;
}
export function peso(cents?: number | null) { return cents == null ? null : new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(cents / 100); }
