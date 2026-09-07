import { GamePageIntro } from "@/components/shared/game-page-intro";
import { Skeleton } from "@/components/shared/skeleton";

export default function PaymentsLoading() {
  return (
    <>
      <GamePageIntro title="Payments" />
      <div
        role="status"
        aria-label="Loading payments"
        aria-busy="true"
        className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5 lg:col-span-2">
          <div>
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="mt-2 h-8 w-40" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        <section className="min-w-0">
          <h2 className="text-sm font-semibold">Player payments</h2>
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
        <aside className="min-w-0 border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h2 className="text-sm font-semibold">Expense breakdown</h2>
          <Skeleton className="mt-4 h-5 w-32" />
          <Skeleton className="mt-3 h-4 w-24" />
          <Skeleton className="mt-2 h-3.5 w-full" />
          <Skeleton className="mt-5 aspect-square w-full max-w-60 rounded-lg" />
          <Skeleton className="mt-5 h-3.5 w-4/5" />
        </aside>
      </div>
    </>
  );
}
