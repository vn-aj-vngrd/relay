import { CalendarPlus } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { GameViewMenu } from "./game-view-menu";

export function GamesCollectionHeader({ title }: { title: string }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
      <h1 className="app-title min-w-0">{title}</h1>
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="sm:hidden">
          <GameViewMenu />
        </div>
        <ButtonLink href="/games/new">
          <CalendarPlus aria-hidden size={17} />
          Create game
        </ButtonLink>
      </div>
    </header>
  );
}
