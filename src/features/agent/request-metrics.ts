import "server-only";
import { db } from "@/db/client";
import { agentRequestMetrics } from "@/db/schema";

export type AgentRequestMetric = {
  id: string;
  status: "completed" | "failed" | "stopped";
  errorKind: "generation" | "tool" | null;
  durationMs: number;
  firstTextMs: number | null;
  toolCalls: number;
  toolFailures: number;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsdMicros: number | null;
};

export async function recordAgentRequestMetric(metric: AgentRequestMetric) {
  await db.insert(agentRequestMetrics).values(metric).onConflictDoNothing();
}

export function openRouterCostMicros(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object" || !("openrouter" in metadata))
    return null;
  const openrouter = metadata.openrouter;
  if (!openrouter || typeof openrouter !== "object" || !("usage" in openrouter))
    return null;
  const usage = openrouter.usage;
  if (!usage || typeof usage !== "object" || !("cost" in usage)) return null;
  const cost = usage.cost;
  if (typeof cost !== "number" || !Number.isFinite(cost) || cost < 0)
    return null;
  const micros = Math.round(cost * 1_000_000);
  return micros <= 2_147_483_647 ? micros : null;
}
