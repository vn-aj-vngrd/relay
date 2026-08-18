import { GamePageIntro } from "@/components/shared/game-page-intro";
import { Skeleton } from "@/components/shared/skeleton";

export default function PlayLoading() {
  return <><GamePageIntro title="Play" description="Court assignments, scores, partner rotations, and who plays next." /><div role="status" aria-label="Loading Play" aria-busy="true" className="mx-auto max-w-2xl py-8"><div className="text-center"><Skeleton className="mx-auto h-7 w-7 rounded-full" /><Skeleton className="mx-auto mt-4 h-7 w-64" /><Skeleton className="mx-auto mt-3 h-4 w-full max-w-md" /></div><div className="mt-8 divide-y divide-line border-y border-line">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex min-h-20 items-center gap-3 py-4"><Skeleton className="h-9 w-9 rounded-lg" /><div className="flex-1"><Skeleton className="h-4 w-36" /><Skeleton className="mt-2 h-3.5 w-4/5" /></div><Skeleton className="h-4 w-4 rounded-full" /></div>)}</div><div className="mt-6 flex items-center justify-between border-t border-line pt-5"><Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-24" /></div></div></>;
}
