import { Skeleton } from "@/components/shared/skeleton";

export default function AdminInsightsLoading() {
  return (
    <div role="status" aria-label="Loading insights" aria-busy="true">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      <div className="mt-8 flex gap-5 border-b border-line pb-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
      {Array.from({ length: 3 }, (_, section) => (
        <section key={section} className="border-b border-line py-9">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-3.5 w-80 max-w-full" />
          <div className="mt-4 divide-y divide-line border-y border-line">
            {Array.from({ length: section === 0 ? 6 : 3 }, (__, row) => (
              <div key={row} className="flex min-h-12 items-center justify-between gap-4 py-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
