export function UsageMeter({
  label,
  used,
  limit,
  unlimited,
  valueText,
}: {
  label: string;
  used: number;
  limit: number;
  unlimited: boolean;
  valueText: string;
}) {
  const percentage =
    limit > 0
      ? Math.min(100, Math.max(0, (used / limit) * 100))
      : used > 0
        ? 100
        : 0;
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="score text-sm">{valueText}</span>
      {unlimited ? (
        <span className="text-xs text-muted">No plan limit</span>
      ) : (
        <div
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
          aria-valuetext={valueText}
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised"
        >
          <div
            className={`h-full rounded-full ${percentage >= 90 ? "bg-warning" : "bg-primary"}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
