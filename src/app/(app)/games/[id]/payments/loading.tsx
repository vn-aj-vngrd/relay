import { GamePageIntro } from "@/components/shared/game-page-intro";
import { Skeleton } from "@/components/shared/skeleton";

export default function PaymentsLoading() {
  return (
    <>
      <GamePageIntro
        title="Payments"
        description="Collect player shares and review proof. Relay tracks status only."
      />
      <div
        role="status"
        aria-label="Loading payments"
        aria-busy="true"
        className="grid gap-8 sm:pt-7 lg:grid-cols-[1fr_340px]"
      >
        <section>
          <div className="flex items-end justify-between border-b border-line pb-5">
            <div>
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="mt-2 h-8 w-40" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="divide-y divide-line">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="flex min-h-16 flex-wrap items-center gap-3 py-3"
              >
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-28 flex-1">
                  <Skeleton className="h-4 w-32 max-w-full" />
                  <Skeleton className="mt-2 h-3 w-24 max-w-full" />
                </div>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </section>
        <aside className="self-start rounded-lg border border-line bg-surface p-5 lg:sticky lg:top-6">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="mt-4 h-5 w-32" />
          <Skeleton className="mt-3 h-4 w-24" />
          <Skeleton className="mt-2 h-3.5 w-full" />
          <Skeleton className="mt-5 aspect-square w-full rounded-lg" />
          <Skeleton className="mt-5 h-3.5 w-4/5" />
        </aside>
      </div>
    </>
  );
}
