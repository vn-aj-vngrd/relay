import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(),
  limit: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/features/agent/history", () => ({
  AgentHistoryError: class extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
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
        { error: (error as Error).message },
        { status: (error as { status: number }).status }
      );
    }
  },
}));
vi.mock("@/features/agent/response-feedback-service", () => ({
  getAgentReplyRatings: mocks.get,
  saveAgentReplyFeedback: mocks.save,
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.limit }));

import { GET, POST } from "./route";

const conversationId = "d6bb8798-b1a1-433f-8db5-0d585d5cb9e5";
const post = (body: unknown) =>
  new Request("https://relay.test/api/agent/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.limit.mockResolvedValue({ allowed: true });
  mocks.get.mockResolvedValue({ ratings: [] });
  mocks.save.mockResolvedValue({ messageId: "reply-a", rating: "good" });
});

it("requires one valid conversation ID to read ratings", async () => {
  expect(
    (await GET(new Request("https://relay.test/api/agent/feedback"))).status
  ).toBe(400);
  expect(
    (
      await GET(
        new Request(
          `https://relay.test/api/agent/feedback?conversationId=${conversationId}&extra=1`
        )
      )
    ).status
  ).toBe(400);
  expect(
    (
      await GET(
        new Request(
          `https://relay.test/api/agent/feedback?conversationId=${conversationId}`
        )
      )
    ).status
  ).toBe(200);
  expect(mocks.get).toHaveBeenCalledWith("owner", conversationId);
});

it("validates rating reasons and rate limits before storage", async () => {
  const input = {
    conversationId,
    messageId: "reply-a",
    rating: "good",
    reasons: ["answered"],
    details: "",
  };
  expect((await POST(post({ ...input, reasons: ["incorrect"] }))).status).toBe(
    400
  );
  expect(mocks.save).not.toHaveBeenCalled();
  mocks.limit.mockResolvedValueOnce({ allowed: false });
  expect((await POST(post(input))).status).toBe(429);
  expect(mocks.save).not.toHaveBeenCalled();
  expect((await POST(post(input))).status).toBe(200);
  expect(mocks.save).toHaveBeenCalledWith("owner", input);
});
