import { Skeleton } from "@/components/shared/skeleton";
import { SessionAtAGlanceSkeleton } from "@/features/sessions/session-overview";

export default function SessionLoading() {
  return <div aria-label="Loading session" aria-busy="true">
    <div className="mb-2 flex items-center justify-between gap-4"><div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3.5 w-52" /></div><div className="flex gap-2"><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-20" /></div></div>
    <div className="h-11 border-b border-line" />
    <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <article className="public-session-panel overflow-hidden rounded-xl border border-line"><div className="min-h-48 bg-canvas px-5 py-7 sm:px-8"><Skeleton className="h-3 w-40" /><Skeleton className="mt-8 h-10 w-3/4" /><Skeleton className="mt-3 h-4 w-32" /></div><div className="px-5 py-6 sm:px-8 sm:py-8"><div className="grid grid-cols-2 gap-x-4 gap-y-6 border-b border-line pb-7">{Array.from({ length: 4 }, (_, index) => <div key={index} className={`flex gap-3 ${index < 2 ? "col-span-2 sm:col-span-1" : "col-span-2 min-[360px]:col-span-1"}`}><Skeleton className="h-5 w-5 shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3.5 w-1/2" /></div></div>)}</div><SessionAtAGlanceSkeleton /></div></article>
      <aside className="space-y-7"><div className="rounded-xl border border-line p-5"><Skeleton className="h-4 w-24" /><Skeleton className="mt-2 h-5 w-44" /><Skeleton className="mt-3 h-3.5 w-full" /><Skeleton className="mt-2 h-3.5 w-4/5" /><Skeleton className="mt-5 h-9 w-full" /></div><div><Skeleton className="h-5 w-32" /><Skeleton className="mt-2 h-3.5 w-24" /><div className="mt-3 divide-y divide-line border-y border-line">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex min-h-14 items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-3 w-10" /></div>)}</div></div></aside>
    </div>
  </div>;
}
