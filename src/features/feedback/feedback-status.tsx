import type { FeedbackStatus, FeedbackType } from "./domain";
import { feedbackStatusLabels, feedbackTypeLabels } from "./domain";

const statusStyles: Record<FeedbackStatus, string> = {
  new: "bg-primary-soft text-primary",
  reviewing: "bg-warning/12 text-warning",
  planned: "bg-primary-soft text-primary",
  resolved: "bg-success/10 text-success",
  closed: "bg-surface-strong text-muted",
};

export function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${statusStyles[status]}`}>
      {feedbackStatusLabels[status]}
    </span>
  );
}

export function FeedbackTypeLabel({ type }: { type: FeedbackType }) {
  return <span className="text-xs font-semibold text-muted">{feedbackTypeLabels[type]}</span>;
}
