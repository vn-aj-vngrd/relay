import { requireUser } from "@/features/auth/session";
import { sessionDateKey } from "@/features/sessions/format";
import { GameCollection, GameViewMenu } from "@/features/sessions/game-collection";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";
import { getGameCollectionPage } from "@/features/sessions/queries";

export default async function GamesPage() {
  const user = await requireUser();
  const [upcomingPage, pastPage] = await Promise.all([
    getGameCollectionPage(user.id, "upcoming"),
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
      <GameCollection upcomingPage={upcomingPage} pastPage={pastPage} todayKey={sessionDateKey(new Date())} />
    </div>
  );
}
