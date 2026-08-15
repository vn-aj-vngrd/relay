import Link from "next/link";
import { and, eq, ilike, inArray } from "drizzle-orm";
import { Search } from "lucide-react";
import { db } from "@/db/client";
import { groupMembers, groups, profiles, sessions, venues } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { formatSessionDate } from "@/features/sessions/format";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser(); const q = (await searchParams).q?.trim() ?? ""; const pattern = `%${q}%`;
  const [foundSessions, foundProfiles, foundVenues, foundGroups] = q.length >= 2 ? await Promise.all([
    db.select().from(sessions).where(and(ilike(sessions.title, pattern), inArray(sessions.status, ["published", "live", "completed"]), inArray(sessions.visibility, ["public", "link"]))).limit(8),
    db.select().from(profiles).where(ilike(profiles.name, pattern)).limit(8),
    db.select().from(venues).where(ilike(venues.name, pattern)).limit(8),
    db.select({ group: groups }).from(groupMembers).innerJoin(groups, eq(groupMembers.groupId, groups.id)).where(and(eq(groupMembers.userId, user.id), ilike(groups.name, pattern))).limit(8),
  ]) : [[], [], [], []];
  const total = foundSessions.length + foundProfiles.length + foundVenues.length + foundGroups.length;
  return <div className="mx-auto max-w-3xl"><h1 className="text-[28px] font-bold tracking-[-0.035em]">Search Relay</h1><form className="relative mt-6"><Search className="absolute left-3.5 top-3.5 text-muted" size={20} /><label htmlFor="search" className="sr-only">Search venues, players, groups, and sessions</label><input id="search" name="q" defaultValue={q} autoFocus placeholder="Venues, players, groups, or games" className="h-12 w-full rounded-[10px] border border-line bg-canvas pl-11 pr-4 placeholder:text-muted" /></form>{q.length < 2 ? <p className="mt-8 border-y border-line py-8 text-sm text-muted">Type at least two characters to search.</p> : total ? <div className="mt-9 space-y-9">{foundSessions.length ? <section><h2 className="font-bold">Games</h2><div className="mt-2 divide-y divide-line border-y border-line">{foundSessions.map((session) => <Link key={session.id} href={`/s/${session.slug}`} className="block py-4"><p className="font-semibold">{session.title}</p><p className="mt-1 text-sm text-muted">{formatSessionDate(session.startsAt)} · {session.venueName}</p></Link>)}</div></section> : null}{foundProfiles.length ? <section><h2 className="font-bold">Players</h2><div className="mt-2 divide-y divide-line border-y border-line">{foundProfiles.map((profile) => <Link key={profile.userId} href={`/profile/${profile.username}`} className="block py-4"><p className="font-semibold">{profile.name}</p><p className="mt-1 text-sm text-muted">@{profile.username}{profile.city ? ` · ${profile.city}` : ""}</p></Link>)}</div></section> : null}{foundVenues.length ? <section><h2 className="font-bold">Venues</h2><div className="mt-2 divide-y divide-line border-y border-line">{foundVenues.map((venue) => <Link key={venue.id} href={`/venues/${venue.slug}`} className="block py-4"><p className="font-semibold">{venue.name}</p><p className="mt-1 text-sm text-muted">{venue.address}</p></Link>)}</div></section> : null}{foundGroups.length ? <section><h2 className="font-bold">Your groups</h2><div className="mt-2 divide-y divide-line border-y border-line">{foundGroups.map(({ group }) => <div key={group.id} className="py-4 font-semibold">{group.name}</div>)}</div></section> : null}</div> : <section className="mt-9 border-y border-line py-10"><h2 className="font-bold">No results for “{q}”</h2><p className="mt-2 text-sm text-muted">Check the spelling or try a shorter name.</p></section>}</div>;
}
