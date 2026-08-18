import { Skeleton } from "@/components/shared/skeleton";

export default function NewGameLoading() {
  return <div role="status" className="w-full" aria-label="Loading game form" aria-busy="true"><Skeleton className="h-9 w-24" /><div className="mt-5 space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-full max-w-md" /></div><div className="mt-9 space-y-6"><Skeleton className="h-5 w-28" />{Array.from({ length: 5 }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-11 w-full" /></div>)}</div></div>;
}
