import { PageHeaderSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function HelpLoading() {
  return (
    <div role="status" className="mx-auto max-w-6xl" aria-label="Loading Help Center" aria-busy="true">
      <PageHeaderSkeleton />
      <Skeleton className="mt-5 h-11 w-full max-w-xl" />
      <div className="mt-8 border-y border-line py-6">
        <Skeleton className="h-5 w-56" />
        <div className="mt-5 grid gap-px bg-line sm:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-none bg-surface" />
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[190px_minmax(0,1fr)]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-36" />
          ))}
        </div>
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-3 h-5 w-full max-w-xl" />
          <Skeleton className="mt-7 aspect-[5/3] w-full rounded-xl" />
          <div className="mt-7 space-y-4 border-y border-line py-5">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
