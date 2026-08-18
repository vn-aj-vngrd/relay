"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import {
  courts,
  expenses,
  matchPlayers,
  matches,
  matchScores,
  memories,
  memoryMedia,
  messages,
  notifications,
  playerPayments,
  sessionInvites,
  sessionPairs,
  sessionPlayers,
  sessionQueue,
  sessions,
} from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type DeleteSessionState = { error?: string };

const inputSchema = z.object({ sessionId: z.uuid(), confirmation: z.string().max(120) });

export async function deleteSessionAction(_: DeleteSessionState, formData: FormData): Promise<DeleteSessionState> {
  const user = await requireUser();
  const parsed = inputSchema.safeParse({ sessionId: formData.get("sessionId"), confirmation: formData.get("confirmation") });
  if (!parsed.success) return { error: "Enter the game title exactly as shown." };

  const session = await db.query.sessions.findFirst({ where: and(eq(sessions.id, parsed.data.sessionId), eq(sessions.hostId, user.id)) });
  if (!session) return { error: "Only the host can delete this game." };
  if (parsed.data.confirmation.trim() !== session.title) return { error: `Type “${session.title}” to confirm.` };

  let paymentProofPaths: string[] = [];
  let expenseReceiptPaths: string[] = [];
  let memoryPaths: string[] = [];
  try {
    await db.transaction(async (tx) => {
      const [expenseRows, matchRows, memoryRows] = await Promise.all([
        tx.select({ id: expenses.id, receiptPath: expenses.receiptStoragePath }).from(expenses).where(eq(expenses.sessionId, session.id)),
        tx.select({ id: matches.id }).from(matches).where(eq(matches.sessionId, session.id)),
        tx.select({ id: memories.id }).from(memories).where(eq(memories.sessionId, session.id)),
      ]);
      const expenseIds = expenseRows.map((row) => row.id);
      expenseReceiptPaths = expenseRows.flatMap((row) => row.receiptPath ? [row.receiptPath] : []);
      const matchIds = matchRows.map((row) => row.id);
      const memoryIds = memoryRows.map((row) => row.id);
      if (expenseIds.length) {
        const proofs = await tx.select({ path: playerPayments.proofStoragePath }).from(playerPayments).where(inArray(playerPayments.expenseId, expenseIds));
        paymentProofPaths = proofs.flatMap((row) => row.path ? [row.path] : []);
        await tx.delete(playerPayments).where(inArray(playerPayments.expenseId, expenseIds));
      }
      if (matchIds.length) {
        await tx.delete(matchScores).where(inArray(matchScores.matchId, matchIds));
        await tx.delete(matchPlayers).where(inArray(matchPlayers.matchId, matchIds));
      }
      if (memoryIds.length) {
        const media = await tx.select({ path: memoryMedia.storagePath }).from(memoryMedia).where(inArray(memoryMedia.memoryId, memoryIds));
        memoryPaths = media.map((row) => row.path);
      }

      await tx.delete(sessionQueue).where(eq(sessionQueue.sessionId, session.id));
      await tx.delete(messages).where(eq(messages.sessionId, session.id));
      await tx.delete(memories).where(eq(memories.sessionId, session.id));
      await tx.delete(matches).where(eq(matches.sessionId, session.id));
      await tx.delete(expenses).where(eq(expenses.sessionId, session.id));
      await tx.delete(sessionInvites).where(eq(sessionInvites.sessionId, session.id));
      await tx.delete(courts).where(eq(courts.sessionId, session.id));
      await tx.delete(sessionPairs).where(eq(sessionPairs.sessionId, session.id));
      await tx.delete(sessionPlayers).where(eq(sessionPlayers.sessionId, session.id));
      await tx.delete(notifications).where(eq(notifications.sessionId, session.id));
      await tx.delete(sessions).where(eq(sessions.id, session.id));
    });
  } catch (error) {
    console.error("Session deletion failed", error);
    return { error: "The game couldn’t be deleted. Try again." };
  }

  const supabase = createSupabaseAdminClient();
  await Promise.all([
    paymentProofPaths.length ? supabase.storage.from("payment-proofs").remove(paymentProofPaths) : Promise.resolve(),
    expenseReceiptPaths.length ? supabase.storage.from("booking-screenshots").remove(expenseReceiptPaths) : Promise.resolve(),
    memoryPaths.length ? supabase.storage.from("session-memories").remove(memoryPaths) : Promise.resolve(),
  ]).catch((error) => console.error("Deleted session storage cleanup failed", error));

  revalidatePath("/home");
  revalidatePath("/games");
  redirect("/games");
}
