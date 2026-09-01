import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Skeleton } from "@/components/shared/skeleton";
import { CreateGameProgress } from "@/features/sessions/create-game-progress";

function PendingField({ label }: { label: string }) {
  return (
    <div>
      <p className="text-sm font-[650]">{label}</p>
      <Skeleton className="mt-1.5 h-11 w-full rounded-lg" />
    </div>
  );
}

export default function NewGameLoading() {
  return (
    <div className="create-game-page w-full">
      <div className="create-game-mobile-header -mx-4 mb-6 flex h-14 items-center gap-1 border-b border-line px-1 sm:-mx-8 sm:px-5 lg:hidden">
        <Link
          href="/home"
          aria-label="Back to Home"
          className="pressable grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
        >
          <ArrowLeft aria-hidden size={18} />
        </Link>
        <p className="text-sm font-semibold text-ink">Create a game</p>
      </div>

      <Link
        href="/home"
        className="compact-sidebar-back pressable mb-5 hidden min-h-9 items-center gap-2 rounded-md px-2 text-[13px] font-semibold text-muted hover:bg-surface-strong hover:text-ink lg:inline-flex"
      >
        <ArrowLeft aria-hidden size={15} />
        Back to Home
      </Link>
      <header className="mb-10 hidden border-b border-line pb-7 lg:block">
        <h1 className="app-title">Create a game</h1>
      </header>

      <div className="mx-auto w-full max-w-2xl lg:mt-9">
        <CreateGameProgress step={1} />
        <section role="status" aria-label="Loading game details" aria-busy="true" className="space-y-6">
          <div>
            <h2 className="text-xl font-[680]">The plan</h2>
            <p className="mt-1 text-sm text-muted">
              Start with what players need to recognize the game and arrive on time.
            </p>
          </div>
          <PendingField label="Game name" />
          <PendingField label="Court" />
          <PendingField label="Date" />
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-4">
            <PendingField label="Start time" />
            <PendingField label="End time" />
          </div>
        </section>
      </div>
    </div>
  );
}
