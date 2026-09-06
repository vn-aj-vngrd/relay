import { requireUser } from "@/features/auth/session";
import { sessionDateKey } from "@/features/sessions/format";
import {
  gameLibraryFilterSchema,
  gameLibraryRangeError,
} from "@/features/sessions/game-library-filters";
import { GameViewMenu } from "@/features/sessions/game-view-menu";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";
import { InvitationsCollection } from "@/features/sessions/invitations-collection";
import {
  getGameCollectionPage,
  getInvitationCount,
  hasInvitationHistory,
} from "@/features/sessions/queries";

export default async function InvitationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  const values = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ])
  );
  const defaults = {
    collection: "invitations",
    response: "invited",
    cancelled: "true",
  };
  const parsed = gameLibraryFilterSchema.safeParse({
    ...defaults,
    ...values,
    collection: "invitations",
    role: "any",
    group: "any",
    venue: "",
    cancelled: "true",
  });
  const filters = parsed.success
    ? parsed.data
    : gameLibraryFilterSchema.parse(defaults);
  const error = parsed.success
    ? gameLibraryRangeError(filters)
    : "These filters are invalid. Clear filters and try again.";
  const empty = { items: [], nextCursor: null };
  const [upcomingPage, pastPage, invitationCount, hasHistory] =
    await Promise.all([
      !error && filters.when !== "past"
        ? getGameCollectionPage(user.id, "upcoming", null, "all", filters)
        : empty,
      !error && filters.when !== "upcoming"
        ? getGameCollectionPage(user.id, "past", null, "all", filters)
        : empty,
      getInvitationCount(user.id),
      hasInvitationHistory(user.id),
    ]);
  const todayKey = sessionDateKey(new Date());
  const initialMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(values.month ?? "")
    ? values.month!
    : todayKey.slice(0, 7);
  const requestedDate = values.date ?? "";
  const date = new Date(`${requestedDate}T00:00:00Z`);
  const initialDate =
    /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) &&
    requestedDate.startsWith(initialMonth) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === requestedDate
      ? requestedDate
      : initialMonth === todayKey.slice(0, 7)
        ? todayKey
        : `${initialMonth}-01`;
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="app-title">Invitations</h1>
        <div className="sm:hidden">
          <GameViewMenu />
        </div>
      </div>
      <GamesSectionNav
        current="invitations"
        invitationCount={invitationCount}
      />
      <InvitationsCollection
        filters={filters}
        upcomingPage={upcomingPage}
        pastPage={pastPage}
        hasHistory={hasHistory}
        todayKey={todayKey}
        initialMonth={initialMonth}
        initialDate={initialDate}
        error={error ?? undefined}
      />
    </div>
  );
}
