import { Skeleton } from "@/components/shared/skeleton";

import { LiveCourtSkeleton } from "./live-court-skeleton";

export function PlaySkeleton({
  canScore = true,
  label,
}: {
  canScore?: boolean;
  label: string;
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      <div className="mb-7 flex gap-2 overflow-hidden sm:mb-8">
        {["w-20", "w-18", "w-20", "w-24"].map((width, index) => (
          <Skeleton
            key={`${width}-${index}`}
            className={`h-9 shrink-0 rounded-full ${width}`}
          />
        ))}
      </div>
      <section className="min-w-0">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-2 h-3.5 w-64 max-w-full" />
        <div className="mt-4">
          <LiveCourtSkeleton canScore={canScore} />
        </div>
      </section>
    </div>
  );
}
