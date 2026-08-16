import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { AdminDate, AdminStatus, EmptyAdminRows } from "@/features/admin/presentation";
import { getAdminSessions } from "@/features/admin/queries";

const statuses = ["", "draft", "published", "live", "completed", "cancelled"];

export default async function AdminSessionsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const params = await searchParams;
  const query = params.q?.slice(0, 100) ?? "";
  const status = params.status ?? "";
  const games = await getAdminSessions(query, status);

  return <div>
    <AdminPageHeading title="Games" description="Review sessions across Relay, find a host’s game, and intervene only when production support requires it." />
    <form role="search" className="mb-5 flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center"><label className="relative flex-1"><span className="sr-only">Search games</span><MagnifyingGlass aria-hidden size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input type="search" name="q" defaultValue={query} placeholder="Search title, venue, or host email" className="field !mt-0 !h-10 !pl-10 text-sm" /></label><label className="relative"><span className="sr-only">Filter by status</span><select name="status" defaultValue={status} className="field !mt-0 !h-10 min-w-40 appearance-none !pr-10 text-sm">{statuses.map((value) => <option key={value} value={value}>{value ? value[0].toUpperCase() + value.slice(1) : "All statuses"}</option>)}</select><CaretDown aria-hidden size={14} weight="bold" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" /></label><button className="pressable h-10 rounded-lg bg-primary px-3.5 text-sm font-semibold text-white hover:bg-primary-hover">Apply</button></form>
    <p className="mb-2 text-xs text-muted">Showing up to 75 games.</p>
    <div className="overflow-x-auto border-y border-line"><table className="w-full min-w-[820px] border-collapse text-left"><thead><tr className="border-b border-line text-xs font-semibold text-muted"><th className="px-3 py-3">Game</th><th className="px-3 py-3">Host</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Players</th><th className="w-16 px-3 py-3"><span className="sr-only">Open</span></th></tr></thead><tbody className="divide-y divide-line">{games.length ? games.map((game) => <tr key={game.id} className="hover:bg-surface-strong/60"><td className="px-3 py-3.5"><p className="font-semibold">{game.title}</p><p className="mt-1 text-xs text-muted">{game.venueName} · <AdminDate value={game.startsAt} /></p></td><td className="px-3 py-3.5"><p className="text-sm font-medium">{game.hostName ?? "Profile not finished"}</p><p className="mt-1 text-xs text-muted">{game.hostEmail}</p></td><td className="px-3 py-3.5"><AdminStatus value={game.status} /></td><td className="score px-3 py-3.5 text-right text-sm">{game.playerCount} / {game.capacity}</td><td className="px-3 py-3.5 text-right"><Link href={`/admin/sessions/${game.id}`} aria-label={`Open ${game.title}`} className="inline-flex min-h-10 items-center font-semibold text-primary">Open</Link></td></tr>) : <EmptyAdminRows colSpan={5} message="No games match these filters." />}</tbody></table></div>
  </div>;
}
