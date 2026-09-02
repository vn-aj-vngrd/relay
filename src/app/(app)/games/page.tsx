import { requireUser } from "@/features/auth/session";
import { sessionDateKey } from "@/features/sessions/format";
import { GameCollection, GameViewMenu } from "@/features/sessions/game-collection";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";
import { getGameCollectionPage, getGameInvitations } from "@/features/sessions/queries";

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await requireUser();
  const [{ filter }, upcomingPage, invitationPage, pastPage] = await Promise.all([
    searchParams,
    getGameCollectionPage(user.id, "upcoming"),
    getGameInvitations(user.id),
    getGameCollectionPage(user.id, "past"),
  ]);

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
        todayKey={sessionDateKey(new Date())}
        initialFilter={filter === "invites" ? "invites" : filter === "past" ? "past" : "upcoming"}
      />
    </div>
  );
}
