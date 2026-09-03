const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-danger/10 text-danger",
  live: "bg-live/10 text-live",
  published: "bg-primary-soft text-primary",
  completed: "bg-surface-strong text-muted",
  cancelled: "bg-danger/10 text-danger",
  draft: "bg-warning/12 text-warning",
  verified: "bg-success/10 text-success",
  pending: "bg-warning/12 text-warning",
  rejected: "bg-danger/10 text-danger",
  unverified: "bg-surface-strong text-muted",
  archived: "bg-surface-strong text-muted",
};

export function AdminStatus({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold capitalize ${statusStyles[value] ?? "bg-surface-strong text-muted"}`}
    >
      {value}
    </span>
  );
}

export function AdminDate({
  value,
  includeTime = false,
}: {
  value: Date | string;
  includeTime?: boolean;
}) {
  const date = value instanceof Date ? value : new Date(value);
  return (
    <time
      dateTime={date.toISOString()}
      className="whitespace-nowrap text-sm text-muted"
    >
      {new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        ...(includeTime ? { timeStyle: "short" } : {}),
      }).format(date)}
    </time>
  );
}

export function EmptyAdminRows({
  message,
  colSpan,
}: {
  message: string;
  colSpan: number;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-12 text-center text-sm text-muted"
      >
        {message}
      </td>
    </tr>
  );
}
