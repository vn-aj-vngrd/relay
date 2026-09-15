import "server-only";
import { and, eq, gt, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { agentMessageUsage } from "@/db/schema";
import {
  type BillingTransaction,
  getAccountAllowance,
  lockBillingAccount,
} from "@/features/billing/usage";
import { type AgentLimits, summarizeAgentUsage } from "./allowance";

export class AgentQuotaError extends Error {}
export class AgentDuplicateRequestError extends Error {}

export async function getAgentUsage(
  userId: string,
  limits: AgentLimits,
  connection: BillingTransaction | typeof db = db,
  now = new Date()
) {
  const allowance = await getAccountAllowance(userId, connection, now);
  const [counts] = await connection
    .select({
      used: sql<number>`count(*) filter (where ${agentMessageUsage.status} = 'charged')::int`,
      reserved: sql<number>`count(*) filter (where ${agentMessageUsage.status} = 'reserved' and ${agentMessageUsage.expiresAt} > ${now})::int`,
    })
    .from(agentMessageUsage)
    .where(
      and(
        eq(agentMessageUsage.userId, userId),
        gte(agentMessageUsage.createdAt, allowance.start),
        lt(agentMessageUsage.createdAt, allowance.end)
      )
    );
  return summarizeAgentUsage(
    allowance,
    limits,
    counts?.used ?? 0,
    counts?.reserved ?? 0
  );
}

export async function reserveAgentMessage(
  userId: string,
  id: string,
  limits: AgentLimits
) {
  return db.transaction(async (tx) => {
    // Reuse billing's account lock so upgrades and concurrent requests serialize.
    await lockBillingAccount(tx, userId);
    const now = new Date();
    const previous = await tx.query.agentMessageUsage.findFirst({
      where: eq(agentMessageUsage.id, id),
    });
    // Do not reuse identifiers, even for refunded attempts. Retry uses a fresh ID.
    if (previous)
      throw new AgentDuplicateRequestError("Request already received.");
    const usage = await getAgentUsage(userId, limits, tx, now);
    if (!usage.remaining)
      throw new AgentQuotaError("Monthly Agent allowance reached.");
    await tx.insert(agentMessageUsage).values({
      id,
      userId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 120_000),
      status: "reserved",
    });
    return usage;
  });
}

export async function chargeAgentMessage(userId: string, id: string) {
  const [charged] = await db
    .update(agentMessageUsage)
    .set({ status: "charged" })
    .where(
      and(
        eq(agentMessageUsage.id, id),
        eq(agentMessageUsage.userId, userId),
        eq(agentMessageUsage.status, "reserved"),
        gt(agentMessageUsage.expiresAt, new Date())
      )
    )
    .returning({ id: agentMessageUsage.id });
  if (!charged) throw new Error("Message reservation expired");
}

export async function releaseAgentMessage(userId: string, id: string) {
  await db
    .update(agentMessageUsage)
    .set({ status: "released" })
    .where(
      and(
        eq(agentMessageUsage.id, id),
        eq(agentMessageUsage.userId, userId),
        eq(agentMessageUsage.status, "reserved")
      )
    );
}
