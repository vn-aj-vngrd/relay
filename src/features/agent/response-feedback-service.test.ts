import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  conversation: vi.fn(),
  where: vi.fn(),
  values: vi.fn(),
  upsert: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/db/client", () => ({
  db: {
    query: { agentConversations: { findFirst: mocks.conversation } },
    select: () => ({ from: () => ({ where: mocks.where }) }),
    insert: () => ({ values: mocks.values }),
  },
}));

import type { AgentReplyFeedbackInput } from "./response-feedback";
import {
  getAgentReplyRatings,
  saveAgentReplyFeedback,
} from "./response-feedback-service";

const input = {
  conversationId: "d6bb8798-b1a1-433f-8db5-0d585d5cb9e5",
  messageId: "reply-a",
  rating: "bad" as const,
  reasons: ["incorrect"],
  details: "Wrong game time",
} satisfies AgentReplyFeedbackInput;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.conversation.mockResolvedValue({
    messages: [
      { id: "question-a", role: "user", content: "Private question" },
      { id: "reply-a", role: "assistant", content: "Private answer" },
    ],
  });
  mocks.values.mockReturnValue({ onConflictDoUpdate: mocks.upsert });
  mocks.upsert.mockResolvedValue(undefined);
});

describe("Agent reply feedback scope", () => {
  it("refuses another user's chat or a user message", async () => {
    mocks.conversation.mockResolvedValueOnce(null);
    await expect(saveAgentReplyFeedback("owner", input)).rejects.toMatchObject({
      status: 404,
    });
    expect(mocks.values).not.toHaveBeenCalled();

    await expect(
      saveAgentReplyFeedback("owner", { ...input, messageId: "question-a" })
    ).rejects.toMatchObject({ status: 404 });
    expect(mocks.values).not.toHaveBeenCalled();

    const query = mocks.conversation.mock.calls[0][0].where;
    expect(new PgDialect().sqlToQuery(query).params).toEqual([
      input.conversationId,
      "owner",
    ]);
  });

  it("stores one reviewable rating without question or answer content", async () => {
    expect(await saveAgentReplyFeedback("owner", input)).toEqual({
      messageId: "reply-a",
      rating: "bad",
    });
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "owner",
        agentConversationId: input.conversationId,
        agentMessageId: "reply-a",
        agentRating: "bad",
        agentReasons: ["incorrect"],
        description: "Reasons: Incorrect details\nDetails: Wrong game time",
        status: "new",
        contactAllowed: false,
      })
    );
    expect(JSON.stringify(mocks.values.mock.calls[0][0])).not.toContain(
      "Private"
    );
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({ agentRating: "bad", status: "new" }),
      })
    );
  });

  it("reads ratings only after checking chat ownership", async () => {
    mocks.where.mockResolvedValue([
      { messageId: "reply-a", rating: "good" },
      { messageId: null, rating: null },
    ]);
    expect(await getAgentReplyRatings("owner", input.conversationId)).toEqual({
      ratings: [{ messageId: "reply-a", rating: "good" }],
    });
    expect(mocks.conversation).toHaveBeenCalledTimes(1);
    expect(mocks.conversation.mock.calls[0][0].columns).toEqual({ id: true });
  });
});
