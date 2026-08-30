import { Skeleton } from "@/components/shared/skeleton";

export default function EditGroupLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <Skeleton className="h-4 w-56" />
      <div role="status" aria-label="Loading group editor" aria-busy="true" className="max-w-2xl pt-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        <div className="mt-8 space-y-6">
          <div>
            <Skeleton className="h-4 w-24" />
            <div className="mt-3 flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-11 w-full rounded-lg" />
          </div>
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-24 w-full rounded-lg" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
