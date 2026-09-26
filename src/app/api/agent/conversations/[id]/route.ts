import { z } from "zod";
import {
  AgentHistoryError,
  deleteAgentConversation,
  readAgentConversation,
  readAgentConversationSummary,
  renameAgentConversation,
  setAgentConversationArchived,
} from "@/features/agent/history";
import { withAgentHistory } from "@/features/agent/history-api";
import { readAgentJson } from "@/features/agent/request";

type Context = { params: Promise<{ id: string }> };
async function conversationId(context: Context) {
  const parsed = z.uuid().safeParse((await context.params).id);
  if (!parsed.success) throw new AgentHistoryError(404, "Chat not found.");
  return parsed.data;
}
export async function GET(request: Request, context: Context) {
  return withAgentHistory(request, async (userId) => {
    const id = await conversationId(context);
    return new URL(request.url).searchParams.get("summary") === "true"
      ? readAgentConversationSummary(userId, id)
      : readAgentConversation(userId, id);
  });
}
export async function PATCH(request: Request, context: Context) {
  return withAgentHistory(request, async (userId) => {
    const id = await conversationId(context);
    const input = z
      .union([
        z.object({ title: z.string().trim().min(1).max(100) }).strict(),
        z.object({ archived: z.boolean() }).strict(),
      ])
      .safeParse(await readAgentJson(request, 2000));
    if (!input.success)
      throw new AgentHistoryError(400, "Use a valid title or archive state.");
    return "title" in input.data
      ? renameAgentConversation(userId, id, input.data.title)
      : setAgentConversationArchived(userId, id, input.data.archived);
  });
}
export async function DELETE(request: Request, context: Context) {
  return withAgentHistory(request, async (userId) => {
    await deleteAgentConversation(userId, await conversationId(context));
    return { deleted: true };
  });
}
