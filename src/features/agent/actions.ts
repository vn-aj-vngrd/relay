"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { adminAuditLogs, agentSettings } from "@/db/schema";
import type { AdminActionState } from "@/features/admin/actions";
import { requireAdmin } from "@/features/admin/auth";
import { decryptAgentKey, encryptAgentKey } from "./credentials";
import { agentConfigSchema } from "./validation";

export async function saveAgentSettings(
  _: AdminActionState,
  form: FormData
): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsed = agentConfigSchema.safeParse({
    requireZeroRetention: form.get("privacyMode") !== "provider",
    freeMessages: form.get("freeMessages") ?? undefined,
    plusMessages: form.get("plusMessages") ?? undefined,
    proMessages: form.get("proMessages") ?? undefined,
    enabled: form.get("enabled") === "on",
    model: form.get("model"),
    instructions: form.get("instructions"),
    allowGameData: form.get("allowGameData") === "on",
    allowHelp: form.get("allowHelp") === "on",
    maxOutputTokens: form.get("maxOutputTokens"),
    requestsPerHour: form.get("requestsPerHour"),
  });
  // Explicit keep mode ignores password-manager autofill during unrelated edits.
  const apiKey =
    form.get("keepKey") === "on" ? "" : String(form.get("apiKey") ?? "").trim();
  const removeKey = form.get("removeKey") === "on";
  if (
    !parsed.success ||
    (apiKey &&
      (!/^sk-or-[A-Za-z0-9_-]+$/.test(apiKey) || apiKey.length > 256)) ||
    (apiKey && removeKey)
  )
    return {
      error:
        "Check the model, limits and API key. Replace or remove the key, not both.",
    };
  try {
    await db.transaction(async (tx) => {
      // Serialize concurrent saves so a removed credential cannot be resurrected.
      await tx
        .insert(agentSettings)
        .values({ id: "global" })
        .onConflictDoNothing();
      const [existing] = await tx
        .select()
        .from(agentSettings)
        .where(eq(agentSettings.id, "global"))
        .for("update");
      const encryptedApiKey = removeKey
        ? null
        : apiKey
          ? encryptAgentKey(apiKey)
          : existing.encryptedApiKey;
      if (parsed.data.enabled) {
        if (
          !encryptedApiKey ||
          !parsed.data.model ||
          !(parsed.data.allowGameData || parsed.data.allowHelp)
        )
          throw new Error("Incomplete configuration");
        decryptAgentKey(encryptedApiKey);
      }
      await tx
        .update(agentSettings)
        .set({ ...parsed.data, encryptedApiKey, updatedAt: new Date() })
        .where(eq(agentSettings.id, "global"));
      await tx.insert(adminAuditLogs).values({
        actorUserId: actor.id,
        action: "agent.settings_updated",
        targetType: "agent_settings",
        targetId: "global",
        metadata: {
          enabled: parsed.data.enabled,
          requireZeroRetention: parsed.data.requireZeroRetention,
          freeMessages: parsed.data.freeMessages,
          plusMessages: parsed.data.plusMessages,
          proMessages: parsed.data.proMessages,
          credentialChanged: Boolean(apiKey || removeKey),
        },
      });
    });
  } catch {
    return {
      error:
        "Settings could not be saved. Enabling Agent requires a model, a readable API key and at least one capability. Check server encryption setup.",
    };
  }
  revalidatePath("/admin/agent");
  revalidatePath("/agent");
  revalidatePath("/");
  revalidatePath("/pricing");
  revalidatePath("/settings/plan");
  return { success: "Agent settings saved." };
}
