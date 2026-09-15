import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agentSettings } from "@/db/schema";
import { defaultAgentLimits, type PublicAgentOffer } from "./allowance";

export async function getPublicAgentOffer(): Promise<PublicAgentOffer> {
  try {
    // Public projections never load provider credentials or instructions.
    const row = await db.query.agentSettings.findFirst({
      where: eq(agentSettings.id, "global"),
      columns: {
        enabled: true,
        freeMessages: true,
        plusMessages: true,
        proMessages: true,
      },
    });
    return row ?? { ...defaultAgentLimits, enabled: false };
  } catch {
    return { ...defaultAgentLimits, enabled: false };
  }
}
