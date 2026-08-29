import { CalendarPlus } from "@phosphor-icons/react/dist/ssr";

import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { sessionDateKey } from "@/features/sessions/format";
import { GameCollection } from "@/features/sessions/game-collection";
import { getGameCollectionPage } from "@/features/sessions/queries";

export default async function GamesPage() {
  const user = await requireUser();
  const [upcomingPage, pastPage] = await Promise.all([
    getGameCollectionPage(user.id, "upcoming"),
    getGameCollectionPage(user.id, "past"),
  ]);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="app-title">Games</h1>
          <p className="mt-2 hidden max-w-xl text-muted sm:block">See your upcoming, active, and past games.</p>
        </div>
        <span className="hidden sm:block">
          <ButtonLink href="/games/new">
            <CalendarPlus size={17} />
            Create game
          </ButtonLink>
        </span>
      </div>
      <GameCollection upcomingPage={upcomingPage} pastPage={pastPage} todayKey={sessionDateKey(new Date())} />
    </div>
  );
}
