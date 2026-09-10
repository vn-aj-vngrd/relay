import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { and, desc, eq, lt, ne, or } from "drizzle-orm";
import Image from "next/image";
import { z } from "zod";

import { ButtonLink } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { db } from "@/db/client";
import { billingMedia, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { storageLabel } from "@/features/billing/domain";
import {
  ParticipantImagesForm,
  RemoveHostedPhotoForm,
} from "@/features/billing/forms";
import { getAccountUsage } from "@/features/billing/usage";
import { UsageMeter } from "@/features/billing/usage-meter";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function HostedMediaPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string; id?: string; session?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const cursor = z
    .object({ before: z.iso.datetime(), id: z.uuid() })
    .safeParse(query);
  const date = cursor.success ? new Date(cursor.data.before) : null;
  const [usage, rows] = await Promise.all([
    getAccountUsage(user.id),
    db
      .select({ media: billingMedia, title: sessions.title })
      .from(billingMedia)
      .leftJoin(sessions, eq(sessions.id, billingMedia.sessionId))
      .where(
        and(
          eq(billingMedia.hostId, user.id),
          ne(billingMedia.status, "released"),
          cursor.success && date
            ? or(
                lt(billingMedia.createdAt, date),
                and(
                  eq(billingMedia.createdAt, date),
                  lt(billingMedia.id, cursor.data.id)
                )
              )
            : undefined
        )
      )
      .orderBy(desc(billingMedia.createdAt), desc(billingMedia.id))
      .limit(25),
  ]);
  const page = rows.slice(0, 24);
  const storage = createSupabaseAdminClient().storage;
  const photos = await Promise.all(
    page.map(async ({ media, title }) => {
      const result =
        media.status === "stored"
          ? await storage.from(media.bucket).createSignedUrl(media.path, 300)
          : null;
      return { media, title, url: result?.data?.signedUrl };
    })
  );
  const sessionId = z.uuid().safeParse(query.session);
  const session = sessionId.success
    ? await db.query.sessions.findFirst({
        where: and(
          eq(sessions.id, sessionId.data),
          eq(sessions.hostId, user.id)
        ),
      })
    : null;
  const last = page.at(-1)?.media;
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header>
        <div className="flex min-h-11 items-center gap-2">
          <ButtonLink
            href="/settings/plan"
            variant="quiet"
            aria-label="Back to Plan & billing"
            className="-ml-3 h-11 min-h-11 w-11 shrink-0 px-0"
          >
            <CaretLeft aria-hidden size={18} />
            <Tooltip content="Back to Plan & billing" />
          </ButtonLink>
          <h1 className="text-sm font-semibold text-ink">Hosted-game photos</h1>
        </div>
        <p className="mt-2 text-sm text-muted">
          Chat images and game photos from games you own, including player
          uploads. Removing a photo frees your storage and removes it for
          everyone.
        </p>
      </header>
      <section
        aria-labelledby="photo-storage-title"
        className="border-y border-line py-5"
      >
        <h2 id="photo-storage-title" className="mb-3 text-lg font-semibold">
          Photo storage
        </h2>
        <UsageMeter
          label="Photo storage used"
          used={usage.bytesUsed}
          limit={usage.storageBytes}
          unlimited={usage.storageUnlimited}
          valueText={`${storageLabel(usage.bytesUsed)} used · ${usage.storageUnlimited ? "Unlimited storage" : `${storageLabel(usage.storageBytes)} total`}`}
        />
        <p className="mt-3 text-sm leading-6 text-muted">
          Storage does not reset monthly. Pending uploads also reserve space
          until they complete or are cleaned up.
        </p>
      </section>
      {session ? (
        <section
          className="border-y border-line py-5"
          aria-labelledby="upload-permission-title"
        >
          <h2
            id="upload-permission-title"
            className="mb-4 text-lg font-semibold"
          >
            Image uploads · {session.title}
          </h2>
          <ParticipantImagesForm
            sessionId={session.id}
            enabled={session.participantImagesEnabled}
          />
        </section>
      ) : null}
      {photos.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {photos.map(({ media, title, url }) => (
            <li
              key={media.id}
              className="grid gap-4 py-5 sm:grid-cols-[8rem_minmax(0,1fr)]"
            >
              {url ? (
                <Image
                  unoptimized
                  src={url}
                  alt={
                    media.kind === "chat"
                      ? "Hosted-game chat photo"
                      : "Hosted-game memory photo"
                  }
                  width={128}
                  height={128}
                  className="size-32 rounded-lg object-cover"
                />
              ) : (
                <p className="text-sm text-muted">
                  {media.status === "reserved"
                    ? "Upload processing"
                    : "Preview unavailable"}
                </p>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {title ?? "Deleted game"} ·{" "}
                  {media.kind === "chat" ? "Chat image" : "Game photo"} ·{" "}
                  {storageLabel(media.bytes)}
                </p>
                {title ? (
                  <ButtonLink
                    href={`/settings/plan/media?session=${media.sessionId}`}
                    variant="secondary"
                    className="mt-3"
                  >
                    Game upload permissions
                  </ButtonLink>
                ) : null}
                {media.status === "stored" ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold">
                      Remove photo
                    </summary>
                    <div className="mt-3">
                      <RemoveHostedPhotoForm id={media.id} />
                    </div>
                  </details>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    Storage remains reserved until upload or cleanup completes.
                    Contact billing support if this persists.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          No hosted-game photos are using your storage.
        </p>
      )}
      {rows.length > 24 && last ? (
        <ButtonLink
          href={`/settings/plan/media?before=${encodeURIComponent(last.createdAt.toISOString())}&id=${last.id}`}
          variant="secondary"
          className="self-start"
        >
          Older photos
        </ButtonLink>
      ) : null}
    </div>
  );
}
