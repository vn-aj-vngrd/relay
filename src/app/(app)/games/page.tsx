import { CalendarDays, CalendarPlus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { GameCollection, type GameCollectionItem } from "@/features/sessions/game-collection";
import { formatSessionDate, formatSessionTime, sessionDateKey } from "@/features/sessions/format";
import { getHomeSessions } from "@/features/sessions/queries";

export default async function GamesPage() {
  const user = await requireUser();
  const data = await getHomeSessions(user.id);
  const upcoming: GameCollectionItem[] = data.upcoming.map(({ session, playerCount }) => ({
    id: session.id,
    href: `/games/${session.id}`,
    title: session.title,
    date: formatSessionDate(session.startsAt),
    dateKey: sessionDateKey(session.startsAt, session.timezone),
    time: formatSessionTime(session.startsAt, session.endsAt),
    venue: session.venueName,
    playerCount,
    capacity: session.capacity,
    status: session.status,
  }));
  const past: GameCollectionItem[] = data.recent.map(({ session, playerCount }) => ({
    id: session.id,
    href: `/s/${session.slug}`,
    title: session.title,
    date: formatSessionDate(session.startsAt),
    dateKey: sessionDateKey(session.startsAt, session.timezone),
    time: formatSessionTime(session.startsAt, session.endsAt),
    venue: session.venueName,
    playerCount,
    capacity: session.capacity,
    status: session.status,
  }));
  const todayKey = sessionDateKey(new Date());

  return <div><header className="flex items-end justify-between gap-4"><div className="flex items-start gap-4"><span className="mt-1 hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-white sm:grid"><CalendarDays size={24} strokeWidth={2.6} /></span><div><p className="sport-label text-primary">Your schedule</p><h1 className="app-title mt-1">Games</h1><p className="mt-2 max-w-xl text-muted">Plans, active sessions, and game-night memories in one place.</p></div></div><span className="hidden sm:block"><ButtonLink href="/games/new"><CalendarPlus size={18} strokeWidth={2.5} />Create game</ButtonLink></span></header><GameCollection upcoming={upcoming} past={past} todayKey={todayKey} /></div>;
}
