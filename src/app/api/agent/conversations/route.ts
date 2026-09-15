import { z } from "zod";
import {
  AgentHistoryError,
  createAgentConversation,
  listAgentConversations,
} from "@/features/agent/history";
import { withAgentHistory } from "@/features/agent/history-api";
import { readAgentJson } from "@/features/agent/request";
import { checkRateLimit } from "@/lib/rate-limit";

const titleSchema = z
  .object({ title: z.string().trim().min(1).max(100) })
  .strict();
export async function GET(request: Request) {
  return withAgentHistory(request, async (userId) => {
    const params = new URL(request.url).searchParams;
    const cursor = params.has("before")
      ? z
          .object({ at: z.iso.datetime(), id: z.uuid() })
          .safeParse({ at: params.get("before"), id: params.get("id") })
      : null;
    if (cursor && !cursor.success)
      throw new AgentHistoryError(400, "Invalid history cursor.");
    return listAgentConversations(userId, cursor?.data);
  });
}
export async function POST(request: Request) {
  return withAgentHistory(request, async (userId) => {
    const input = titleSchema.safeParse(await readAgentJson(request, 2000));
    if (!input.success)
      throw new AgentHistoryError(400, "Use a title of 1–100 characters.");
    const limit = await checkRateLimit(
      { scope: "agent-history-create", limit: 30, windowSeconds: 3600 },
      `user:${userId}`
    );
    if (!limit.allowed)
      throw new AgentHistoryError(
        429,
        "Chat creation limit reached. Try again later."
      );
    return createAgentConversation(userId, input.data.title);
  });
}
