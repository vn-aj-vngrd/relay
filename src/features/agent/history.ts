import "server-only";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { db } from "@/db/client";
import { agentConversations } from "@/db/schema";
import { agentMessageMaxLength } from "./constants";
import type {
  AgentConversation,
  AgentConversationSummary,
  SavedAgentMessage,
} from "./history-types";

export class AgentHistoryError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
const owned = (userId: string, id: string) =>
  and(eq(agentConversations.id, id), eq(agentConversations.userId, userId));
const summaryColumns = {
  id: agentConversations.id,
  title: agentConversations.title,
  updatedAt: agentConversations.updatedAt,
};
const summary = (row: {
  id: string;
  title: string;
  updatedAt: Date;
}): AgentConversationSummary => ({
  ...row,
  updatedAt: row.updatedAt.toISOString(),
});

export async function listAgentConversations(
  userId: string,
  before?: { at: string; id: string }
) {
  const rows = await db
    .select(summaryColumns)
    .from(agentConversations)
    .where(
      and(
        eq(agentConversations.userId, userId),
        before
          ? or(
              lt(agentConversations.updatedAt, new Date(before.at)),
              and(
                eq(agentConversations.updatedAt, new Date(before.at)),
                lt(agentConversations.id, before.id)
              )
            )
          : undefined
      )
    )
    .orderBy(desc(agentConversations.updatedAt), desc(agentConversations.id))
    .limit(31);
  return {
    conversations: rows.slice(0, 30).map(summary),
    hasMore: rows.length > 30,
  };
}
export async function createAgentConversation(userId: string, title: string) {
  const [row] = await db
    .insert(agentConversations)
    .values({ userId, title })
    .returning(summaryColumns);
  return summary(row);
}
export async function readAgentConversation(
  userId: string,
  id: string
): Promise<AgentConversation> {
  const [row] = await db
    .select()
    .from(agentConversations)
    .where(owned(userId, id));
  if (!row) throw new AgentHistoryError(404, "Chat not found.");
  return {
    ...summary(row),
    messages: row.messages,
    pending: Boolean(
      row.activeRequestId &&
        row.activeUntil &&
        row.activeUntil.getTime() > Date.now()
    ),
  };
}
export async function renameAgentConversation(
  userId: string,
  id: string,
  title: string
) {
  const [row] = await db
    .update(agentConversations)
    .set({ title, updatedAt: new Date() })
    .where(owned(userId, id))
    .returning(summaryColumns);
  if (!row) throw new AgentHistoryError(404, "Chat not found.");
  return summary(row);
}
export async function deleteAgentConversation(userId: string, id: string) {
  const rows = await db
    .delete(agentConversations)
    .where(owned(userId, id))
    .returning({ id: agentConversations.id });
  if (!rows.length) throw new AgentHistoryError(404, "Chat not found.");
}

// Lock only this owner's conversation. A lease recovers interrupted serverless requests.
export async function beginAgentTurn(
  userId: string,
  id: string,
  requestId: string,
  prompt: string,
  options: { messageId?: string; retry?: boolean } = {}
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(agentConversations)
      .where(owned(userId, id))
      .for("update");
    if (!row) throw new AgentHistoryError(404, "Chat not found.");
    if (
      row.activeRequestId &&
      row.activeUntil &&
      row.activeUntil.getTime() > Date.now()
    )
      throw new AgentHistoryError(
        409,
        "A reply is already in progress in this chat."
      );
    const messageId = options.messageId ?? requestId;
    const existingIndex = row.messages.findIndex(
      (message) => message.id === messageId
    );
    let messages: SavedAgentMessage[];
    if (existingIndex >= 0) {
      const existing = row.messages[existingIndex];
      // Only the latest user turn may be retried; stale tabs cannot erase newer turns.
      if (
        !options.retry ||
        existing.role !== "user" ||
        existing.content !== prompt ||
        existingIndex !==
          row.messages.findLastIndex((message) => message.role === "user")
      )
        throw new AgentHistoryError(
          409,
          "This chat has changed. Reopen it before retrying."
        );
      messages = row.messages.slice(0, existingIndex + 1);
    } else {
      // Requests rejected before persistence still need their first saved user turn.
      if (row.messages.length > 98)
        throw new AgentHistoryError(
          409,
          "This chat is full. Start a new chat."
        );
      messages = [
        ...row.messages,
        {
          id: messageId,
          role: "user",
          content: prompt,
          createdAt: new Date().toISOString(),
        },
      ];
    }
    await tx
      .update(agentConversations)
      .set({
        messages,
        activeRequestId: requestId,
        activeUntil: new Date(Date.now() + 90_000),
        updatedAt: new Date(),
      })
      .where(owned(userId, id));
    return messages.slice(-24).map(({ role, content }) => ({
      role,
      content: content.slice(0, agentMessageMaxLength),
    }));
  });
}
export async function finishAgentTurn(
  userId: string,
  id: string,
  requestId: string,
  answer: string,
  interrupted = false
) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(agentConversations)
      .where(owned(userId, id))
      .for("update");
    // Deletion must not resurrect a transcript; stale workers must not overwrite newer turns.
    if (!row || row.activeRequestId !== requestId) return;
    const messages: SavedAgentMessage[] = answer.trim()
      ? [
          ...row.messages,
          {
            id: `${requestId}-answer`,
            role: "assistant",
            content: answer.slice(0, 32_000),
            interrupted,
            createdAt: new Date().toISOString(),
          },
        ]
      : row.messages;
    await tx
      .update(agentConversations)
      .set({
        messages,
        activeRequestId: null,
        activeUntil: null,
        updatedAt: new Date(),
      })
      .where(owned(userId, id));
  });
}
