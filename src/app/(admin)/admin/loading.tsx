import { Skeleton } from "@/components/shared/skeleton";

export default function AdminLoading() {
  return (
    <div aria-label="Loading admin console" role="status">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="mt-3 h-9 w-72" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-8 grid border-y border-line py-5 sm:grid-cols-3 sm:gap-8">
        <div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-9 w-16" />
        </div>
        <div className="mt-6 sm:mt-0">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-9 w-16" />
        </div>
        <div className="mt-6 sm:mt-0">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-9 w-16" />
        </div>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <Skeleton className="h-6 w-40" />
          <div className="mt-3 space-y-1 border-y border-line py-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </section>
        <section>
          <Skeleton className="h-6 w-48" />
          <div className="mt-3 space-y-1 border-y border-line py-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </section>
      </div>
    </div>
  );
}
