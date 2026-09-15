import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => {
  const rows: unknown[] = [];
  const where = vi.fn();
  const set = vi.fn();
  const query: Promise<unknown[]> & {
    from: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    for: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    returning: ReturnType<typeof vi.fn>;
  } = Object.assign(Promise.resolve(rows), {
    from: vi.fn(() => query),
    where: where.mockImplementation(() => query),
    for: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    limit: vi.fn(() => query),
    set: set.mockImplementation(() => query),
    returning: vi.fn(() => query),
  });
  const database = {
    select: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
  };
  return { rows, where, set, query, database };
});
vi.mock("@/db/client", () => ({
  db: {
    ...mocks.database,
    transaction: (fn: (tx: typeof mocks.database) => Promise<unknown>) =>
      fn(mocks.database),
  },
}));

import {
  beginAgentTurn,
  deleteAgentConversation,
  finishAgentTurn,
  readAgentConversation,
  renameAgentConversation,
} from "./history";

const row = () => ({
  id: "conversation",
  userId: "owner",
  title: "Game",
  messages: [],
  activeRequestId: null,
  activeUntil: null,
  updatedAt: new Date(),
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.rows.splice(0);
});

describe("private Agent history", () => {
  it.each([readAgentConversation, deleteAgentConversation])(
    "scopes lookup and deletion to the authenticated owner",
    async (operation) => {
      await expect(operation("owner", "foreign-chat")).rejects.toMatchObject({
        status: 404,
      });
      const sql = new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0]);
      expect(sql.sql).toContain('"user_id"');
      expect(sql.params).toEqual(["foreign-chat", "owner"]);
    }
  );
  it("does not rename another account's chat", async () => {
    await expect(
      renameAgentConversation("owner", "foreign-chat", "New title")
    ).rejects.toMatchObject({ status: 404 });
    expect(
      new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0]).params
    ).toEqual(["foreign-chat", "owner"]);
  });
  it("serializes turns and refuses a second in-progress request", async () => {
    mocks.rows.push({
      ...row(),
      activeRequestId: "busy",
      activeUntil: new Date(Date.now() + 60_000),
    });
    await expect(
      beginAgentTurn("owner", "conversation", "second", "Question")
    ).rejects.toMatchObject({ status: 409 });
    expect(mocks.query.for).toHaveBeenCalledWith("update");
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("bounds history and recovers an expired request lease", async () => {
    mocks.rows.push({
      ...row(),
      activeRequestId: "old",
      activeUntil: new Date(0),
      messages: Array.from({ length: 30 }, (_, index) => ({
        id: String(index),
        role: "user",
        content: "x".repeat(4100),
      })),
    });
    const messages = await beginAgentTurn(
      "owner",
      "conversation",
      "new",
      "Next game?"
    );
    expect(messages).toHaveLength(24);
    expect(messages[0].content).toHaveLength(4000);
    expect(messages.at(-1)?.content).toBe("Next game?");
  });
  it.each([false, true])(
    "retries a saved turn without duplicating its question (partial: %s)",
    async (partial) => {
      const question = {
        id: "question-id",
        role: "user",
        content: "Question",
        createdAt: "2026-09-15T12:00:00Z",
      };
      mocks.rows.push({
        ...row(),
        messages: [
          question,
          ...(partial
            ? [
                {
                  id: "old-answer",
                  role: "assistant",
                  content: "Partial",
                  interrupted: true,
                },
              ]
            : []),
        ],
      });
      const messages = await beginAgentTurn(
        "owner",
        "conversation",
        "retry-request",
        "Question",
        { messageId: "question-id", retry: true }
      );
      expect(messages).toEqual([{ role: "user", content: "Question" }]);
      expect(mocks.set).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [question],
          activeRequestId: "retry-request",
        })
      );
    }
  );
  it("saves a retry that failed before its question was persisted", async () => {
    mocks.rows.push(row());
    await beginAgentTurn("owner", "conversation", "retry-request", "Question", {
      messageId: "question-id",
      retry: true,
    });
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          expect.objectContaining({ id: "question-id", content: "Question" }),
        ],
      })
    );
  });
  it("rejects a stale retry without deleting newer messages", async () => {
    mocks.rows.push({
      ...row(),
      messages: [
        { id: "old", role: "user", content: "Question" },
        { id: "new", role: "user", content: "New question" },
      ],
    });
    await expect(
      beginAgentTurn("owner", "conversation", "retry-request", "Question", {
        messageId: "old",
        retry: true,
      })
    ).rejects.toMatchObject({ status: 409 });
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("does not resurrect a deleted chat or overwrite a newer turn", async () => {
    await finishAgentTurn("owner", "conversation", "old", "Answer");
    mocks.rows.push({ ...row(), activeRequestId: "new" });
    await finishAgentTurn("owner", "conversation", "old", "Answer");
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("records a partial reply as interrupted and clears its lease", async () => {
    mocks.rows.push({ ...row(), activeRequestId: "request" });
    await finishAgentTurn("owner", "conversation", "request", "Partial", true);
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        activeRequestId: null,
        messages: [
          expect.objectContaining({ content: "Partial", interrupted: true }),
        ],
      })
    );
  });
});
