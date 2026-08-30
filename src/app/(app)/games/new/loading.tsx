import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Skeleton } from "@/components/shared/skeleton";

export default function NewGameLoading() {
  return (
    <div role="status" className="create-game-page w-full" aria-label="Loading game form" aria-busy="true">
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

      <div className="hidden lg:block">
        <Skeleton className="h-9 w-24" />
        <div className="mt-5 space-y-2 border-b border-line pb-7">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>

      <div className="space-y-6 lg:mt-9">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
