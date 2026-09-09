"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { db } from "@/db/client";
import {
  adminAuditLogs,
  billingMethods,
  billingOverrides,
  billingRequests,
  billingSettings,
  billingTerms,
  notifications,
  users,
} from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { requireUser } from "@/features/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";

import {
  BillingError,
  type BillingState,
  MiB,
  manilaMonth,
  plans,
  renewalPeriod,
  transactionKey,
} from "./domain";
import { removeBillingFile, uploadBillingFile } from "./files";
import { type BillingTransaction, lockBillingAccount } from "./usage";
import {
  methodSchema,
  overrideSchema,
  reasonSchema,
  reviewSchema,
  settingsSchema,
} from "./validation";

function refresh(userId?: string) {
  revalidatePath("/settings/plan");
  revalidatePath("/admin/billing", "layout");
  if (userId) revalidatePath(`/admin/users/${userId}/billing`);
}
async function guarded(
  work: () => Promise<BillingState>
): Promise<BillingState> {
  try {
    return await work();
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof BillingError) return { error: error.message };
    if (error instanceof z.ZodError)
      return {
        error: error.issues[0]?.message ?? "Check the payment details.",
      };
    console.error(
      "Subscription operation failed",
      error instanceof Error ? error.name : "unknown"
    );
    return {
      error:
        "This change could not be saved. Refresh and try again; contact billing support if it continues.",
    };
  }
}
async function throttle(userId: string) {
  const result = await checkRateLimit(
    { scope: "billing-mutation", limit: 20, windowSeconds: 60 },
    `user:${userId}`
  );
  if (!result.allowed)
    throw new BillingError(
      "Too many billing changes. Wait a minute before trying again."
    );
}
async function audit(
  tx: BillingTransaction,
  actorId: string,
  action: string,
  targetId: string,
  reason: string,
  metadata: Record<string, unknown> = {}
) {
  await tx.insert(adminAuditLogs).values({
    actorUserId: actorId,
    action,
    targetType: "billing",
    targetId,
    reason,
    metadata,
  });
}

export async function saveBillingSettings(
  _: BillingState,
  data: FormData
): Promise<BillingState> {
  const admin = await requireAdmin();
  return guarded(async () => {
    const input = settingsSchema.parse({
      ...Object.fromEntries(data),
      acceptingPayments: data.get("acceptingPayments") === "on",
    });
    if (data.get("confirm") !== "on")
      throw new BillingError(
        "Confirm that these instructions and policies are ready to publish."
      );
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended('relay.billing-settings', 0))`
      );
      const before = await tx.query.billingSettings.findFirst({
        where: eq(billingSettings.id, "global"),
      });
      if (input.acceptingPayments) {
        const method = await tx.query.billingMethods.findFirst({
          where: eq(billingMethods.enabled, true),
        });
        if (!method)
          throw new BillingError(
            "Enable at least one payment method before accepting upgrade requests."
          );
      }
      const { reason, ...values } = input;
      await tx
        .insert(billingSettings)
        .values({ id: "global", ...values })
        .onConflictDoUpdate({
          target: billingSettings.id,
          set: { ...values, updatedAt: new Date() },
        });
      await audit(tx, admin.id, "billing.settings_updated", "global", reason, {
        before,
        after: values,
      });
    });
    refresh();
    return {
      success:
        "Billing settings saved. Existing requests retain their original payment instructions.",
    };
  });
}

export async function saveBillingMethod(
  _: BillingState,
  data: FormData
): Promise<BillingState> {
  const admin = await requireAdmin();
  return guarded(async () => {
    const input = methodSchema.parse({
      ...Object.fromEntries(data),
      id: data.get("id") ?? "",
      enabled: data.get("enabled") === "on",
    });
    if (data.get("confirm") !== "on")
      throw new BillingError(
        "Confirm the recipient, account details and QR before publishing."
      );
    const qrPath = await uploadBillingFile(data.get("qr"), "methods");
    try {
      await db.transaction(async (tx) => {
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended('relay.billing-settings', 0))`
        );
        const before = input.id
          ? await tx.query.billingMethods.findFirst({
              where: eq(billingMethods.id, input.id),
            })
          : null;
        if (input.id && !before)
          throw new BillingError("This payment method no longer exists.");
        const { id, reason, ...values } = input;
        const next = {
          ...values,
          qrPath:
            qrPath ??
            (data.get("removeQr") === "on" ? null : (before?.qrPath ?? null)),
          updatedAt: new Date(),
        };
        const [saved] = id
          ? await tx
              .update(billingMethods)
              .set(next)
              .where(eq(billingMethods.id, id))
              .returning()
          : await tx.insert(billingMethods).values(next).returning();
        // Old QR objects remain available to requests with immutable snapshots.
        await audit(tx, admin.id, "billing.method_updated", saved.id, reason, {
          before,
          after: saved,
        });
      });
    } catch (error) {
      await removeBillingFile(qrPath);
      throw error;
    }
    refresh();
    return { success: "Payment method saved." };
  });
}

export async function createUpgradeRequest(
  _: BillingState,
  data: FormData
): Promise<BillingState> {
  const user = await requireUser();
  return guarded(async () => {
    await throttle(user.id);
    const methodId = z.uuid().parse(data.get("methodId"));
    const id = await db.transaction(async (tx) => {
      await lockBillingAccount(tx, user.id);
      const existing = await tx.query.billingRequests.findFirst({
        where: and(
          eq(billingRequests.userId, user.id),
          inArray(billingRequests.status, [
            "awaiting_payment",
            "submitted",
            "clarification",
          ])
        ),
      });
      if (existing) return existing.id;
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended('relay.billing-settings', 0))`
      );
      const settings = await tx.query.billingSettings.findFirst({
        where: eq(billingSettings.id, "global"),
      });
      const method = await tx.query.billingMethods.findFirst({
        where: and(
          eq(billingMethods.id, methodId),
          eq(billingMethods.enabled, true)
        ),
      });
      if (!settings?.acceptingPayments || !method)
        throw new BillingError(
          "Paid upgrades are not available right now. Please try later."
        );
      const [request] = await tx
        .insert(billingRequests)
        .values({
          userId: user.id,
          methodId,
          amountCents: plans.pro.priceCents,
          planVersion: plans.pro.version,
          games: plans.pro.games,
          storageBytes: plans.pro.storageBytes,
          snapshot: {
            provider: method.provider,
            recipient: method.recipient,
            account: method.account,
            instructions: method.instructions,
            qrPath: method.qrPath,
            supportContact: settings.supportContact,
            reviewTime: settings.reviewTime,
            policy: settings.policy,
          },
        })
        .returning();
      return request.id;
    });
    redirect(`/settings/plan/requests/${id}`);
  });
}

export async function submitSubscriptionPayment(
  _: BillingState,
  data: FormData
): Promise<BillingState> {
  const user = await requireUser();
  return guarded(async () => {
    await throttle(user.id);
    const id = z.uuid().parse(data.get("id"));
    const reference = z
      .string()
      .trim()
      .min(3, "Enter the payment provider’s transaction reference.")
      .max(120)
      .parse(data.get("transactionReference"));
    const owned = await db.query.billingRequests.findFirst({
      where: and(
        eq(billingRequests.id, id),
        eq(billingRequests.userId, user.id)
      ),
    });
    if (!owned || !["awaiting_payment", "clarification"].includes(owned.status))
      throw new BillingError(
        "This request is not accepting payment changes. Refresh to see its status."
      );
    const proofPath = await uploadBillingFile(
      data.get("proof"),
      `proofs/${user.id}`
    );
    try {
      await db.transaction(async (tx) => {
        await lockBillingAccount(tx, user.id);
        const saved = await tx
          .update(billingRequests)
          .set({
            status: "submitted",
            transactionReference: reference,
            proofPath: proofPath ?? owned.proofPath,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(billingRequests.id, id),
              eq(billingRequests.userId, user.id),
              inArray(billingRequests.status, [
                "awaiting_payment",
                "clarification",
              ])
            )
          )
          .returning({ id: billingRequests.id });
        if (!saved.length)
          throw new BillingError(
            "This request changed while you were submitting. Refresh before trying again."
          );
      });
    } catch (error) {
      await removeBillingFile(proofPath);
      throw error;
    }
    if (proofPath) await removeBillingFile(owned.proofPath);
    revalidatePath(`/settings/plan/requests/${id}`);
    refresh();
    return {
      success:
        "Payment submitted. Pro starts after the received funds are verified.",
    };
  });
}

export async function cancelUpgradeRequest(
  _: BillingState,
  data: FormData
): Promise<BillingState> {
  const user = await requireUser();
  return guarded(async () => {
    const id = z.uuid().parse(data.get("id"));
    if (data.get("confirm") !== "on")
      throw new BillingError(
        "Confirm you have not sent payment before cancelling."
      );
    await db.transaction(async (tx) => {
      await lockBillingAccount(tx, user.id);
      const saved = await tx
        .update(billingRequests)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
          and(
            eq(billingRequests.id, id),
            eq(billingRequests.userId, user.id),
            eq(billingRequests.status, "awaiting_payment")
          )
        )
        .returning();
      if (!saved.length)
        throw new BillingError(
          "This request cannot be cancelled. Contact billing support if you already paid."
        );
    });
    refresh();
    revalidatePath(`/settings/plan/requests/${id}`);
    return { success: "Unpaid request cancelled." };
  });
}

export async function reviewSubscriptionPayment(
  _: BillingState,
  data: FormData
): Promise<BillingState> {
  const admin = await requireAdmin();
  return guarded(async () => {
    const input = reviewSchema.parse({
      ...Object.fromEntries(data),
      verified: data.get("verified") === "on",
    });
    const request = await db.query.billingRequests.findFirst({
      where: eq(billingRequests.id, input.id),
    });
    if (!request) throw new BillingError("Payment request not found.");
    if (request.userId === admin.id)
      throw new BillingError(
        "Another administrator must verify your payment. Use an audited complimentary grant for testing."
      );
    await db.transaction(async (tx) => {
      await lockBillingAccount(tx, request.userId);
      const current = await tx.query.billingRequests.findFirst({
        where: eq(billingRequests.id, input.id),
      });
      if (current?.status === "approved" && input.decision === "approved")
        return;
      if (!current || !["submitted", "clarification"].includes(current.status))
        throw new BillingError("This request is not awaiting review.");
      const now = new Date();
      let key: string | null = null;
      if (input.decision === "approved") {
        key = transactionKey(
          current.snapshot.provider,
          input.verifiedReference
        );
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${`relay.payment:${key}`}, 0))`
        );
        const duplicate = await tx.query.billingRequests.findFirst({
          where: eq(billingRequests.verifiedTransactionKey, key),
        });
        if (duplicate)
          throw new BillingError(
            "This transaction has already been credited to another request."
          );
        const last = await tx.query.billingTerms.findFirst({
          where: eq(billingTerms.userId, current.userId),
          orderBy: desc(billingTerms.endsAt),
        });
        const period = renewalPeriod(now, last?.endsAt);
        await tx.insert(billingTerms).values({
          userId: current.userId,
          requestId: current.id,
          source: "manual",
          planVersion: current.planVersion,
          startsAt: period.start,
          endsAt: period.end,
          usageStartsAt:
            period.start > now ? period.start : manilaMonth(now).start,
          games: current.games,
          storageBytes: current.storageBytes,
        });
      }
      await tx
        .update(billingRequests)
        .set({
          status: input.decision,
          verifiedTransactionKey: key,
          reviewNote: input.reason,
          reviewedBy: admin.id,
          reviewedAt: now,
          updatedAt: now,
        })
        .where(eq(billingRequests.id, current.id));
      await tx.insert(notifications).values({
        userId: current.userId,
        type: "subscription_review",
        payload: {},
        dedupeKey: `subscription-review:${current.id}:${input.decision}:${now.toISOString()}`,
      });
      await audit(
        tx,
        admin.id,
        `billing.payment_${input.decision}`,
        current.id,
        input.reason,
        {
          userId: current.userId,
          amountCents: current.amountCents,
          previousStatus: current.status,
        }
      );
    });
    refresh(request.userId);
    revalidatePath(`/settings/plan/requests/${request.id}`);
    return {
      success:
        input.decision === "approved"
          ? "Payment approved. One month of Pro has been credited."
          : "Review saved. The account can view your note.",
    };
  });
}

export async function saveAccountOverrides(
  _: BillingState,
  data: FormData
): Promise<BillingState> {
  const admin = await requireAdmin();
  return guarded(async () => {
    const expiresOn = data.get("expiresOn");
    const expiresAt = expiresOn
      ? `${z.iso.date().parse(expiresOn)}T23:59:59.999+08:00`
      : null;
    const input = overrideSchema.parse({
      ...Object.fromEntries(data),
      expiresAt,
    });
    if (input.expiresAt && input.expiresAt <= new Date())
      throw new BillingError("Choose an expiry in the future.");
    await db.transaction(async (tx) => {
      await lockBillingAccount(tx, input.userId);
      const user = await tx.query.users.findFirst({
        where: eq(users.id, input.userId),
      });
      if (!user) throw new BillingError("Account not found.");
      const before = await tx.query.billingOverrides.findFirst({
        where: eq(billingOverrides.userId, input.userId),
      });
      const values = {
        userId: input.userId,
        games: input.games,
        storageBytes: input.storageMiB === null ? null : input.storageMiB * MiB,
        expiresAt: input.expiresAt,
        reason: input.reason,
        updatedAt: new Date(),
      };
      await tx
        .insert(billingOverrides)
        .values(values)
        .onConflictDoUpdate({ target: billingOverrides.userId, set: values });
      await audit(
        tx,
        admin.id,
        "billing.overrides_updated",
        input.userId,
        input.reason,
        { before, after: values }
      );
    });
    refresh(input.userId);
    return {
      success:
        "Account allowances saved. Blank values inherit the plan defaults.",
    };
  });
}

export async function grantComplimentaryPro(
  _: BillingState,
  data: FormData
): Promise<BillingState> {
  const admin = await requireAdmin();
  return guarded(async () => {
    const userId = z.uuid().parse(data.get("userId"));
    const reason = reasonSchema.parse(data.get("reason"));
    if (data.get("confirm") !== "on")
      throw new BillingError("Confirm the complimentary one-month grant.");
    await db.transaction(async (tx) => {
      await lockBillingAccount(tx, userId);
      const last = await tx.query.billingTerms.findFirst({
        where: eq(billingTerms.userId, userId),
        orderBy: desc(billingTerms.endsAt),
      });
      const now = new Date();
      // Deliberately reject repeat grants while any term remains: a retry cannot extend access twice.
      if (last && last.endsAt > now)
        throw new BillingError(
          "This account already has Pro access scheduled. Use a limit override instead."
        );
      const period = renewalPeriod(now);
      await tx.insert(billingTerms).values({
        userId,
        source: "complimentary",
        planVersion: plans.pro.version,
        startsAt: period.start,
        endsAt: period.end,
        usageStartsAt: manilaMonth(now).start,
        games: plans.pro.games,
        storageBytes: plans.pro.storageBytes,
      });
      await tx.insert(notifications).values({
        userId,
        type: "subscription_grant",
        payload: {},
        dedupeKey: `subscription-grant:${userId}:${period.end.toISOString()}`,
      });
      await audit(tx, admin.id, "billing.pro_granted", userId, reason, {
        endsAt: period.end,
      });
    });
    refresh(userId);
    return {
      success:
        "One complimentary month of Pro granted. It expires automatically.",
    };
  });
}
