import { z } from "zod";
import {
  AgentHistoryError,
  deleteAgentConversation,
  readAgentConversation,
  renameAgentConversation,
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
  return withAgentHistory(request, async (userId) =>
    readAgentConversation(userId, await conversationId(context))
  );
}
export async function PATCH(request: Request, context: Context) {
  return withAgentHistory(request, async (userId) => {
    const id = await conversationId(context);
    const input = z
      .object({ title: z.string().trim().min(1).max(100) })
      .strict()
      .safeParse(await readAgentJson(request, 2000));
    if (!input.success)
      throw new AgentHistoryError(400, "Use a title of 1–100 characters.");
    return renameAgentConversation(userId, id, input.data.title);
  });
}
export async function DELETE(request: Request, context: Context) {
  return withAgentHistory(request, async (userId) => {
    await deleteAgentConversation(userId, await conversationId(context));
    return { deleted: true };
  });
}
