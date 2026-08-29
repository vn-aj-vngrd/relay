import { Skeleton } from "@/components/shared/skeleton";

export default function PublicPaymentsLoading() {
  return (
    <main id="main-content" className="public-session-page min-h-screen bg-surface">
      <div
        role="status"
        aria-label="Loading payment details"
        aria-busy="true"
        className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8"
      >
        <Skeleton className="public-tab-title h-8 w-44" />
        <Skeleton className="public-tab-description mt-2 h-3.5 w-[30rem] max-w-full" />
        <section className="public-session-section grid min-w-0 gap-6 border-y border-line sm:mt-8 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="mt-2 h-9 w-32" />
            <Skeleton className="mt-2 h-3.5 w-40" />
            <div className="mt-5 border-t border-line pt-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-3.5 w-52 max-w-full" />
              <Skeleton className="mt-2 h-3.5 w-36" />
            </div>
            <Skeleton className="mt-6 h-11 w-full" />
          </div>
          <Skeleton className="aspect-square w-full max-w-[220px] justify-self-center bg-surface-strong" />
        </section>
      </div>
    </main>
  );
}
