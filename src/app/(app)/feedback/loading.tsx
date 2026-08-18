import { Skeleton } from "@/components/shared/skeleton";

export default function FeedbackLoading() {
  return (
    <div role="status" aria-label="Loading feedback" className="mx-auto w-full max-w-4xl">
      <header className="border-b border-line pb-6">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      </header>
      <div className="py-8">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        <div className="mt-5 border-y border-line py-6">
          <div className="space-y-1 border-y border-line py-1">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
          <div className="mt-6 grid gap-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
