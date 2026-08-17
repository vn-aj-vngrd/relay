import { Skeleton } from "@/components/shared/skeleton";

export default function SearchLoading() {
  return <div role="status" className="mx-auto max-w-3xl" aria-label="Loading search" aria-busy="true"><Skeleton className="h-8 w-40" /><Skeleton className="mt-3 h-4 w-80 max-w-full" /><Skeleton className="mt-6 h-12 w-full" /><div className="mt-3 flex gap-5 border-b border-line pb-3">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-4 w-12" />)}</div><div className="mt-6 divide-y divide-line border-y border-line">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex min-h-16 items-center gap-3 py-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="mt-2 h-3 w-64 max-w-full" /></div></div>)}</div></div>;
}
