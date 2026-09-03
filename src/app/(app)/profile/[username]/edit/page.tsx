import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { profileAvatarUrl } from "@/features/players/avatar";
import { ProfileAvatarEditor } from "@/features/players/profile-avatar-editor";
import { ProfileDetailsForm } from "@/features/players/profile-details-form";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await requireUser(`/profile/${username}/edit`);
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  });
  if (!profile || profile.userId !== user.id) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex items-center gap-2 border-b border-line pb-5">
        <Link
          href={`/profile/${profile.username}`}
          aria-label="Back to profile"
          className="pressable -ml-3 grid h-10 w-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
        >
          <ArrowLeft aria-hidden size={18} />
        </Link>
        <h1 className="app-title">Edit profile</h1>
      </header>

      <div className="pt-6">
        <section
          aria-labelledby="profile-photo-title"
          className="flex items-center gap-4 pb-6"
        >
          <ProfileAvatarEditor
            name={profile.name}
            imageUrl={profileAvatarUrl(profile.avatarPath)}
          />
          <div>
            <h2 id="profile-photo-title" className="text-sm font-semibold">
              Profile photo
            </h2>
            <p className="mt-1 text-sm text-muted">
              Choose the photo friends will recognize.
            </p>
          </div>
        </section>
        <ProfileDetailsForm profile={profile} />
        <section
          aria-labelledby="profile-security-title"
          className="border-b border-line py-6"
        >
          <h2 id="profile-security-title" className="text-sm font-semibold">
            Account security
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Change your password or send yourself a recovery link if you no
            longer know it.
          </p>
          <ButtonLink
            href="/preferences/password"
            variant="secondary"
            className="mt-4"
          >
            Change password
          </ButtonLink>
        </section>
      </div>
    </div>
  );
}
