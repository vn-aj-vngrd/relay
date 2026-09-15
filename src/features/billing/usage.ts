import "server-only";

import {
  and,
  desc,
  eq,
  gt,
  gte,
  isNotNull,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db/client";
import {
  billingGameUsage,
  billingMedia,
  billingOverrides,
  billingTerms,
} from "@/db/schema";
import { MAX_IMAGE_UPLOAD_MIB } from "@/lib/upload-config";

import { getBillingCatalog, getImageUploadLimits } from "./catalog";
import {
  BillingError,
  billingDate,
  manilaDay,
  mediaPolicy,
  resolveAllowance,
} from "./domain";

export type BillingTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export async function lockBillingAccount(
  tx: BillingTransaction,
  userId: string
) {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtextextended(${`relay.billing:${userId}`}, 0))`
  );
}

export async function getAccountAllowance(
  userId: string,
  connection: BillingTransaction | typeof db = db,
  now = new Date()
) {
  const [term, override, catalog] = await Promise.all([
    connection.query.billingTerms.findFirst({
      where: and(
        eq(billingTerms.userId, userId),
        lte(billingTerms.startsAt, now),
        gt(billingTerms.endsAt, now)
      ),
      orderBy: desc(billingTerms.startsAt),
    }),
    connection.query.billingOverrides.findFirst({
      where: eq(billingOverrides.userId, userId),
    }),
    getBillingCatalog(connection),
  ]);
  const allowance = resolveAllowance({
    now,
    term,
    override,
    freePlan: catalog.find((plan) => plan.id === "free"),
  });
  return { ...allowance, term, override };
}

export async function getAccountUsage(
  userId: string,
  connection: BillingTransaction | typeof db = db,
  now = new Date()
) {
  const allowance = await getAccountAllowance(userId, connection, now);
  const [gameRows, mediaRows, latestTerm] = await Promise.all([
    connection
      .select({ count: sql<number>`count(*)::int` })
      .from(billingGameUsage)
      .where(
        and(
          eq(billingGameUsage.userId, userId),
          gte(billingGameUsage.createdAt, allowance.start),
          lt(billingGameUsage.createdAt, allowance.end)
        )
      ),
    connection
      .select({ bytes: sql<string>`coalesce(sum(${billingMedia.bytes}), 0)` })
      .from(billingMedia)
      .where(
        and(
          eq(billingMedia.hostId, userId),
          ne(billingMedia.status, "released")
        )
      ),
    connection.query.billingTerms.findFirst({
      where: eq(billingTerms.userId, userId),
      orderBy: desc(billingTerms.endsAt),
    }),
  ]);
  return {
    ...allowance,
    gamesUsed: gameRows[0]?.count ?? 0,
    bytesUsed: Number(mediaRows[0]?.bytes ?? 0),
    paidThrough: latestTerm?.endsAt ?? null,
  };
}

// Caller keeps this lock through creation and ledger insertion in the same transaction.
export async function checkGameCreation(
  tx: BillingTransaction,
  userId: string,
  requestKey: string
) {
  await lockBillingAccount(tx, userId);
  const previous = await tx.query.billingGameUsage.findFirst({
    where: and(
      eq(billingGameUsage.userId, userId),
      eq(billingGameUsage.requestKey, requestKey)
    ),
  });
  if (previous)
    return {
      existingSessionId: previous.sessionId,
      createdAt: previous.createdAt,
    };
  // PostgreSQL now() is transaction-start time. A request may wait across midnight
  // for this lock, so record the same post-lock instant used for its allowance.
  const createdAt = new Date();
  const usage = await getAccountUsage(userId, tx, createdAt);
  if (!usage.gamesUnlimited && usage.gamesUsed >= usage.games)
    throw new BillingError(
      `You’ve used ${usage.gamesUsed} of ${usage.games} games. Your ${usage.plan !== "free" ? "current paid period ends" : "allowance resets"} ${billingDate(usage.end)} (Philippine time). View Plan & billing in Settings for options.`
    );
  return { existingSessionId: null, createdAt };
}

// Count reservations as well as stored photos, so concurrent uploads cannot
// claim the last album slot twice. Confirmed deletion releases both quotas.
export async function getGamePhotoCount(
  sessionId: string,
  connection: BillingTransaction | typeof db = db
) {
  const [row] = await connection
    .select({ photoCount: sql<number>`count(*)::int` })
    .from(billingMedia)
    .where(
      and(
        eq(billingMedia.sessionId, sessionId),
        eq(billingMedia.kind, "memory"),
        ne(billingMedia.status, "released")
      )
    );
  return row?.photoCount ?? 0;
}

export async function getGamePhotoAllowance(hostId: string, sessionId: string) {
  const [imageLimits, usage, photosUsed] = await Promise.all([
    getImageUploadLimits(),
    getAccountUsage(hostId),
    getGamePhotoCount(sessionId),
  ]);
  // Only upload-relevant totals cross the route boundary, never billing records.
  return {
    maxImageBytes: imageLimits.memoryImageMaxBytes,
    photosUsed,
    photoLimit: mediaPolicy.memory.perGame,
    bytesUsed: usage.bytesUsed,
    storageBytes: usage.storageBytes,
    storageUnlimited: usage.storageUnlimited,
  };
}

export async function reserveMedia(input: {
  hostId: string;
  sessionId: string;
  actorKey: string;
  kind: "chat" | "memory";
  path: string;
  bytes: number;
}) {
  const policy = mediaPolicy[input.kind];
  if (
    !Number.isSafeInteger(input.bytes) ||
    input.bytes <= 0 ||
    input.bytes > MAX_IMAGE_UPLOAD_MIB * 1024 * 1024
  )
    throw new BillingError("Choose a smaller image.");
  return db.transaction(async (tx) => {
    const imageLimits = await getImageUploadLimits(tx);
    const maxBytes =
      input.kind === "chat"
        ? imageLimits.chatImageMaxBytes
        : imageLimits.memoryImageMaxBytes;
    if (input.bytes > maxBytes)
      throw new BillingError(
        "Choose a smaller image. The photo limit may have changed; refresh the page and try again."
      );
    // Fixed lock order: uploader, then host. All upload reservations use this order.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${`relay.upload:${input.actorKey}`}, 0))`
    );
    await lockBillingAccount(tx, input.hostId);
    const createdAt = new Date();
    if (
      input.kind === "memory" &&
      (await getGamePhotoCount(input.sessionId, tx)) >=
        mediaPolicy.memory.perGame
    ) {
      throw new BillingError(
        `This game has reached its ${mediaPolicy.memory.perGame}-photo limit, shared by all players. The host can remove a game photo to make room. Upgrading does not increase this album limit.`
      );
    }
    const usage = await getAccountUsage(input.hostId, tx, createdAt);
    if (
      !usage.storageUnlimited &&
      usage.bytesUsed + input.bytes > usage.storageBytes
    )
      throw new BillingError(
        "This photo exceeds the host’s remaining shared storage. The host can manage photos or view plans in Settings. Storage does not reset monthly; existing photos, text chat and payment proof remain available."
      );
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(billingMedia)
      .where(
        and(
          eq(billingMedia.actorKey, input.actorKey),
          eq(billingMedia.kind, input.kind),
          or(
            eq(billingMedia.status, "reserved"),
            isNotNull(billingMedia.storedAt)
          ),
          gte(billingMedia.createdAt, manilaDay(createdAt))
        )
      );
    if (count >= policy.dailyUploads)
      throw new BillingError(
        `You’ve reached ${policy.dailyUploads} ${input.kind === "chat" ? "chat images" : "game photos"} today. Try again after midnight Philippine time.`
      );
    const [reservation] = await tx
      .insert(billingMedia)
      .values({ ...input, bucket: policy.bucket, createdAt })
      .returning();
    return reservation;
  });
}
