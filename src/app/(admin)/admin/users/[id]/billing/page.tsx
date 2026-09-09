import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { billingMedia, users } from "@/db/schema";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { requireAdmin } from "@/features/admin/auth";
import { billingDate, storageLabel } from "@/features/billing/domain";
import {
  AccountOverrideForm,
  ComplimentaryProForm,
  StalledUploadForm,
} from "@/features/billing/forms";
import { PlanUsage } from "@/features/billing/presentation";
import { getAccountUsage } from "@/features/billing/usage";

export default async function AdminAccountBillingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const user = await db.query.users.findFirst({ where: eq(users.id, id.data) });
  if (!user) notFound();
  const [usage, reservations] = await Promise.all([
    getAccountUsage(user.id),
    db.query.billingMedia.findMany({
      where: and(
        eq(billingMedia.hostId, user.id),
        eq(billingMedia.status, "reserved")
      ),
      orderBy: asc(billingMedia.createdAt),
      limit: 20,
    }),
  ]);
  return (
    <div>
      <AdminPageHeading
        title="Plan & allowances"
        description={user.email}
        action={
          <ButtonLink href={`/admin/users/${user.id}`} variant="secondary">
            Account details
          </ButtonLink>
        }
      />
      <div className="flex flex-col gap-10">
        <PlanUsage usage={usage} />
        <section aria-labelledby="account-overrides-title">
          <h2
            id="account-overrides-title"
            className="mb-4 text-lg font-semibold"
          >
            Account overrides
          </h2>
          <AccountOverrideForm
            userId={user.id}
            override={
              usage.override
                ? {
                    games: usage.override.games,
                    storageBytes: usage.override.storageBytes,
                    expiresAt: usage.override.expiresAt?.toISOString() ?? null,
                  }
                : null
            }
          />
        </section>
        <section
          aria-labelledby="complimentary-pro-title"
          className="border-t border-line pt-6"
        >
          <h2
            id="complimentary-pro-title"
            className="mb-4 text-lg font-semibold"
          >
            Complimentary Pro
          </h2>
          <ComplimentaryProForm userId={user.id} />
        </section>
        {reservations.length ? (
          <section aria-labelledby="stalled-uploads-title">
            <h2 id="stalled-uploads-title" className="text-lg font-semibold">
              Incomplete uploads
            </h2>
            <p className="mt-2 text-sm text-muted">
              Up to 20 oldest reservations. Cleanup confirms storage deletion
              before releasing bytes.
            </p>
            {reservations.map((media) => (
              <details
                key={media.id}
                className="mt-4 border-b border-line pb-4"
              >
                <summary className="cursor-pointer text-sm font-semibold">
                  {media.kind} · {storageLabel(media.bytes)} ·{" "}
                  {billingDate(media.createdAt)} (PH)
                </summary>
                <div className="mt-4">
                  <StalledUploadForm id={media.id} />
                </div>
              </details>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}
