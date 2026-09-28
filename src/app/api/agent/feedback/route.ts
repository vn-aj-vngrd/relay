import { z } from "zod";
import { AgentHistoryError } from "@/features/agent/history";
import { withAgentHistory } from "@/features/agent/history-api";
import { readAgentJson } from "@/features/agent/request";
import { agentReplyFeedbackSchema } from "@/features/agent/response-feedback";
import {
  getAgentReplyRatings,
  saveAgentReplyFeedback,
} from "@/features/agent/response-feedback-service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  return withAgentHistory(request, async (userId) => {
    const params = new URL(request.url).searchParams;
    const conversationId = z.uuid().safeParse(params.get("conversationId"));
    if (!conversationId.success || params.size !== 1)
      throw new AgentHistoryError(400, "Invalid chat feedback request.");
    return getAgentReplyRatings(userId, conversationId.data);
  });
}

export async function POST(request: Request) {
  return withAgentHistory(request, async (userId) => {
    const input = agentReplyFeedbackSchema.safeParse(
      await readAgentJson(request, 10_000)
    );
    if (!input.success)
      throw new AgentHistoryError(400, "Choose a rating and feedback reason.");
    const limit = await checkRateLimit(
      { scope: "agent-response-feedback", limit: 20, windowSeconds: 3600 },
      `user:${userId}`
    );
    if (!limit.allowed)
      throw new AgentHistoryError(429, "Too many ratings. Try again later.");
    return saveAgentReplyFeedback(userId, input.data);
  });
}
