import { GamePageIntro } from "@/components/shared/game-page-intro";
import { Skeleton } from "@/components/shared/skeleton";

export default function PlaySetupLoading() {
  return (
    <>
      <GamePageIntro
        title="Set up Play"
        description="Confirm arrivals, choose the court flow, and begin the first rotation."
      />
      <div
        role="status"
        aria-label="Loading Play setup"
        aria-busy="true"
        className="mx-auto w-full max-w-2xl pb-8 sm:pt-6"
      >
        <section>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-2 h-3.5 w-80 max-w-full" />
          <div className="mt-3 grid border-y border-line sm:grid-cols-2 sm:gap-x-6">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="flex min-h-14 items-center justify-between gap-3 py-2"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </section>
        <section className="mt-10">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="mt-2 h-3.5 w-96 max-w-full" />
          <div className="mt-8 divide-y divide-line border-y border-line">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="flex min-h-20 items-center gap-3 py-4"
              >
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3.5 w-72 max-w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
