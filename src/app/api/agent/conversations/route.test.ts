import { beforeEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn() }));
const mocks = vi.hoisted(() => ({
  summaries: vi.fn(),
  list: vi.fn(),
}));
vi.mock("@/features/agent/history", () => ({
  AgentHistoryError: class extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  createAgentConversation: vi.fn(),
  listAgentConversations: mocks.list,
  listAgentConversationSummaries: mocks.summaries,
}));
vi.mock("@/features/agent/history-api", () => ({
  withAgentHistory: async (
    _request: Request,
    action: (userId: string) => Promise<unknown>
  ) => {
    try {
      return Response.json(await action("owner"));
    } catch (error) {
      return Response.json(
        {},
        { status: (error as { status: number }).status }
      );
    }
  },
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.summaries.mockResolvedValue({ conversations: [] });
});

it("reads only requested owner-scoped chat summaries", async () => {
  const id = "d6bb8798-b1a1-433f-8db5-0d585d5cb9e5";
  const response = await GET(
    new Request(`https://relay.test/api/agent/conversations?ids=${id}`)
  );
  expect(response.status).toBe(200);
  expect(mocks.summaries).toHaveBeenCalledWith("owner", [id]);
  expect(mocks.list).not.toHaveBeenCalled();
});

it("rejects invalid or oversized summary batches", async () => {
  const id = "d6bb8798-b1a1-433f-8db5-0d585d5cb9e5";
  for (const query of [
    "ids=not-an-id",
    `ids=${Array.from({ length: 101 }, () => id).join(",")}`,
    `ids=${id}&archived=true`,
  ]) {
    const response = await GET(
      new Request(`https://relay.test/api/agent/conversations?${query}`)
    );
    expect(response.status).toBe(400);
  }
  expect(mocks.summaries).not.toHaveBeenCalled();
});
