import { Skeleton } from "@/components/shared/skeleton";
import { SessionAtAGlanceSkeleton } from "@/features/sessions/session-overview";

function JoinPanelSkeleton({ mobile = false }: { mobile?: boolean }) {
  return <div className={mobile ? "public-session-section border-b border-line lg:hidden" : "public-session-panel hidden self-start bg-surface p-5 sm:rounded-xl sm:border sm:border-line lg:block"}>
    <div className={`flex items-start justify-between gap-4 ${mobile ? "mb-5" : "mb-5 border-b border-line pb-5"}`}><div className="space-y-2"><Skeleton className="h-5 w-28" /><Skeleton className="h-3.5 w-32" /></div><Skeleton className="h-4 w-20" /></div>
    <Skeleton className="h-3.5 w-20" /><Skeleton className="mt-2 h-12 w-full" /><Skeleton className="mt-2 h-3 w-4/5" />
    <div className="mt-3 grid grid-cols-3 gap-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div><Skeleton className="mt-3 h-10 w-full" /><Skeleton className="mx-auto mt-5 h-4 w-24" />
  </div>;
}

export default function PublicPlanLoading() {
  return <main id="main-content" className="public-session-page min-h-screen bg-canvas" aria-label="Loading game plan" aria-busy="true"><div className="mx-auto grid max-w-[1040px] gap-6 pb-12 sm:px-6 sm:pt-8 lg:grid-cols-[1fr_350px]">
    <article className="public-session-panel min-w-0 overflow-hidden bg-surface sm:rounded-xl sm:border sm:border-line"><div className="public-session-hero min-h-48 bg-canvas px-5 pb-8 pt-7 sm:min-h-52 sm:px-8 sm:pb-10"><Skeleton className="h-3 w-36" /><Skeleton className="mt-8 h-10 w-3/4" /><Skeleton className="mt-3 h-4 w-32" /></div><div className="public-session-content px-5 py-6 sm:px-8 sm:py-8"><div className="public-session-plan grid grid-cols-2 gap-x-4 gap-y-6 border-b border-line">{Array.from({ length: 4 }, (_, index) => <div key={index} className={`flex gap-3 ${index < 2 ? "col-span-2 sm:col-span-1" : "col-span-2 min-[360px]:col-span-1"}`}><Skeleton className="h-5 w-5 shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3.5 w-1/2" /></div></div>)}</div><SessionAtAGlanceSkeleton /><JoinPanelSkeleton mobile /><div className="public-session-section"><div className="flex justify-between"><div className="space-y-2"><Skeleton className="h-5 w-32" /><Skeleton className="h-3.5 w-40" /></div><Skeleton className="h-9 w-24 rounded-full" /></div><div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex items-center gap-2.5"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-3.5 w-20" /></div>)}</div></div></div></article>
    <JoinPanelSkeleton />
  </div></main>;
}
