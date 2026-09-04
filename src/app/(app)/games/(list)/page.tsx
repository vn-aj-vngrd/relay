import { requireUser } from "@/features/auth/session";
import { sessionDateKey } from "@/features/sessions/format";
import {
  GameCollection,
  GameViewMenu,
} from "@/features/sessions/game-collection";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";
import {
  getGameCollectionPage,
  getGameInvitations,
} from "@/features/sessions/queries";

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; month?: string; date?: string }>;
}) {
  const user = await requireUser();
  const [
    params,
    upcomingPage,
    invitationPage,
    pastPage,
    organizingUpcomingPage,
    organizingPastPage,
  ] = await Promise.all([
    searchParams,
    getGameCollectionPage(user.id, "upcoming"),
    getGameInvitations(user.id),
    getGameCollectionPage(user.id, "past"),
    getGameCollectionPage(user.id, "upcoming", null, "organizing"),
    getGameCollectionPage(user.id, "past", null, "organizing"),
  ]);

  const todayKey = sessionDateKey(new Date());
  const initialMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? "")
    ? params.month!
    : todayKey.slice(0, 7);
  const requestedDate = new Date(`${params.date}T00:00:00Z`);
  const initialDate =
    /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(params.date ?? "") &&
    params.date!.startsWith(initialMonth) &&
    !Number.isNaN(requestedDate.getTime()) &&
    requestedDate.toISOString().slice(0, 10) === params.date
      ? params.date!
      : initialMonth === todayKey.slice(0, 7)
        ? todayKey
        : `${initialMonth}-01`;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="app-title">Games</h1>
        <div className="sm:hidden">
          <GameViewMenu />
        </div>
      </div>
      <GamesSectionNav current="mine" />
      <GameCollection
        upcomingPage={upcomingPage}
        invitationPage={invitationPage}
        pastPage={pastPage}
        organizingUpcomingPage={organizingUpcomingPage}
        organizingPastPage={organizingPastPage}
        todayKey={todayKey}
        initialFilter={
          params.filter === "invites"
            ? "invites"
            : params.filter === "past"
              ? "past"
              : params.filter === "organizing"
                ? "organizing"
                : "upcoming"
        }
        initialMonth={initialMonth}
        initialDate={initialDate}
      />
    </div>
  );
}
