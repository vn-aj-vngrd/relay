import { GamePageIntro } from "@/components/shared/game-page-intro";
import { Skeleton } from "@/components/shared/skeleton";

export default function ChatLoading() {
  return (
    <div className="authenticated-chat-page flex h-full min-h-0 flex-col overflow-hidden">
      <GamePageIntro
        title="Chat"
        description="Plans, updates, and photos from the group."
      />
      <div
        role="status"
        aria-label="Loading chat"
        aria-busy="true"
        className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden sm:rounded-xl sm:border sm:border-line"
      >
        <div className="min-h-0 flex-1 space-y-5 py-5 sm:px-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-px flex-1" />
          </div>
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-16 w-56 rounded-xl" />
            </div>
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-48 rounded-xl" />
          </div>
        </div>
        <div className="flex items-end gap-2 border-t border-line bg-surface pb-3 pt-3 sm:px-3">
          <Skeleton className="h-11 w-11 rounded-lg" />
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-11 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
