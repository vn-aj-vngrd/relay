export function formatSessionDate(value: Date, timeZone = "Asia/Manila") {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(value);
}
export function sessionDateKey(value: Date, timeZone = "Asia/Manila") {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function formatSessionDateLong(value: Date, timeZone = "Asia/Manila") {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(value);
}
export function formatSessionTime(
  start: Date,
  end: Date,
  timeZone = "Asia/Manila"
) {
  const formatter = new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
  return `${formatter.format(start)}–${formatter.format(end)}`;
}
export function peso(cents?: number | null) {
  return cents == null
    ? null
    : new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
      }).format(cents / 100);
}
export function spotsRemainingLabel(count: number) {
  return `${count} ${count === 1 ? "spot" : "spots"} left`;
}
