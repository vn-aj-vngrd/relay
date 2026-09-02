import { Plus } from "@phosphor-icons/react/dist/ssr";

import { Skeleton } from "@/components/shared/skeleton";
import { ButtonLink } from "@/components/ui/button";
import { GroupDesktopViewControls, GroupViewMenu } from "@/features/groups/group-collection";
import { GroupsLoadingFilterRail } from "@/features/groups/groups-loading-filter-rail";

export default function GroupsLoading() {
  return (
    <div>
      <header className="flex items-center justify-between gap-4">
        <h1 className="app-title">Groups</h1>
        <GroupViewMenu />
      </header>
      <div className="mt-4 sm:mt-5">
        <div className="mb-6 flex min-w-0 items-center gap-3 pb-3">
          <div className="min-w-0 flex-1">
            <GroupsLoadingFilterRail />
          </div>
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <GroupDesktopViewControls />
            <ButtonLink href="/groups/new">
              <Plus aria-hidden size={16} />
              Create group
            </ButtonLink>
          </div>
        </div>
      </div>
      <div role="status" aria-label="Loading groups" aria-busy="true">
        <div className="divide-y divide-line border-y border-line">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="flex min-h-[4.5rem] items-center gap-3 py-3.5 sm:min-h-20 sm:gap-4 sm:px-3 sm:py-4"
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-full sm:h-11 sm:w-11" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40 max-w-[70%]" />
                <Skeleton className="mt-2 h-3.5 w-64 max-w-[85%]" />
              </div>
              <Skeleton className="hidden h-3 w-12 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
