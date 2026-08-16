import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { AdminDate, EmptyAdminRows } from "@/features/admin/presentation";
import { getAdminAuditLog } from "@/features/admin/queries";

export default async function AdminAuditPage() {
  const entries = await getAdminAuditLog();

  return <div>
    <AdminPageHeading title="Audit log" description="An append-only record of privileged production changes. Authentication secrets and payment details are never written here." />
    <div className="overflow-x-auto border-y border-line"><table className="w-full min-w-[820px] border-collapse text-left"><thead><tr className="border-b border-line text-xs font-semibold text-muted"><th className="px-3 py-3">Action</th><th className="px-3 py-3">Administrator</th><th className="px-3 py-3">Target</th><th className="px-3 py-3">Reason</th><th className="px-3 py-3">Time</th></tr></thead><tbody className="divide-y divide-line">{entries.length ? entries.map(({ log, actorEmail, actorName }) => <tr key={log.id} className="align-top"><td className="px-3 py-4"><span className="rounded-md bg-surface-strong px-2 py-1 text-xs font-semibold">{log.action}</span></td><td className="px-3 py-4"><p className="text-sm font-medium">{actorName ?? actorEmail}</p><p className="mt-1 text-xs text-muted">{actorEmail}</p></td><td className="px-3 py-4"><p className="text-sm font-medium capitalize">{log.targetType}</p><p className="score mt-1 text-xs text-muted">{log.targetId.slice(0, 12)}</p></td><td className="max-w-sm px-3 py-4 text-sm leading-6 text-muted">{log.reason ?? "—"}</td><td className="px-3 py-4"><AdminDate value={log.createdAt} includeTime /></td></tr>) : <EmptyAdminRows colSpan={5} message="No privileged actions have been recorded." />}</tbody></table></div>
  </div>;
}
