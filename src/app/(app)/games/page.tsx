import { CalendarPlus } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { GameCollection, type GameCollectionItem } from "@/features/sessions/game-collection";
import { formatSessionDate, formatSessionTime, sessionDateKey } from "@/features/sessions/format";
import { getHomeSessions } from "@/features/sessions/queries";

export default async function GamesPage() {
  const user = await requireUser();
  const data = await getHomeSessions(user.id);
  const upcoming: GameCollectionItem[] = data.upcoming.map(({ session, player, playerCount }) => ({
    id: session.id,
    href: player.rsvp === "invited" ? `/s/${session.slug}` : `/games/${session.id}`,
    title: session.title,
    date: formatSessionDate(session.startsAt),
    dateKey: sessionDateKey(session.startsAt, session.timezone),
    time: formatSessionTime(session.startsAt, session.endsAt),
    venue: session.venueName,
    playerCount,
    capacity: session.capacity,
    status: session.status,
    accentColor: session.accentColor,
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
    accentColor: session.accentColor,
  }));
  const todayKey = sessionDateKey(new Date());

  return <div><div className="flex items-end justify-between gap-4"><div><h1 className="app-title">Games</h1><p className="mt-2 max-w-xl text-muted">Every plan, active session, and game-night memory in one place.</p></div><span className="hidden sm:block"><ButtonLink href="/games/new"><CalendarPlus size={17} />Create game</ButtonLink></span></div><GameCollection upcoming={upcoming} past={past} todayKey={todayKey} /></div>;
}
