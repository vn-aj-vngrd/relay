const units = [
  { seconds: 365 * 86400, short: "y", name: "year" },
  { seconds: 30 * 86400, short: "mo", name: "month" },
  { seconds: 7 * 86400, short: "w", name: "week" },
  { seconds: 86400, short: "d", name: "day" },
  { seconds: 3600, short: "h", name: "hour" },
  { seconds: 60, short: "m", name: "minute" },
];

export function chatAge(date: string, now = Date.now(), verbose = false) {
  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) return "Unknown";
  const seconds = Math.max(0, (now - timestamp) / 1000);
  const unit = units.find((candidate) => seconds >= candidate.seconds);
  if (!unit) return "Just now";
  const amount = Math.floor(seconds / unit.seconds);
  return verbose
    ? `${amount} ${unit.name}${amount === 1 ? "" : "s"} ago`
    : `${amount}${unit.short}`;
}
