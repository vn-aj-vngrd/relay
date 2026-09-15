import type { PlanId } from "@/features/billing/domain";

export const defaultAgentLimits = {
  freeMessages: 50,
  plusMessages: 250,
  proMessages: 750,
};
export type AgentLimits = typeof defaultAgentLimits;
export type PublicAgentOffer = AgentLimits & { enabled: boolean };
export type AgentUsageSummary = {
  plan: PlanId;
  limit: number;
  used: number;
  reserved: number;
  remaining: number;
  resetsAt: string;
};

export function agentMessageLimit(plan: PlanId, limits: AgentLimits) {
  return plan === "free"
    ? limits.freeMessages
    : plan === "plus"
      ? limits.plusMessages
      : limits.proMessages;
}

export function summarizeAgentUsage(
  allowance: { plan: PlanId; end: Date },
  limits: AgentLimits,
  used: number,
  reserved: number
): AgentUsageSummary {
  const limit = agentMessageLimit(allowance.plan, limits);
  return {
    plan: allowance.plan,
    limit,
    used,
    reserved,
    remaining: Math.max(0, limit - used - reserved),
    resetsAt: allowance.end.toISOString(),
  };
}
