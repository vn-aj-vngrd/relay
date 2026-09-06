import { GroupResultsSkeleton } from "@/features/groups/group-collection";
import { GroupsHeader } from "@/features/groups/groups-header";
import { GroupsLoadingFilterRail } from "@/features/groups/groups-loading-filter-rail";

export default function GroupsLoading() {
  return (
    <div>
      <GroupsHeader />
      <GroupsLoadingFilterRail />
      <GroupResultsSkeleton />
    </div>
  );
}
