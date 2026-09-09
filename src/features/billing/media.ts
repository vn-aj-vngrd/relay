import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { billingMedia, sessions } from "@/db/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { BillingError } from "./domain";
import { type BillingTransaction, reserveMedia } from "./usage";

export async function cleanupDeletedSessionMedia(sessionId: string) {
  const rows = await db.query.billingMedia.findMany({
    where: and(
      eq(billingMedia.sessionId, sessionId),
      eq(billingMedia.status, "stored")
    ),
  });
  const buckets = [...new Set(rows.map((row) => row.bucket))];
  await Promise.all(
    buckets.map(async (bucket) => {
      const paths = rows
        .filter((row) => row.bucket === bucket)
        .map((row) => row.path);
      // Storage APIs accept bounded batches; a large photo history must not become one request.
      for (let offset = 0; offset < paths.length; offset += 100) {
        const batch = paths.slice(offset, offset + 100);
        const { error } = await createSupabaseAdminClient()
          .storage.from(bucket)
          .remove(batch);
        if (error)
          throw new BillingError(
            "Some deleted-game photos still need storage cleanup."
          );
        await db
          .update(billingMedia)
          .set({ status: "released" })
          .where(inArray(billingMedia.path, batch));
      }
    })
  );
}

// Reserve before external I/O; keep the reservation if deletion cannot be confirmed.
// A process crash cannot make storage disappear from accounting.
export async function storeGameMedia(
  input: {
    hostId: string;
    sessionId: string;
    actorKey: string;
    kind: "chat" | "memory";
    path: string;
    file: File;
  },
  persist: (tx: BillingTransaction) => Promise<void>
) {
  const reservation = await reserveMedia({
    hostId: input.hostId,
    sessionId: input.sessionId,
    actorKey: input.actorKey,
    kind: input.kind,
    path: input.path,
    bytes: input.file.size,
  });
  const storage = createSupabaseAdminClient().storage.from(reservation.bucket);
  try {
    const { error } = await storage.upload(input.path, input.file, {
      contentType: input.file.type,
      upsert: false,
    });
    if (error)
      throw new BillingError(
        "The photo could not be uploaded. Check your connection and try again."
      );
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(billingMedia)
        .where(eq(billingMedia.id, reservation.id))
        .for("update");
      if (current?.status !== "reserved")
        throw new BillingError(
          "This upload reservation has expired. Please upload the photo again."
        );
      const [session] = await tx
        .select()
        .from(sessions)
        .where(eq(sessions.id, input.sessionId))
        .for("update");
      if (
        !session ||
        session.hostId !== input.hostId ||
        session.status === "cancelled" ||
        (input.kind === "memory" && session.status !== "completed")
      )
        throw new BillingError("This game is no longer accepting photos.");
      if (
        !session.participantImagesEnabled &&
        input.actorKey !== `user:${session.hostId}`
      )
        throw new BillingError(
          "The host has turned off participant image uploads for this game."
        );
      await persist(tx);
      await tx
        .update(billingMedia)
        .set({ status: "stored", storedAt: new Date() })
        .where(eq(billingMedia.id, reservation.id));
    });
  } catch (error) {
    try {
      const committed = await db.transaction(async (tx) => {
        const [current] = await tx
          .select()
          .from(billingMedia)
          .where(eq(billingMedia.id, reservation.id))
          .for("update");
        // A lost commit response must not delete an upload that was actually saved.
        if (current?.status === "stored") return true;
        const cleanup = await storage.remove([input.path]);
        if (cleanup.error) throw new Error("Storage cleanup failed");
        await tx
          .update(billingMedia)
          .set({ status: "released" })
          .where(
            and(
              eq(billingMedia.id, reservation.id),
              eq(billingMedia.status, "reserved")
            )
          );
        return false;
      });
      if (committed) return;
    } catch {
      console.error(
        "Media reservation retained after interrupted cleanup",
        reservation.id
      );
    }
    throw error;
  }
}
