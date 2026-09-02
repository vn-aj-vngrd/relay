import { MagnifyingGlass, UserPlus } from "@phosphor-icons/react/dist/ssr";

import { ButtonLink } from "@/components/ui/button";
import { AdminInfiniteRecords } from "@/features/admin/admin-infinite-records";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { getAdminUsers } from "@/features/admin/queries";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.slice(0, 100) ?? "";
  const page = await getAdminUsers({ query });

  return (
    <div>
      <AdminPageHeading
        title="Users"
        description="Search production accounts, review participation, and manage access without exposing authentication credentials."
        action={
          <ButtonLink href="/admin/users/new">
            <UserPlus aria-hidden size={17} />
            Create user
          </ButtonLink>
        }
      />
      <form noValidate role="search" className="mb-5 flex max-w-xl items-center gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Search users</span>
          <MagnifyingGlass
            aria-hidden
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search name, username, or email"
            className="field !mt-0 !h-10 !pl-10 text-sm"
          />
        </label>
        <button className="pressable h-10 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white hover:bg-primary-hover">
          Search
        </button>
      </form>
      <AdminInfiniteRecords
        key={`users:${query}`}
        resource="users"
        initialPage={page}
        query={query}
        emptyMessage={query ? "No accounts match this search." : "No users have registered yet."}
      />
    </div>
  );
}
