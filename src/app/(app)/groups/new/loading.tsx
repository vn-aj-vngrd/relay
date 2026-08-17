import { Skeleton } from "@/components/shared/skeleton";

export default function NewGroupLoading() {
  return <div role="status" className="mx-auto max-w-xl" aria-label="Loading group form" aria-busy="true"><Skeleton className="h-4 w-28" /><Skeleton className="mt-7 h-9 w-52" /><Skeleton className="mt-3 h-4 w-full max-w-md" /><div className="mt-8 space-y-6"><div><Skeleton className="h-4 w-24" /><Skeleton className="mt-2 h-11 w-full" /></div><div><Skeleton className="h-4 w-32" /><Skeleton className="mt-2 h-24 w-full" /></div><Skeleton className="h-9 w-28" /></div></div>;
}
