import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agentSettings } from "@/db/schema";
import { agentConfigSchema, defaultAgentConfig } from "./validation";

export async function readAgentSettings() {
  const row = await db.query.agentSettings.findFirst({
    where: eq(agentSettings.id, "global"),
  });
  return {
    config: row ? agentConfigSchema.parse(row) : defaultAgentConfig,
    encryptedApiKey: row?.encryptedApiKey ?? null,
  };
}
