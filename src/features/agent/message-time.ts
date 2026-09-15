import type { UIMessage } from "ai";

export function messageTimestamp(message: UIMessage | undefined) {
  const metadata = message?.metadata;
  if (
    !metadata ||
    typeof metadata !== "object" ||
    !("createdAt" in metadata) ||
    typeof metadata.createdAt !== "string"
  )
    return null;
  const date = new Date(metadata.createdAt);
  return Number.isFinite(date.getTime()) ? date : null;
}
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
export function showMessageTime(messages: UIMessage[], index: number) {
  const current = messageTimestamp(messages[index]);
  if (!current || messages[index].role !== "user") return false;
  let previous: Date | null = null;
  for (let i = index - 1; i >= 0 && !previous; i--)
    previous = messageTimestamp(messages[i]);
  return (
    !previous ||
    !sameDay(current, previous) ||
    current.getTime() - previous.getTime() >= 30 * 60_000
  );
}
export function formatMessageTime(date: Date, now = new Date()) {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const day = sameDay(date, now)
    ? "Today"
    : sameDay(date, yesterday)
      ? "Yesterday"
      : date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          ...(date.getFullYear() !== now.getFullYear()
            ? { year: "numeric" as const }
            : {}),
        });
  return `${day} ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
}
