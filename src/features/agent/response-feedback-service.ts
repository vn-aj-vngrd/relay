import "server-only";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { agentConversations, feedbackSubmissions } from "@/db/schema";
import { AgentHistoryError } from "./history";
import {
  type AgentReplyFeedbackInput,
  type AgentReplyRating,
  agentReplyFeedbackDescription,
} from "./response-feedback";

const ownedConversationFilter = (userId: string, conversationId: string) =>
  and(
    eq(agentConversations.id, conversationId),
    eq(agentConversations.userId, userId)
  );

async function ownedConversation(userId: string, conversationId: string) {
  const conversation = await db.query.agentConversations.findFirst({
    columns: { messages: true },
    where: ownedConversationFilter(userId, conversationId),
  });
  if (!conversation) throw new AgentHistoryError(404, "Chat not found.");
  return conversation;
}

export async function getAgentReplyRatings(
  userId: string,
  conversationId: string
) {
  const conversation = await db.query.agentConversations.findFirst({
    columns: { id: true },
    where: ownedConversationFilter(userId, conversationId),
  });
  if (!conversation) throw new AgentHistoryError(404, "Chat not found.");
  const ratings = await db
    .select({
      messageId: feedbackSubmissions.agentMessageId,
      rating: feedbackSubmissions.agentRating,
    })
    .from(feedbackSubmissions)
    .where(
      and(
        eq(feedbackSubmissions.userId, userId),
        eq(feedbackSubmissions.agentConversationId, conversationId)
      )
    );
  return {
    ratings: ratings.filter(
      (item): item is { messageId: string; rating: AgentReplyRating } =>
        Boolean(item.messageId) &&
        (item.rating === "good" || item.rating === "bad")
    ),
  };
}

export async function saveAgentReplyFeedback(
  userId: string,
  input: AgentReplyFeedbackInput
) {
  const conversation = await ownedConversation(userId, input.conversationId);
  const reply = conversation.messages.find(
    (message) => message.id === input.messageId
  );
  if (reply?.role !== "assistant" || !reply.content.trim())
    throw new AgentHistoryError(
      404,
      "This reply is not saved yet. Wait a moment and try again."
    );

  const now = new Date();
  const values = {
    userId,
    agentConversationId: input.conversationId,
    agentMessageId: input.messageId,
    agentRating: input.rating,
    agentReasons: input.reasons,
    type: "general" as const,
    area: "agent",
    title:
      input.rating === "good"
        ? "Helpful Agent reply"
        : "Agent reply needs work",
    description: agentReplyFeedbackDescription(input),
    pagePath: "/agent",
    contactAllowed: false,
    status: input.rating === "good" ? ("closed" as const) : ("new" as const),
    updatedAt: now,
  };
  await db
    .insert(feedbackSubmissions)
    .values(values)
    .onConflictDoUpdate({
      target: [
        feedbackSubmissions.userId,
        feedbackSubmissions.agentConversationId,
        feedbackSubmissions.agentMessageId,
      ],
      set: {
        agentRating: values.agentRating,
        agentReasons: values.agentReasons,
        title: values.title,
        description: values.description,
        status: values.status,
        reviewedById: null,
        reviewedAt: null,
        resolvedAt: null,
        updatedAt: now,
      },
    });
  revalidatePath("/feedback");
  revalidatePath("/admin/feedback");
  revalidatePath("/admin/agent");
  return { messageId: input.messageId, rating: input.rating };
}
