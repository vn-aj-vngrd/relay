import type { AgentUsageSummary } from "./allowance";

export function AgentUsageSummaryView({ usage }: { usage: AgentUsageSummary }) {
  const date = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
  }).format(new Date(usage.resetsAt));
  return (
    <div className="mb-2 text-xs leading-5 text-muted">
      <p>
        {usage.used.toLocaleString()} of {usage.limit.toLocaleString()} messages
        used{usage.reserved ? ` · ${usage.reserved} in progress` : ""} · resets{" "}
        {date} (PH time)
      </p>
    </div>
  );
}
