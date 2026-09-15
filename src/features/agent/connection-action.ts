"use server";
import type { AdminActionState } from "@/features/admin/actions";
import { requireAdmin } from "@/features/admin/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { readAgentSettings } from "./config";
import { probeAgentConnection } from "./connection-test";
import { agentReadiness } from "./readiness";

export async function testAgentConnection(
  _: AdminActionState,
  _form: FormData
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  try {
    const limit = await checkRateLimit(
      { scope: "agent-connection-test", limit: 3, windowSeconds: 60 },
      `user:${admin.id}`
    );
    if (!limit.allowed)
      return { error: "Wait a minute before testing the connection again." };
    const { config, encryptedApiKey } = await readAgentSettings();
    if (!encryptedApiKey || !config.model)
      return {
        error: "Save an API key and model before testing the connection.",
      };
    const readiness = agentReadiness(
      { ...config, enabled: true, allowHelp: true },
      encryptedApiKey
    );
    if (!readiness.ready)
      return {
        error:
          "The saved credential is not readable on this deployment. Check setup status and replace the key if needed.",
      };
    return await probeAgentConnection(
      config.model,
      encryptedApiKey,
      config.requireZeroRetention
    );
  } catch {
    return {
      error:
        "The connection test could not start. Check setup status and try again.",
    };
  }
}
