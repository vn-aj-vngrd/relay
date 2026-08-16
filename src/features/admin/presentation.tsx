const statusStyles: Record<string, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-danger/10 text-danger",
  live: "bg-live/10 text-live",
  published: "bg-primary-soft text-primary",
  completed: "bg-surface-strong text-muted",
  cancelled: "bg-danger/10 text-danger",
  draft: "bg-warning/12 text-warning",
};

export function AdminStatus({ value }: { value: string }) {
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold capitalize ${statusStyles[value] ?? "bg-surface-strong text-muted"}`}>{value}</span>;
}

export function AdminDate({ value, includeTime = false }: { value: Date; includeTime?: boolean }) {
  return <time dateTime={value.toISOString()} className="whitespace-nowrap text-sm text-muted">{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", ...(includeTime ? { timeStyle: "short" } : {}) }).format(value)}</time>;
}

export function EmptyAdminRows({ message, colSpan }: { message: string; colSpan: number }) {
  return <tr><td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-muted">{message}</td></tr>;
}
