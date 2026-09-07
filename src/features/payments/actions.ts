"use server";

import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { db } from "@/db/client";
import {
  expenses,
  messages,
  notifications,
  paymentAccounts,
  playerPayments,
  sessionPlayers,
  sessions,
} from "@/db/schema";
import {
  can,
  type SessionAction,
  sessionActor,
} from "@/features/auth/permissions";
import { requireUser } from "@/features/auth/session";
import { getSessionViewer } from "@/features/sessions/viewer";
import { hasValidImageSignature } from "@/lib/image-file";
import { assertRateLimit, checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  collectFromPlayers,
  disclosedPlayerTotal,
  splitExpense,
  validatePaymentProof,
} from "./domain";

import { paymentSetupInput, paymentSetupSchema } from "./setup";
import { reconcileExpenseSharesInTransaction } from "./sync";

export type PaymentActionState = { error?: string; success?: boolean };

function paymentActionError(
  error: unknown,
  fallback: string
): PaymentActionState {
  return {
    error:
      error instanceof Error && !(error instanceof z.ZodError) && error.message
        ? error.message
        : fallback,
  };
}

async function guardPaymentManagement(userId: string) {
  await assertRateLimit(
    { scope: "payment-management", limit: 60, windowSeconds: 60 },
    `user:${userId}`,
    "Payment changes are happening too quickly. Wait a moment and try again."
  );
}

function assertPaymentsOpen(session: { status: string }) {
  if (session.status === "cancelled")
    throw new Error(
      "Payment changes are closed because this game was cancelled"
    );
}

function revalidatePlayerPriceSurfaces(session: { id: string; slug: string }) {
  revalidatePath("/home");
  revalidatePath("/games");
  revalidatePath("/games/open");
  revalidatePath(`/games/${session.id}`);
  revalidatePath(`/games/${session.id}/settings`);
  revalidatePath(`/games/${session.id}/payments`);
  revalidatePath(`/s/${session.slug}`);
  revalidatePath(`/s/${session.slug}/payments`);
}

function hasPaymentCapabilityForMembership(
  session: { hostId: string },
  userId: string,
  membership:
    | {
        role: "host" | "cohost" | "player";
        rsvp: string;
        leftAt: Date | null;
      }
    | null
    | undefined,
  action: Extract<SessionAction, "confirm_payment" | "create_expense">
) {
  return can(
    sessionActor({ userId, hostId: session.hostId, membership }),
    action
  );
}

async function hasPaymentCapability(
  session: { id: string; hostId: string },
  userId: string,
  action: Extract<SessionAction, "confirm_payment" | "create_expense">
) {
  const membership =
    session.hostId === userId
      ? null
      : await db.query.sessionPlayers.findFirst({
          where: and(
            eq(sessionPlayers.sessionId, session.id),
            eq(sessionPlayers.userId, userId)
          ),
        });
  return hasPaymentCapabilityForMembership(session, userId, membership, action);
}

export async function createExpenseState(
  _: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const parsed = paymentSetupSchema.safeParse(paymentSetupInput(formData));
  if (!parsed.success)
    return {
      error:
        "Complete the expense, amount, payment method, and payment details.",
    };
  try {
    await createExpense(formData);
    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return paymentActionError(
      error,
      "The payment collection could not be created. Try again."
    );
  }
}

async function uploadPaymentImages(
  formData: FormData,
  userId: string,
  sessionId: string
) {
  const qr = formData.get("qr");
  const receipt = formData.get("receipt");
  let qrStoragePath: string | null = null;
  let receiptStoragePath: string | null = null;
  if (qr instanceof File && qr.size > 0) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(qr.type) ||
      qr.size > 5 * 1024 * 1024
    )
      throw new Error("Use a JPG, PNG, or WebP QR image under 5 MB");
    if (!(await hasValidImageSignature(qr)))
      throw new Error("That QR file doesn’t appear to be a valid image.");
    const extension =
      qr.type === "image/png"
        ? "png"
        : qr.type === "image/webp"
          ? "webp"
          : "jpg";
    qrStoragePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage
      .from("payment-qrs")
      .upload(qrStoragePath, qr, { contentType: qr.type, upsert: false });
    if (error) throw new Error("The payment QR could not be uploaded");
  }
  if (receipt instanceof File && receipt.size > 0) {
    const receiptError = validatePaymentProof(receipt);
    if (receiptError)
      throw new Error(
        receiptError
          .replace("payment proof", "receipt")
          .replace("Payment proof", "Receipt")
      );
    if (!(await hasValidImageSignature(receipt)))
      throw new Error("That receipt doesn’t appear to be a valid image.");
    const extension =
      receipt.type === "image/png"
        ? "png"
        : receipt.type === "image/webp"
          ? "webp"
          : "jpg";
    receiptStoragePath = `${sessionId}/expense-${crypto.randomUUID()}.${extension}`;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage
      .from("booking-screenshots")
      .upload(receiptStoragePath, receipt, {
        contentType: receipt.type,
        upsert: false,
      });
    if (error) throw new Error("The receipt could not be uploaded");
  }
  return { qrStoragePath, receiptStoragePath };
}

async function createExpense(formData: FormData) {
  const user = await requireUser();
  await guardPaymentManagement(user.id);
  const sessionId = z.uuid().parse(formData.get("sessionId"));
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });
  if (
    !session ||
    !(await hasPaymentCapability(session, user.id, "create_expense"))
  )
    throw new Error("Only the host can request payment");
  assertPaymentsOpen(session);
  const limit = await checkRateLimit(
    { scope: "expense-create", limit: 5, windowSeconds: 86400 },
    `user:${user.id}`
  );
  if (!limit.allowed)
    throw new Error(
      "Payment requests are temporarily limited. Try again tomorrow."
    );
  const totalCents = Math.round(
    z.coerce.number().min(0.01).max(1_000_000).parse(formData.get("total")) *
      100
  );
  const method = z.string().trim().min(2).max(40).parse(formData.get("method"));
  const details = z
    .string()
    .trim()
    .min(2)
    .max(300)
    .parse(formData.get("details"));
  const label = z.string().trim().min(2).max(80).parse(formData.get("label"));
  const { qrStoragePath, receiptStoragePath } = await uploadPaymentImages(
    formData,
    user.id,
    sessionId
  );
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${sessions} where id = ${sessionId} for update`
    );
    const lockedSession = await tx.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });
    if (!lockedSession || lockedSession.hostId !== user.id)
      throw new Error("Only the host can request payment");
    assertPaymentsOpen(lockedSession);
    const [account] = await tx
      .insert(paymentAccounts)
      .values({
        ownerId: user.id,
        method,
        label: method,
        details,
        qrStoragePath,
      })
      .returning();
    const [expense] = await tx
      .insert(expenses)
      .values({
        sessionId,
        kind: "court",
        label,
        totalCents,
        paidById: user.id,
        paymentAccountId: account.id,
        receiptStoragePath,
      })
      .returning();
    const players = await tx
      .select()
      .from(sessionPlayers)
      .where(
        and(
          eq(sessionPlayers.sessionId, sessionId),
          eq(sessionPlayers.rsvp, "going")
        )
      );
    const payingIds = collectFromPlayers(players, user.id);
    const shares = splitExpense(totalCents, payingIds);
    if (payingIds.length)
      await tx.insert(playerPayments).values(
        payingIds.map((sessionPlayerId) => ({
          expenseId: expense.id,
          sessionPlayerId,
          amountCents: shares[sessionPlayerId],
        }))
      );
    const currentPayments = await tx
      .select({
        sessionPlayerId: playerPayments.sessionPlayerId,
        amountCents: playerPayments.amountCents,
      })
      .from(playerPayments)
      .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
      .where(
        and(
          eq(expenses.sessionId, sessionId),
          ne(playerPayments.status, "excluded")
        )
      );
    await tx
      .update(sessions)
      .set({
        playerPriceCents: disclosedPlayerTotal(currentPayments),
        version: sql`${sessions.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));
    const recipients = players
      .filter((player) => payingIds.includes(player.id) && player.userId)
      .map((player) => player.userId!);
    if (recipients.length)
      await tx.insert(notifications).values(
        recipients.map((userId) => ({
          userId,
          sessionId,
          type: "payment_requested",
          payload: {},
        }))
      );
    if (
      lockedSession.playerPriceCents !== disclosedPlayerTotal(currentPayments)
    ) {
      const participants = await tx
        .select()
        .from(sessionPlayers)
        .where(eq(sessionPlayers.sessionId, sessionId));
      const notified = participants.filter(
        (player) => player.userId && player.userId !== user.id && !player.leftAt
      );
      const body =
        "Payment collection updated. Review the current player share in Payments.";
      if (notified.length)
        await tx.insert(notifications).values(
          notified.map((player) => ({
            userId: player.userId!,
            sessionId,
            type: "session_cost_changed",
            payload: { fields: ["player price"], body },
          }))
        );
    }
  });
  revalidatePlayerPriceSurfaces(session);
}

export async function markPaymentSent(
  _: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const paymentId = z.uuid().safeParse(formData.get("paymentId"));
  if (!paymentId.success) return { error: "This payment could not be found." };
  const rows = await db
    .select({
      payment: playerPayments,
      player: sessionPlayers,
      expense: expenses,
      session: sessions,
    })
    .from(playerPayments)
    .innerJoin(
      sessionPlayers,
      eq(playerPayments.sessionPlayerId, sessionPlayers.id)
    )
    .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
    .innerJoin(sessions, eq(expenses.sessionId, sessions.id))
    .where(eq(playerPayments.id, paymentId.data))
    .limit(1);
  const row = rows[0];
  if (!row) return { error: "This payment could not be found." };
  if (row.payment.amountCents === 0)
    return { error: "No payment is due for this share." };
  if (row.session.status === "cancelled")
    return {
      error: "Payment changes are closed because this game was cancelled.",
    };
  const viewer = await getSessionViewer(
    row.expense.sessionId,
    String(formData.get("slug") ?? "")
  );
  if (!viewer || viewer.player.id !== row.player.id)
    return { error: "You can only submit proof for your own payment." };
  const proof = formData.get("proof");
  if (!(proof instanceof File))
    return { error: "Add one payment screenshot before submitting." };
  const proofError = validatePaymentProof(proof);
  if (proofError) return { error: proofError };
  if (!(await hasValidImageSignature(proof)))
    return { error: "That file doesn’t appear to be a valid image." };
  const limit = await checkRateLimit(
    { scope: "payment-proof", limit: 20, windowSeconds: 86400 },
    `player:${viewer.player.id}`
  );
  if (!limit.allowed)
    return {
      error:
        "Payment proof uploads are temporarily limited. Try again tomorrow.",
    };

  if (row.payment.status !== "unpaid" && row.payment.status !== "sent")
    return { error: "This payment no longer accepts proof." };
  const path = `${row.expense.sessionId}/${row.payment.id}/${crypto.randomUUID()}`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage
    .from("payment-proofs")
    .upload(path, proof, { contentType: proof.type, upsert: false });
  if (error)
    return {
      error:
        "The proof could not be uploaded. Check your connection and try again.",
    };

  const saved = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${sessions} where id = ${row.session.id} for update`
    );
    const lockedSession = await tx.query.sessions.findFirst({
      where: eq(sessions.id, row.session.id),
    });
    if (!lockedSession || lockedSession.status === "cancelled") return false;
    const currentPayment = await tx.query.playerPayments.findFirst({
      where: eq(playerPayments.id, row.payment.id),
    });
    if (!currentPayment || currentPayment.amountCents === 0) return false;
    const [updated] = await tx
      .update(playerPayments)
      .set({
        status: "sent",
        proofStoragePath: path,
        reviewNote: null,
        sentAt: new Date(),
        confirmedAt: null,
        confirmedById: null,
      })
      .where(
        and(
          eq(playerPayments.id, row.payment.id),
          inArray(playerPayments.status, ["unpaid", "sent"])
        )
      )
      .returning({ id: playerPayments.id });
    if (!updated) return false;
    await tx.insert(notifications).values({
      userId: row.session.hostId,
      sessionId: row.expense.sessionId,
      type: "payment_sent",
      payload: {},
    });
    return true;
  });
  if (!saved)
    return {
      error:
        "This payment changed while you were uploading. Reload and try again.",
    };
  revalidatePath(`/games/${row.expense.sessionId}/payments`);
  const slug = formData.get("slug");
  if (typeof slug === "string" && slug) revalidatePath(`/s/${slug}/payments`);
  return { success: true };
}

export async function confirmPayment(formData: FormData) {
  const user = await requireUser();
  await guardPaymentManagement(user.id);
  const paymentId = z.uuid().parse(formData.get("paymentId"));
  const rows = await db
    .select({
      payment: playerPayments,
      player: sessionPlayers,
      session: sessions,
    })
    .from(playerPayments)
    .innerJoin(
      sessionPlayers,
      eq(playerPayments.sessionPlayerId, sessionPlayers.id)
    )
    .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
    .innerJoin(sessions, eq(expenses.sessionId, sessions.id))
    .where(eq(playerPayments.id, paymentId))
    .limit(1);
  const row = rows[0];
  if (
    !row ||
    !(await hasPaymentCapability(row.session, user.id, "confirm_payment"))
  )
    throw new Error("Only a host or co-host can confirm payments");
  assertPaymentsOpen(row.session);
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${sessions} where id = ${row.session.id} for update`
    );
    const lockedSession = await tx.query.sessions.findFirst({
      where: eq(sessions.id, row.session.id),
    });
    const membership = await tx.query.sessionPlayers.findFirst({
      where: and(
        eq(sessionPlayers.sessionId, row.session.id),
        eq(sessionPlayers.userId, user.id)
      ),
    });
    if (
      !lockedSession ||
      !hasPaymentCapabilityForMembership(
        lockedSession,
        user.id,
        membership,
        "confirm_payment"
      )
    )
      throw new Error("Only a host or co-host can confirm payments");
    assertPaymentsOpen(lockedSession);
    const [updated] = await tx
      .update(playerPayments)
      .set({
        status: "confirmed",
        reviewNote: null,
        confirmedAt: new Date(),
        confirmedById: user.id,
      })
      .where(
        and(eq(playerPayments.id, paymentId), eq(playerPayments.status, "sent"))
      )
      .returning({ id: playerPayments.id });
    if (!updated) throw new Error("Only a sent payment can be confirmed");
    if (row.player.userId)
      await tx.insert(notifications).values({
        userId: row.player.userId,
        sessionId: row.session.id,
        type: "payment_confirmed",
        payload: {},
      });
  });
  revalidatePath(`/games/${row.session.id}/payments`);
}

export async function updatePlayerPaymentAmountState(
  _: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const amount = z.coerce
    .number()
    .nonnegative()
    .safeParse(formData.get("amount"));
  if (!amount.success) return { error: "Enter an amount of zero or more." };
  try {
    await updatePlayerPaymentAmount(formData);
    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return paymentActionError(
      error,
      "The player share could not be saved. Try again."
    );
  }
}

async function updatePlayerPaymentAmount(formData: FormData) {
  const user = await requireUser();
  await guardPaymentManagement(user.id);
  const paymentId = z.uuid().parse(formData.get("paymentId"));
  const amountCents = Math.round(
    z.coerce.number().nonnegative().parse(formData.get("amount")) * 100
  );
  const rows = await db
    .select({ player: sessionPlayers, session: sessions })
    .from(playerPayments)
    .innerJoin(
      sessionPlayers,
      eq(playerPayments.sessionPlayerId, sessionPlayers.id)
    )
    .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
    .innerJoin(sessions, eq(expenses.sessionId, sessions.id))
    .where(eq(playerPayments.id, paymentId))
    .limit(1);
  const row = rows[0];
  if (
    !row ||
    !(await hasPaymentCapability(row.session, user.id, "confirm_payment"))
  )
    throw new Error("Only a host or co-host can change payment amounts");
  assertPaymentsOpen(row.session);
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${sessions} where id = ${row.session.id} for update`
    );
    const lockedSession = await tx.query.sessions.findFirst({
      where: eq(sessions.id, row.session.id),
    });
    const membership = await tx.query.sessionPlayers.findFirst({
      where: and(
        eq(sessionPlayers.sessionId, row.session.id),
        eq(sessionPlayers.userId, user.id)
      ),
    });
    if (
      !lockedSession ||
      !hasPaymentCapabilityForMembership(
        lockedSession,
        user.id,
        membership,
        "confirm_payment"
      )
    )
      throw new Error("Only a host or co-host can change payment amounts");
    assertPaymentsOpen(lockedSession);
    const currentPayment = await tx.query.playerPayments.findFirst({
      where: eq(playerPayments.id, paymentId),
    });
    if (
      !currentPayment ||
      currentPayment.status === "sent" ||
      currentPayment.status === "confirmed"
    )
      throw new Error("Sent or confirmed payment amounts cannot be changed");
    await tx
      .update(playerPayments)
      .set({ amountCents, updatedAt: new Date() })
      .where(eq(playerPayments.id, paymentId));
    const currentPayments = await tx
      .select({
        sessionPlayerId: playerPayments.sessionPlayerId,
        amountCents: playerPayments.amountCents,
      })
      .from(playerPayments)
      .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
      .where(
        and(
          eq(expenses.sessionId, row.session.id),
          ne(playerPayments.status, "excluded")
        )
      );
    await tx
      .update(sessions)
      .set({
        playerPriceCents: disclosedPlayerTotal(currentPayments),
        version: sql`${sessions.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, row.session.id));
    if (row.player.userId)
      await tx.insert(notifications).values({
        userId: row.player.userId,
        sessionId: row.session.id,
        type: "payment_updated",
        payload: {},
      });
  });
  revalidatePlayerPriceSurfaces(row.session);
}

export async function togglePaymentExcluded(formData: FormData) {
  const user = await requireUser();
  await guardPaymentManagement(user.id);
  const paymentId = z.uuid().parse(formData.get("paymentId"));
  const rows = await db
    .select({ payment: playerPayments, session: sessions })
    .from(playerPayments)
    .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
    .innerJoin(sessions, eq(expenses.sessionId, sessions.id))
    .where(eq(playerPayments.id, paymentId))
    .limit(1);
  const row = rows[0];
  if (
    !row ||
    !(await hasPaymentCapability(row.session, user.id, "confirm_payment"))
  )
    throw new Error("Only a host or co-host can exclude players from a split");
  assertPaymentsOpen(row.session);
  if (row.payment.status === "sent" || row.payment.status === "confirmed")
    throw new Error("Reviewed payments cannot be excluded");
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${sessions} where id = ${row.session.id} for update`
    );
    const lockedSession = await tx.query.sessions.findFirst({
      where: eq(sessions.id, row.session.id),
    });
    const membership = await tx.query.sessionPlayers.findFirst({
      where: and(
        eq(sessionPlayers.sessionId, row.session.id),
        eq(sessionPlayers.userId, user.id)
      ),
    });
    if (
      !lockedSession ||
      !hasPaymentCapabilityForMembership(
        lockedSession,
        user.id,
        membership,
        "confirm_payment"
      )
    )
      throw new Error(
        "Only a host or co-host can exclude players from a split"
      );
    assertPaymentsOpen(lockedSession);
    const current = await tx.query.playerPayments.findFirst({
      where: eq(playerPayments.id, paymentId),
    });
    if (!current) throw new Error("This payment could not be found");
    if (current.status === "sent" || current.status === "confirmed")
      throw new Error("Reviewed payments cannot be excluded");
    await tx
      .update(playerPayments)
      .set({
        status: current.status === "excluded" ? "unpaid" : "excluded",
        updatedAt: new Date(),
      })
      .where(eq(playerPayments.id, paymentId));
    const currentPayments = await tx
      .select({
        sessionPlayerId: playerPayments.sessionPlayerId,
        amountCents: playerPayments.amountCents,
      })
      .from(playerPayments)
      .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
      .where(
        and(
          eq(expenses.sessionId, row.session.id),
          ne(playerPayments.status, "excluded")
        )
      );
    await tx
      .update(sessions)
      .set({
        playerPriceCents: disclosedPlayerTotal(currentPayments),
        version: sql`${sessions.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, row.session.id));
    const player = await tx.query.sessionPlayers.findFirst({
      where: eq(sessionPlayers.id, row.payment.sessionPlayerId),
    });
    if (player?.userId)
      await tx.insert(notifications).values({
        userId: player.userId,
        sessionId: row.session.id,
        type: "payment_updated",
        payload: {},
      });
  });
  revalidatePlayerPriceSurfaces(row.session);
}

export async function requestNewPaymentProofState(
  _: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const note = z
    .string()
    .trim()
    .min(2)
    .max(240)
    .safeParse(formData.get("note"));
  if (!note.success)
    return { error: "Add a short note explaining what needs to be clearer." };
  try {
    await requestNewPaymentProof(formData);
    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return paymentActionError(
      error,
      "The proof request could not be sent. Try again."
    );
  }
}

async function requestNewPaymentProof(formData: FormData) {
  const user = await requireUser();
  await guardPaymentManagement(user.id);
  const paymentId = z.uuid().parse(formData.get("paymentId"));
  const note = z.string().trim().min(2).max(240).parse(formData.get("note"));
  const rows = await db
    .select({ player: sessionPlayers, session: sessions })
    .from(playerPayments)
    .innerJoin(
      sessionPlayers,
      eq(playerPayments.sessionPlayerId, sessionPlayers.id)
    )
    .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
    .innerJoin(sessions, eq(expenses.sessionId, sessions.id))
    .where(eq(playerPayments.id, paymentId))
    .limit(1);
  const row = rows[0];
  if (
    !row ||
    !(await hasPaymentCapability(row.session, user.id, "confirm_payment"))
  )
    throw new Error("Only a host or co-host can review payment proof");
  assertPaymentsOpen(row.session);
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${sessions} where id = ${row.session.id} for update`
    );
    const lockedSession = await tx.query.sessions.findFirst({
      where: eq(sessions.id, row.session.id),
    });
    const membership = await tx.query.sessionPlayers.findFirst({
      where: and(
        eq(sessionPlayers.sessionId, row.session.id),
        eq(sessionPlayers.userId, user.id)
      ),
    });
    if (
      !lockedSession ||
      !hasPaymentCapabilityForMembership(
        lockedSession,
        user.id,
        membership,
        "confirm_payment"
      )
    )
      throw new Error("Only a host or co-host can review payment proof");
    assertPaymentsOpen(lockedSession);
    const [updated] = await tx
      .update(playerPayments)
      .set({
        status: "unpaid",
        reviewNote: note,
        confirmedAt: null,
        confirmedById: null,
      })
      .where(
        and(
          eq(playerPayments.id, paymentId),
          inArray(playerPayments.status, ["sent", "confirmed"])
        )
      )
      .returning({ id: playerPayments.id });
    if (!updated)
      throw new Error("This payment has no submitted proof to review");
    if (row.player.userId)
      await tx.insert(notifications).values({
        userId: row.player.userId,
        sessionId: row.session.id,
        type: "payment_proof_requested",
        payload: { note },
      });
  });
  revalidatePath(`/games/${row.session.id}/payments`);
}

export async function updatePaymentChoiceState(
  _: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  if (formData.get("costKind") === "collect")
    return createExpenseState({}, formData);
  const user = await requireUser();
  try {
    await guardPaymentManagement(user.id);
    const sessionId = z.uuid().parse(formData.get("sessionId"));
    const choice = z
      .enum(["free", "unspecified"])
      .parse(formData.get("costKind"));
    const session = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select id from ${sessions} where id = ${sessionId} for update`
      );
      const current = await tx.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
      });
      if (!current || current.hostId !== user.id)
        throw new Error("Only the host can set up payments");
      assertPaymentsOpen(current);
      const record = await tx.query.expenses.findFirst({
        where: eq(expenses.sessionId, sessionId),
      });
      if (record)
        throw new Error(
          "This game has payment records. You can edit payment details, but cannot mark it free or unset."
        );
      const playerPriceCents = choice === "free" ? 0 : null;
      if (current.playerPriceCents === playerPriceCents) return current;
      await tx
        .update(sessions)
        .set({
          playerPriceCents,
          version: sql`${sessions.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, sessionId));
      const body =
        playerPriceCents === 0
          ? "This game is now free."
          : "The player price was removed.";
      await tx
        .insert(messages)
        .values({ sessionId, authorId: user.id, kind: "system", body });
      const players = await tx
        .select()
        .from(sessionPlayers)
        .where(eq(sessionPlayers.sessionId, sessionId));
      const recipients = players.filter(
        (player) => player.userId && player.userId !== user.id && !player.leftAt
      );
      if (recipients.length)
        await tx.insert(notifications).values(
          recipients.map((player) => ({
            userId: player.userId!,
            sessionId,
            type: "session_cost_changed",
            payload: { fields: ["player price"], body },
          }))
        );
      return current;
    });
    revalidatePlayerPriceSurfaces(session);
    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return paymentActionError(error, "Payment settings could not be saved.");
  }
}

export async function updateExpenseState(
  _: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const user = await requireUser();
  const parsed = paymentSetupSchema.safeParse(paymentSetupInput(formData));
  if (!parsed.success)
    return {
      error: "Complete the expense, total, method, and payment details.",
    };
  try {
    await guardPaymentManagement(user.id);
    const sessionId = z.uuid().parse(formData.get("sessionId"));
    const expenseId = z.uuid().parse(formData.get("expenseId"));
    const existingSession = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });
    if (!existingSession || existingSession.hostId !== user.id)
      throw new Error("Only the host can edit payment setup");
    assertPaymentsOpen(existingSession);
    const uploads = await uploadPaymentImages(formData, user.id, sessionId);
    const session = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select id from ${sessions} where id = ${sessionId} for update`
      );
      const current = await tx.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
      });
      if (!current || current.hostId !== user.id)
        throw new Error("Only the host can edit payment setup");
      assertPaymentsOpen(current);
      const expense = await tx.query.expenses.findFirst({
        where: and(
          eq(expenses.id, expenseId),
          eq(expenses.sessionId, sessionId)
        ),
      });
      if (!expense) throw new Error("This collection could not be found");
      const totalCents = Math.round(parsed.data.total * 100);
      const payments = await tx
        .select()
        .from(playerPayments)
        .where(eq(playerPayments.expenseId, expenseId));
      // The schema does not distinguish automatic shares from manual overrides.
      // Refuse a new resplit rather than guessing intent from amounts/timestamps.
      if (totalCents !== expense.totalCents && payments.length > 0)
        throw new Error(
          "This collection already has player shares. Its total cannot be changed without replacing existing amounts. Payment details and images can still be corrected."
        );
      // Accounts may be shared by older collections: copy rather than changing another game's instructions.
      const oldAccount = expense.paymentAccountId
        ? await tx.query.paymentAccounts.findFirst({
            where: eq(paymentAccounts.id, expense.paymentAccountId),
          })
        : null;
      const [account] = await tx
        .insert(paymentAccounts)
        .values({
          ownerId: user.id,
          label: parsed.data.method,
          method: parsed.data.method,
          details: parsed.data.details,
          qrStoragePath:
            uploads.qrStoragePath ?? oldAccount?.qrStoragePath ?? null,
        })
        .returning();
      await tx
        .update(expenses)
        .set({
          label: parsed.data.label,
          totalCents,
          paymentAccountId: account.id,
          receiptStoragePath:
            uploads.receiptStoragePath ?? expense.receiptStoragePath,
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, expenseId));
      if (totalCents !== expense.totalCents)
        await reconcileExpenseSharesInTransaction(tx, sessionId, expenseId);
      else
        await tx
          .update(sessions)
          .set({ version: sql`${sessions.version} + 1`, updatedAt: new Date() })
          .where(eq(sessions.id, sessionId));
      const players = await tx
        .select()
        .from(sessionPlayers)
        .where(eq(sessionPlayers.sessionId, sessionId));
      const recipients = players.filter(
        (player) => player.userId && player.userId !== user.id && !player.leftAt
      );
      if (recipients.length)
        await tx.insert(notifications).values(
          recipients.map((player) => ({
            userId: player.userId!,
            sessionId,
            type: "payment_updated",
            payload: {},
          }))
        );
      return current;
    });
    revalidatePlayerPriceSurfaces(session);
    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return paymentActionError(error, "Payment settings could not be saved.");
  }
}
