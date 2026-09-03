import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { AppBreadcrumbs } from "@/components/shared/app-breadcrumbs";
import { db } from "@/db/client";
import { groups } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { EditGroupForm } from "@/features/groups/edit-group-form";
import { groupImageUrl } from "@/features/groups/image";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const slug = (await params).slug;
  const group = await db.query.groups.findFirst({
    where: and(eq(groups.slug, slug), eq(groups.ownerId, user.id)),
  });
  if (!group) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AppBreadcrumbs
        items={[
          { href: "/groups", label: "Groups" },
          { href: `/groups/${slug}`, label: group.name },
          { label: "Edit" },
        ]}
      />
      <div className="max-w-2xl pt-5 sm:pt-8">
        <h1 className="app-title">Edit group</h1>
        <p className="mt-2 max-w-xl text-muted">
          Update the crew’s name, description, and group photo.
        </p>
        <EditGroupForm
          group={{
            id: group.id,
            slug: group.slug,
            name: group.name,
            description: group.description,
          }}
          imageUrl={groupImageUrl(group.imagePath)}
        />
      </div>
    </div>
  );
}
