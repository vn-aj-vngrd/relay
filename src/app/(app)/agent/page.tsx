import type { AgentUsageSummary } from "@/features/agent/allowance";
import { AgentChat } from "@/features/agent/chat";
import { readAgentSettings } from "@/features/agent/config";
import { agentCredentialStorageReady } from "@/features/agent/credentials";
import { getAgentUsage } from "@/features/agent/usage";
import { requireUser } from "@/features/auth/session";

export const metadata = { title: "Agent · Relay" };
export default async function AgentPage() {
  const user = await requireUser("/agent");
  let usage: AgentUsageSummary | null = null;
  let available = false;
  try {
    const { config, encryptedApiKey } = await readAgentSettings();
    usage = await getAgentUsage(user.id, config);
    available =
      config.enabled &&
      Boolean(encryptedApiKey && config.model) &&
      agentCredentialStorageReady();
  } catch {
    /* Unconfigured or unapplied setup fails closed. */
  }
  return <AgentChat available={available} initialUsage={usage} />;
}
