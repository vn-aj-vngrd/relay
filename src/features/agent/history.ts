import "server-only";
import {
  and,
  desc,
  eq,
  gt,
  isNotNull,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db/client";
import { agentConversations, users } from "@/db/schema";
import { agentMessageMaxLength } from "./constants";
import type {
  AgentConversation,
  AgentConversationSummary,
  SavedAgentMessage,
} from "./history-types";
import type { AgentWork } from "./work";

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
  archivedAt: agentConversations.archivedAt,
  activeRequestId: agentConversations.activeRequestId,
  activeUntil: agentConversations.activeUntil,
  lastRole: sql<string | null>`${agentConversations.messages} -> -1 ->> 'role'`,
  lastInterrupted: sql<boolean>`${agentConversations.messages} -> -1 ->> 'interrupted' = 'true'`,
};
const summary = (row: {
  id: string;
  title: string;
  updatedAt: Date;
  archivedAt: Date | null;
  activeRequestId: string | null;
  activeUntil: Date | null;
  lastRole: string | null;
  lastInterrupted: boolean | null;
}): AgentConversationSummary => ({
  id: row.id,
  title: row.title,
  updatedAt: row.updatedAt.toISOString(),
  archivedAt: row.archivedAt?.toISOString() ?? null,
  status:
    row.activeRequestId && row.activeUntil && row.activeUntil > new Date()
      ? "working"
      : row.lastRole === "assistant"
        ? row.lastInterrupted
          ? "failed"
          : "done"
        : "idle",
});

export async function listAgentConversations(
  userId: string,
  before?: { at: string; id: string },
  archived = false
) {
  const rows = await db
    .select(summaryColumns)
    .from(agentConversations)
    .where(
      and(
        eq(agentConversations.userId, userId),
        archived
          ? isNotNull(agentConversations.archivedAt)
          : isNull(agentConversations.archivedAt),
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
export async function createAgentConversation(
  userId: string,
  title: string,
  requestId: string
) {
  return db.transaction(async (tx) => {
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");
    const [active] = await tx
      .select({ id: agentConversations.id })
      .from(agentConversations)
      .where(
        and(
          eq(agentConversations.userId, userId),
          isNotNull(agentConversations.activeRequestId),
          gt(agentConversations.activeUntil, new Date())
        )
      )
      .limit(1);
    if (active)
      throw new AgentHistoryError(
        409,
        "Wait for Agent to finish before starting a new chat."
      );
    const [row] = await tx
      .insert(agentConversations)
      .values({
        userId,
        title,
        activeRequestId: requestId,
        activeUntil: new Date(Date.now() + 30_000),
      })
      .returning(summaryColumns);
    return summary(row);
  });
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
    ...summary({
      ...row,
      lastRole: row.messages.at(-1)?.role ?? null,
      lastInterrupted: row.messages.at(-1)?.interrupted ?? null,
    }),
    messages: row.messages,
    pending: Boolean(
      row.activeRequestId &&
        row.activeUntil &&
        row.activeUntil.getTime() > Date.now()
    ),
  };
}
export async function readAgentConversationSummary(userId: string, id: string) {
  const [row] = await db
    .select(summaryColumns)
    .from(agentConversations)
    .where(owned(userId, id));
  if (!row) throw new AgentHistoryError(404, "Chat not found.");
  return summary(row);
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
export async function setAgentConversationArchived(
  userId: string,
  id: string,
  archived: boolean
) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        activeRequestId: agentConversations.activeRequestId,
        activeUntil: agentConversations.activeUntil,
      })
      .from(agentConversations)
      .where(owned(userId, id))
      .for("update");
    if (!current) throw new AgentHistoryError(404, "Chat not found.");
    if (
      current.activeRequestId &&
      current.activeUntil &&
      current.activeUntil > new Date()
    )
      throw new AgentHistoryError(
        409,
        "Wait for this reply before archiving its chat."
      );
    const [row] = await tx
      .update(agentConversations)
      .set({ archivedAt: archived ? new Date() : null })
      .where(owned(userId, id))
      .returning(summaryColumns);
    return summary(row);
  });
}
export async function deleteAgentConversation(userId: string, id: string) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        activeRequestId: agentConversations.activeRequestId,
        activeUntil: agentConversations.activeUntil,
      })
      .from(agentConversations)
      .where(owned(userId, id))
      .for("update");
    if (!row) throw new AgentHistoryError(404, "Chat not found.");
    if (row.activeRequestId && row.activeUntil && row.activeUntil > new Date())
      throw new AgentHistoryError(
        409,
        "Wait for this reply before deleting its chat."
      );
    await tx.delete(agentConversations).where(owned(userId, id));
  });
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
    // Serialize starts across this account, including requests from other tabs.
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");
    const [row] = await tx
      .select()
      .from(agentConversations)
      .where(owned(userId, id))
      .for("update");
    if (!row) throw new AgentHistoryError(404, "Chat not found.");
    if (row.archivedAt)
      throw new AgentHistoryError(
        409,
        "Restore this chat before sending a message."
      );
    const reservedForThisTurn =
      row.activeRequestId === requestId && row.messages.length === 0;
    if (
      row.activeRequestId &&
      row.activeUntil &&
      row.activeUntil.getTime() > Date.now() &&
      !reservedForThisTurn
    )
      throw new AgentHistoryError(
        409,
        "A reply is already in progress in this chat."
      );
    const [otherActive] = await tx
      .select({ id: agentConversations.id })
      .from(agentConversations)
      .where(
        and(
          eq(agentConversations.userId, userId),
          ne(agentConversations.id, id),
          isNotNull(agentConversations.activeRequestId),
          gt(agentConversations.activeUntil, new Date())
        )
      )
      .limit(1);
    if (otherActive)
      throw new AgentHistoryError(
        409,
        "Wait for the active Agent reply before starting another."
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
    return messages
      .filter((message) => message.content.trim())
      .slice(-24)
      .map(({ role, content }) => ({
        role,
        content: content.slice(0, agentMessageMaxLength),
      }));
  });
}
export async function releaseUnstartedAgentTurn(
  userId: string,
  id: string,
  requestId: string
) {
  await db
    .update(agentConversations)
    .set({ activeRequestId: null, activeUntil: null })
    .where(
      and(
        owned(userId, id),
        eq(agentConversations.activeRequestId, requestId),
        sql`jsonb_array_length(${agentConversations.messages}) = 0`
      )
    );
}
export async function finishAgentTurn(
  userId: string,
  id: string,
  requestId: string,
  answer: string,
  interrupted = false,
  work?: AgentWork
) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(agentConversations)
      .where(owned(userId, id))
      .for("update");
    // Deletion must not resurrect a transcript; stale workers must not overwrite newer turns.
    if (!row || row.activeRequestId !== requestId) return;
    const messages: SavedAgentMessage[] =
      answer.trim() || work
        ? [
            ...row.messages,
            {
              id: `${requestId}-answer`,
              role: "assistant",
              content: answer.slice(0, 32_000),
              interrupted,
              createdAt: new Date().toISOString(),
              ...(work ? { work } : {}),
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
