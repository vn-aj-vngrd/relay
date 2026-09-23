import { LoadingState } from "@/components/shared/content-state";
import { Skeleton } from "@/components/shared/skeleton";

export function AgentChatSkeleton() {
  return (
    <div
      role="status"
      aria-label="Restoring chat"
      className="space-y-7 motion-reduce:[&_*]:animate-none"
    >
      <LoadingState
        compact
        announce={false}
        label="Restoring chat"
        className="col-span-full"
      />

      <Skeleton className="mx-auto h-3 w-24" />
      <Skeleton className="ml-auto h-10 w-48 max-w-[75%] rounded-2xl" />
      <div className="space-y-3" aria-hidden>
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="ml-auto h-10 w-36 max-w-[75%] rounded-2xl" />
    </div>
  );
}
