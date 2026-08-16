import { MagnifyingGlass, UserPlus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { getAdminUsers } from "@/features/admin/queries";
import { AdminDate, AdminStatus, EmptyAdminRows } from "@/features/admin/presentation";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.slice(0, 100) ?? "";
  const accounts = await getAdminUsers(query);

  return <div>
    <AdminPageHeading title="Users" description="Search production accounts, review participation, and manage access without exposing authentication credentials." action={<ButtonLink href="/admin/users/new"><UserPlus aria-hidden size={17} />Create user</ButtonLink>} />
    <form role="search" className="mb-5 flex max-w-xl items-center gap-2"><label className="relative flex-1"><span className="sr-only">Search users</span><MagnifyingGlass aria-hidden size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input type="search" name="q" defaultValue={query} placeholder="Search name, username, or email" className="field !mt-0 !h-10 !pl-10 text-sm" /></label><button className="pressable h-10 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white hover:bg-primary-hover">Search</button></form>
    <p className="mb-2 text-xs text-muted">Showing up to 50 accounts{query ? ` matching “${query}”` : ""}.</p>
    <div className="overflow-x-auto border-y border-line"><table className="w-full min-w-[720px] border-collapse text-left"><thead><tr className="border-b border-line text-xs font-semibold text-muted"><th className="px-3 py-3">User</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Hosted</th><th className="px-3 py-3">Joined</th><th className="w-16 px-3 py-3"><span className="sr-only">Open</span></th></tr></thead><tbody className="divide-y divide-line">{accounts.length ? accounts.map((account) => <tr key={account.id} className="hover:bg-surface-strong/60"><td className="px-3 py-3.5"><p className="font-semibold">{account.name ?? "Profile not finished"}</p><p className="mt-1 text-xs text-muted">{account.email}{account.username ? ` · @${account.username}` : ""}</p></td><td className="px-3 py-3.5"><AdminStatus value={account.suspendedAt ? "suspended" : "active"} /></td><td className="score px-3 py-3.5 text-right text-sm">{account.sessionsHosted}</td><td className="px-3 py-3.5"><AdminDate value={account.createdAt} /></td><td className="px-3 py-3.5 text-right"><Link href={`/admin/users/${account.id}`} aria-label={`Open ${account.name ?? account.email}`} className="inline-flex min-h-10 items-center font-semibold text-primary">Open</Link></td></tr>) : <EmptyAdminRows colSpan={5} message={query ? "No accounts match this search." : "No users have registered yet."} />}</tbody></table></div>
  </div>;
}
