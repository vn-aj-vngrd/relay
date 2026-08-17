import { Skeleton } from "@/components/shared/skeleton";

export default function NotificationsLoading() {
  return <div role="status" className="mx-auto max-w-3xl" aria-label="Loading notifications" aria-busy="true">
    <header className="flex items-end justify-between border-b border-line pb-6"><div><Skeleton className="h-8 w-44" /><Skeleton className="mt-2 h-3.5 w-24" /></div><Skeleton className="h-9 w-28" /></header>
    <div className="flex border-b border-line py-3"><Skeleton className="h-5 w-10" /><Skeleton className="ml-6 h-5 w-16" /></div>
    <section className="pt-7"><Skeleton className="h-3 w-12" /><div className="mt-2 divide-y divide-line border-y border-line">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex min-h-20 items-start gap-3 px-1 py-4 sm:px-3"><Skeleton className="h-9 w-9 shrink-0 rounded-full" /><div className="min-w-0 flex-1"><Skeleton className="h-4 w-40 max-w-full" /><Skeleton className="mt-2 h-3.5 w-80 max-w-full" /></div><Skeleton className="h-3 w-10 shrink-0" /></div>)}</div></section>
  </div>;
}
