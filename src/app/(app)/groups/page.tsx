import { Plus } from "@phosphor-icons/react/dist/ssr";

import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { GroupCollection, GroupViewMenu } from "@/features/groups/group-collection";
import { getGroupCollectionPage } from "@/features/groups/queries";

export default async function GroupsPage() {
  const user = await requireUser();
  const page = await getGroupCollectionPage(user.id);

  return (
    <div>
      <header className="flex items-center justify-between gap-4">
        <h1 className="app-title">Groups</h1>
        <GroupViewMenu />
        <span className="hidden sm:block">
          <ButtonLink href="/groups/new">
            <Plus aria-hidden size={16} />
            Create group
          </ButtonLink>
        </span>
      </header>
      <GroupCollection items={page.items} nextCursor={page.nextCursor} />
    </div>
  );
}
