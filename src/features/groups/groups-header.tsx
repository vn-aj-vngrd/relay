import { Plus } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { GroupViewMenu } from "./group-collection";

export function GroupsHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <h1 className="app-title">Groups</h1>
      <div className="flex items-center gap-3">
        <div className="sm:hidden">
          <GroupViewMenu />
        </div>
        <ButtonLink href="/groups/new" className="hidden sm:inline-flex">
          <Plus aria-hidden size={16} />
          Create group
        </ButtonLink>
      </div>
    </header>
  );
}
