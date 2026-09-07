import { Skeleton } from "@/components/shared/skeleton";

export default function PublicPaymentsLoading() {
  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
    >
      <div
        role="status"
        aria-label="Loading payment details"
        aria-busy="true"
        className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8"
      >
        <h1 className="sr-only">Your payment</h1>
        <section className="public-session-section grid min-w-0 gap-6 border-y border-line lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-8">
          <div className="border-b border-line pb-5 lg:col-span-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-8 w-32" />
          </div>
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
          <div className="min-w-0 border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <h2 className="text-sm font-semibold">Expense breakdown</h2>
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-6 aspect-square w-full max-w-60 bg-surface-strong" />
          </div>
        </section>
      </div>
    </main>
  );
}
