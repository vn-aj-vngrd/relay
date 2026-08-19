import { RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function ProfileLoading() {
  return (
    <div role="status" className="mx-auto w-full max-w-6xl" aria-label="Loading profile" aria-busy="true">
      <div className="flex items-center gap-4 pb-7">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-8 border-y border-line py-5">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <div className="mt-10">
        <Skeleton className="mb-3 h-5 w-32" />
        <RowsSkeleton rows={3} />
      </div>
    </div>
  );
}
