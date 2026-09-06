import { requireUser } from "@/features/auth/session";
import {
  defaultGroupFilters,
  parseGroupFilters,
} from "@/features/groups/filters";
import { GroupCollection } from "@/features/groups/group-collection";
import { GroupsHeader } from "@/features/groups/groups-header";
import { getGroupCollectionPage } from "@/features/groups/queries";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  const parsed = parseGroupFilters({
    get: (key) => {
      const value = params[key];
      return (Array.isArray(value) ? value[0] : value) ?? null;
    },
  });
  const filters = parsed.success ? parsed.data : defaultGroupFilters;
  const page = parsed.success
    ? await getGroupCollectionPage(user.id, null, filters)
    : { items: [], nextCursor: null };
  return (
    <div>
      <GroupsHeader />
      <GroupCollection
        items={page.items}
        nextCursor={page.nextCursor}
        filters={filters}
        error={
          parsed.success
            ? undefined
            : "These filters are invalid. Clear filters and try again."
        }
      />
    </div>
  );
}
