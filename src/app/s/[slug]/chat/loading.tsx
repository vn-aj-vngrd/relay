import { Skeleton } from "@/components/shared/skeleton";

export default function PublicChatLoading() {
  return (
    <main
      id="main-content"
      className="public-session-page public-chat-page min-h-0 overflow-hidden bg-surface"
    >
      <div
        role="status"
        aria-label="Loading session chat"
        aria-busy="true"
        className="public-chat-panel mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col bg-surface px-4 py-4 sm:px-6 sm:py-8"
      >
        <div className="min-w-0">
          <Skeleton className="public-tab-title h-8 w-20" />
          <Skeleton className="public-tab-description mt-2 h-3.5 w-72 max-w-[70vw]" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:mt-5 sm:rounded-xl sm:border sm:border-line">
          <div className="min-h-0 flex-1 overflow-hidden py-5 sm:px-3">
            <div className="mx-auto mb-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <Skeleton className="h-3 w-16" />
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div>
                  <Skeleton className="mb-1 h-3 w-20" />
                  <Skeleton className="h-14 w-56 max-w-[65vw] rounded-2xl" />
                </div>
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-11 w-48 max-w-[60vw] rounded-2xl" />
              </div>
              <div className="flex items-end gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-20 w-64 max-w-[70vw] rounded-2xl" />
              </div>
            </div>
          </div>
          <div className="shrink-0 border-t border-line pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-3">
            <div className="flex items-end gap-2">
              <Skeleton className="h-11 w-11" />
              <Skeleton className="h-11 flex-1" />
              <Skeleton className="h-11 w-11" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
