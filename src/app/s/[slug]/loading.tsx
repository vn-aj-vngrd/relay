import { Skeleton } from "@/components/shared/skeleton";

function JoinSkeleton({ mobile = false }: { mobile?: boolean }) {
  return <div className={mobile ? "border-b border-line px-5 py-5 lg:hidden" : "hidden self-start bg-surface p-5 sm:rounded-xl sm:border sm:border-line lg:block"}>
    <Skeleton className="h-8 w-36" />
    <Skeleton className="mt-2 h-3.5 w-52" />
    <Skeleton className="mt-5 h-3.5 w-20" />
    <Skeleton className="mt-2 h-12 w-full" />
    <div className="mt-3 grid grid-cols-3 gap-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
    <Skeleton className="mt-3 h-12 w-full" />
    <Skeleton className="mx-auto mt-5 h-4 w-24" />
  </div>;
}

export default function PublicSessionLoading() {
  return <main id="main-content" className="min-h-screen bg-canvas" aria-label="Loading public session" aria-busy="true">
    <header className="border-b border-line bg-surface"><div className="mx-auto flex h-16 max-w-[1040px] items-center justify-between px-4 sm:px-6"><div className="flex items-center gap-2.5"><Skeleton className="h-7 w-7 rounded-full" /><Skeleton className="h-5 w-14" /></div><div className="flex items-center gap-3"><Skeleton className="h-10 w-10" /><Skeleton className="h-4 w-14" /></div></div></header>
    <div className="overflow-hidden border-b border-line bg-surface px-4 py-3 sm:px-6"><div className="mx-auto flex max-w-[1040px] gap-1 rounded-lg bg-surface-strong p-1"><Skeleton className="h-8 w-16 bg-surface" /><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-18" /><Skeleton className="h-8 w-16" /><Skeleton className="h-8 w-24" /></div></div>
    <div className="mx-auto grid max-w-[1040px] gap-6 pb-12 sm:px-6 sm:pt-8 lg:grid-cols-[1fr_350px]">
      <article className="overflow-hidden bg-surface sm:rounded-xl sm:border sm:border-line">
        <div className="h-48 bg-court px-5 py-7 sm:h-52 sm:px-8"><Skeleton className="h-3 w-36 bg-white/15" /><Skeleton className="mt-8 h-10 w-3/4 bg-white/15" /><Skeleton className="mt-3 h-4 w-32 bg-white/10" /></div>
        <JoinSkeleton mobile />
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid gap-5 border-b border-line pb-7 sm:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex gap-3"><Skeleton className="h-5 w-5 shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3.5 w-1/2" /></div></div>)}</div>
          <div className="py-7"><div className="flex items-start justify-between"><div className="space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-3.5 w-40" /></div><div className="flex -space-x-2"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-9 w-9 rounded-full" /></div></div><div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex items-center gap-2.5"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-3.5 w-20" /></div>)}</div></div>
        </div>
      </article>
      <JoinSkeleton />
    </div>
  </main>;
}
