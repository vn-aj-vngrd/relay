import {
  ArrowLeft,
  Compass,
  EnvelopeSimple,
  MapPin,
  PencilSimple,
  TennisBall,
  UserCircle,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ButtonLink } from "@/components/ui/button";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { requireAdmin } from "@/features/admin/auth";
import { ModerationControl } from "@/features/admin/moderation-control";
import { OnboardingResetControl } from "@/features/admin/onboarding-reset-control";
import { AdminDate, AdminStatus } from "@/features/admin/presentation";
import { getAdminUser } from "@/features/admin/queries";
import { discoverySourceLabel } from "@/features/onboarding/discovery-source";
import { playingExperienceLabel } from "@/features/players/playing-experience";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  const [admin, account] = await Promise.all([requireAdmin(), getAdminUser(parsed.data)]);
  if (!account) notFound();
  const { user, profile } = account;

  return (
    <div>
      <Link
        href="/admin/users"
        className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden size={16} />
        All users
      </Link>
      <AdminPageHeading
        title={profile?.name ?? "Unfinished profile"}
        description={user.email}
        action={
          <div className="flex items-center gap-3">
            <AdminStatus value={user.suspendedAt ? "suspended" : "active"} />
            <ButtonLink href={`/admin/users/${user.id}/edit`} variant="secondary">
              <PencilSimple aria-hidden size={16} />
              Edit profile
            </ButtonLink>
          </div>
        }
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="account-details">
          <h2 id="account-details" className="text-lg font-bold">
            Account details
          </h2>
          <dl className="mt-3 divide-y divide-line border-y border-line">
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="flex items-center gap-2 text-sm text-muted">
                <EnvelopeSimple size={17} />
                Email
              </dt>
              <dd className="break-all text-sm font-medium">{user.email}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="flex items-center gap-2 text-sm text-muted">
                <UserCircle size={17} />
                Username
              </dt>
              <dd className="text-sm font-medium">
                {profile ? (
                  <Link href={`/profile/${profile.username}`} className="text-primary">
                    @{profile.username}
                  </Link>
                ) : (
                  "Not set"
                )}
              </dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="flex items-center gap-2 text-sm text-muted">
                <MapPin size={17} />
                City
              </dt>
              <dd className="text-sm font-medium">{profile?.city ?? "Not set"}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="flex items-center gap-2 text-sm text-muted">
                <Compass size={17} />
                Discovered via
              </dt>
              <dd className="text-sm font-medium">{discoverySourceLabel(profile?.discoverySource)}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="flex items-center gap-2 text-sm text-muted">
                <TennisBall size={17} />
                Experience
              </dt>
              <dd className="text-sm font-medium">{playingExperienceLabel(profile?.skillLevel)}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="text-sm text-muted">Setup completed</dt>
              <dd>
                {profile?.onboardingCompletedAt ? (
                  <AdminDate value={profile.onboardingCompletedAt} includeTime />
                ) : (
                  "Not yet"
                )}
              </dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="text-sm text-muted">Tour completed</dt>
              <dd>
                {profile?.productTourCompletedAt ? (
                  <AdminDate value={profile.productTourCompletedAt} includeTime />
                ) : (
                  "Not yet"
                )}
              </dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 py-4">
              <dt className="text-sm text-muted">Registered</dt>
              <dd>
                <AdminDate value={user.createdAt} includeTime />
              </dd>
            </div>
          </dl>

          {user.suspendedAt ? (
            <div className="mt-8 border-y border-line py-5">
              <h3 className="font-semibold text-danger">Suspension details</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{user.suspensionReason ?? "No reason recorded."}</p>
              <p className="mt-2 text-xs text-muted">
                Suspended <AdminDate value={user.suspendedAt} includeTime />
              </p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-muted">Participation</h2>
            <dl className="mt-3 grid grid-cols-2 divide-x divide-line border-y border-line">
              <div className="py-4 pr-4">
                <dt className="text-xs text-muted">Hosted</dt>
                <dd className="score mt-1 text-2xl font-bold">{account.hostedCount}</dd>
              </div>
              <div className="py-4 pl-4">
                <dt className="text-xs text-muted">Joined</dt>
                <dd className="score mt-1 text-2xl font-bold">{account.joinedCount}</dd>
              </div>
            </dl>
          </section>
          <section className="border-t border-line pt-5">
            <h2 className="text-sm font-semibold">Onboarding</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Queue profile setup and the product tour for the next time this user opens Relay.
            </p>
            <div className="mt-4">
              {profile ? (
                <OnboardingResetControl
                  targetId={user.id}
                  queued={!profile.onboardingCompletedAt && !profile.productTourCompletedAt}
                />
              ) : (
                <p className="text-sm font-medium text-muted">A profile is required before onboarding can start.</p>
              )}
            </div>
          </section>
          <section className="border-t border-line pt-5">
            <h2 className="text-sm font-semibold">Account access</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Actions are reversible and always written to the audit log.
            </p>
            <div className="mt-4">
              {admin.id === user.id ? (
                <p className="text-sm font-medium text-muted">You cannot change your own access.</p>
              ) : (
                <ModerationControl mode={user.suspendedAt ? "restore-user" : "suspend-user"} targetId={user.id} />
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
