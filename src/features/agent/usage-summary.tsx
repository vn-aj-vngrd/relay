import Link from "next/link";
import type { AgentUsageSummary } from "./allowance";

export function AgentUsageSummaryView({ usage }: { usage: AgentUsageSummary }) {
  const date = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
  }).format(new Date(usage.resetsAt));
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs leading-5 text-muted">
      <p>
        {usage.used.toLocaleString()} of {usage.limit.toLocaleString()} messages
        used{usage.reserved ? ` · ${usage.reserved} in progress` : ""} · resets{" "}
        {date} (PH time)
      </p>
      <Link
        href="/settings/plan"
        className="inline-flex min-h-9 items-center text-primary hover:underline"
      >
        Plan & billing
      </Link>
    </div>
  );
}
