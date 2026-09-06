import { CalendarPlus } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { sessionDateKey } from "@/features/sessions/format";
import {
  GameCollection,
  GameViewMenu,
} from "@/features/sessions/game-collection";
import {
  defaultGameLibraryFilters,
  parseGameLibraryFilters,
} from "@/features/sessions/game-library-filters";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";
import {
  getGameCollectionPage,
  getGameInvitations,
  getGameLibraryOptions,
} from "@/features/sessions/queries";

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const rawParams = await searchParams;
  const params = Object.fromEntries(
    Object.entries(rawParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ])
  );
  const parsed = parseGameLibraryFilters({ get: (key) => params[key] ?? null });
  const filters = parsed.success ? parsed.data : defaultGameLibraryFilters;
  const emptyPage = { items: [], nextCursor: null };
  const [upcomingPage, invitationPage, pastPage, options] = await Promise.all([
    parsed.success && filters.when !== "past"
      ? getGameCollectionPage(user.id, "upcoming", null, "all", filters)
      : emptyPage,
    getGameInvitations(user.id),
    parsed.success && filters.when !== "upcoming"
      ? getGameCollectionPage(user.id, "past", null, "all", filters)
      : emptyPage,
    getGameLibraryOptions(user.id),
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
        <div className="flex items-center gap-3">
          <div className="sm:hidden">
            <GameViewMenu />
          </div>
          <ButtonLink href="/games/new" className="hidden sm:inline-flex">
            <CalendarPlus aria-hidden size={17} />
            Create game
          </ButtonLink>
        </div>
      </div>
      <GamesSectionNav current="mine" />
      <GameCollection
        upcomingPage={upcomingPage}
        invitationPage={invitationPage}
        pastPage={pastPage}
        filters={filters}
        options={options}
        filterError={
          parsed.success
            ? undefined
            : "These filters are invalid. Clear filters and try again."
        }
        todayKey={todayKey}
        initialFilter={params.filter === "invites" ? "invites" : filters.when}
        initialMonth={initialMonth}
        initialDate={initialDate}
      />
    </div>
  );
}
