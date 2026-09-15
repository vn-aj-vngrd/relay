import type { AgentUsageSummary } from "@/features/agent/allowance";
import { AgentChat } from "@/features/agent/chat";
import { readAgentSettings } from "@/features/agent/config";
import { agentReadiness } from "@/features/agent/readiness";
import { getAgentUsage } from "@/features/agent/usage";
import { requireUser } from "@/features/auth/session";

export const metadata = { title: "Agent" };
export default async function AgentPage() {
  const user = await requireUser("/agent");
  let usage: AgentUsageSummary | null = null;
  let available = false;
  let unavailableReason =
    "Agent is temporarily unavailable. Please try again later.";
  try {
    const { config, encryptedApiKey } = await readAgentSettings();
    const readiness = agentReadiness(config, encryptedApiKey);
    if (!readiness.ready) {
      unavailableReason = config.enabled
        ? "Agent setup needs attention. Please contact an administrator."
        : "Agent is not available yet. You can still browse your games and Help Center.";
    } else {
      unavailableReason =
        "Agent message usage is temporarily unavailable. Please try again later.";
      usage = await getAgentUsage(user.id, config);
      available = true;
    }
  } catch {
    /* Unconfigured or unapplied setup fails closed. */
  }
  return (
    <AgentChat
      available={available}
      initialUsage={usage}
      unavailableReason={unavailableReason}
    />
  );
}
