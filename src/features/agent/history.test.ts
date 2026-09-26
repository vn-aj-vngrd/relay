import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => {
  const rows: unknown[] = [];
  const activeRows: unknown[] = [];
  const where = vi.fn();
  const set = vi.fn();
  const query: Promise<unknown[]> & {
    from: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    for: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    values: ReturnType<typeof vi.fn>;
    returning: ReturnType<typeof vi.fn>;
  } = Object.assign(Promise.resolve(rows), {
    from: vi.fn(() => query),
    where: where.mockImplementation(() => query),
    for: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    limit: vi.fn(() => Promise.resolve(activeRows)),
    set: set.mockImplementation(() => query),
    values: vi.fn(() => query),
    returning: vi.fn(() => query),
  });
  const database = {
    select: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    insert: vi.fn(() => query),
  };
  return { rows, activeRows, where, set, query, database };
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
  createAgentConversation,
  deleteAgentConversation,
  finishAgentTurn,
  listAgentConversations,
  readAgentConversation,
  readAgentConversationSummary,
  releaseUnstartedAgentTurn,
  renameAgentConversation,
  setAgentConversationArchived,
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
  mocks.activeRows.splice(0);
});

describe("private Agent history", () => {
  it("separates Chats and Archived within the authenticated account", async () => {
    await listAgentConversations("owner");
    const current = new PgDialect().sqlToQuery(
      mocks.where.mock.calls.at(-1)![0]
    );
    expect(current.sql).toContain('"archived_at" is null');
    await listAgentConversations("owner", undefined, true);
    const archived = new PgDialect().sqlToQuery(
      mocks.where.mock.calls.at(-1)![0]
    );
    expect(archived.sql).toContain('"archived_at" is not null');
    expect(archived.params).toEqual(["owner"]);
  });
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
  it("allows only one active reply across an account's conversations", async () => {
    mocks.rows.push(row());
    mocks.activeRows.push({ id: "another-chat" });
    await expect(
      beginAgentTurn("owner", "conversation", "new", "Question")
    ).rejects.toMatchObject({ status: 409 });
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("does not create a second chat while an account reply is active", async () => {
    mocks.activeRows.push({ id: "working" });
    await expect(
      createAgentConversation("owner", "New chat", "request-one")
    ).rejects.toMatchObject({ status: 409 });
    expect(mocks.database.insert).not.toHaveBeenCalled();
  });
  it("reserves a first turn before another tab can create a chat", async () => {
    mocks.rows.push({
      ...row(),
      archivedAt: null,
      lastRole: null,
      lastInterrupted: false,
    });
    await createAgentConversation("owner", "New chat", "request-one");
    expect(mocks.query.values).toHaveBeenCalledWith({
      userId: "owner",
      title: "New chat",
      activeRequestId: "request-one",
      activeUntil: expect.any(Date),
    });
    mocks.activeRows.push({ id: "conversation" });
    await expect(
      createAgentConversation("owner", "Another chat", "request-two")
    ).rejects.toMatchObject({ status: 409 });
  });
  it("allows the matching reserved first turn once", async () => {
    mocks.rows.push({
      ...row(),
      activeRequestId: "request-one",
      activeUntil: new Date(Date.now() + 30_000),
    });
    await beginAgentTurn("owner", "conversation", "request-one", "Question");
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ activeRequestId: "request-one" })
    );
  });
  it("only releases an owned, unstarted matching first-turn reservation", async () => {
    await releaseUnstartedAgentTurn("owner", "conversation", "request-one");
    const predicate = new PgDialect().sqlToQuery(
      mocks.where.mock.calls.at(-1)![0]
    );
    expect(predicate.sql).toContain('"user_id"');
    expect(predicate.sql).toContain('"active_request_id"');
    expect(predicate.sql).toContain("jsonb_array_length");
    expect(predicate.params).toEqual(["conversation", "owner", "request-one"]);
    expect(mocks.set).toHaveBeenCalledWith({
      activeRequestId: null,
      activeUntil: null,
    });
  });
  it("reads one owned summary without loading messages", async () => {
    mocks.rows.push({
      ...row(),
      archivedAt: null,
      lastRole: "assistant",
      lastInterrupted: false,
    });
    const result = await readAgentConversationSummary("owner", "conversation");
    expect(result.status).toBe("done");
    expect(mocks.database.select).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.anything() })
    );
  });
  it("does not archive a chat with a live reply", async () => {
    mocks.rows.push({
      ...row(),
      activeRequestId: "working",
      activeUntil: new Date(Date.now() + 60_000),
    });
    await expect(
      setAgentConversationArchived("owner", "conversation", true)
    ).rejects.toMatchObject({ status: 409 });
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("archives an idle owner chat without deleting its messages", async () => {
    mocks.rows.push(row());
    await setAgentConversationArchived("owner", "conversation", true);
    expect(mocks.set).toHaveBeenCalledWith({ archivedAt: expect.any(Date) });
    expect(mocks.database.delete).not.toHaveBeenCalled();
  });
  it("restores an archived chat", async () => {
    mocks.rows.push({ ...row(), archivedAt: new Date() });
    await setAgentConversationArchived("owner", "conversation", false);
    expect(mocks.set).toHaveBeenCalledWith({ archivedAt: null });
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
  it("retains failed activity even when no answer was generated", async () => {
    mocks.rows.push({ ...row(), activeRequestId: "request" });
    const work = {
      startedAt: 1000,
      finishedAt: 2000,
      status: "failed" as const,
      entries: [],
    };
    await finishAgentTurn("owner", "conversation", "request", "", true, work);
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          expect.objectContaining({ content: "", interrupted: true, work }),
        ],
      })
    );
  });
});
