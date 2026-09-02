import { Skeleton } from "@/components/shared/skeleton";

export function ProfileHeaderSkeleton() {
  return (
    <header aria-label="Loading player details" aria-busy="true" className="flex items-start gap-4 pb-7">
      <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2 pt-1">
        <Skeleton className="h-7 w-48 max-w-full" />
        <Skeleton className="h-3.5 w-32 max-w-full" />
      </div>
    </header>
  );
}

export function ProfileStatSkeleton() {
  return <Skeleton className="mx-auto mb-1 h-7 w-10" />;
}
