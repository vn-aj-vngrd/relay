import { Skeleton } from "@/components/shared/skeleton";

export function LiveCourtSkeleton({ canScore = true }: { canScore?: boolean }) {
  return <div className="overflow-hidden rounded-xl border border-line bg-surface">
    <div className="flex min-h-14 items-center justify-between gap-4 border-b border-line px-4">
      <div><Skeleton className="h-3 w-24" /><Skeleton className="mt-2 h-3 w-20" /></div>
      <div className="flex items-center gap-2"><Skeleton className="h-3 w-10" /><Skeleton className="h-10 w-10" /></div>
    </div>
    <div className="grid grid-cols-2 bg-[var(--scoreboard-field)]">
      {[0, 1].map((side) => <div key={side} className={side ? "court-rule border-l" : ""}>
        <div className="px-4 pb-5 pt-6 text-center"><Skeleton className="mx-auto h-4 w-28 max-w-full bg-white/15" /><Skeleton className="mx-auto mt-3 h-24 w-24 bg-white/15" /></div>
        {canScore ? <div className="court-rule grid grid-cols-2 border-t"><Skeleton className="h-16 rounded-none border-r border-white/10 bg-white/10" /><Skeleton className="h-16 rounded-none bg-white/10" /></div> : null}
      </div>)}
    </div>
    {canScore ? <div className="border-t border-line p-3"><Skeleton className="h-9 w-full" /></div> : null}
  </div>;
}
