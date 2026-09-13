import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  currentSession: vi.fn(),
  select: vi.fn(),
  execute: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("@/features/auth/session", () => ({
  getCurrentUser: async () => null,
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: async () => ({ allowed: true }),
  requestIdentity: async () => "test",
}));
vi.mock("@/db/client", () => ({
  db: {
    query: { sessions: { findFirst: mocks.session } },
    transaction: async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        execute: mocks.execute,
        query: { sessions: { findFirst: mocks.currentSession } },
        select: mocks.select,
      }),
  },
}));

import { rsvpAction } from "./actions";

const session = {
  id: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
  status: "published",
  rosterLocked: false,
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue(session);
});
function form() {
  const data = new FormData();
  data.set("sessionId", session.id);
  data.set("choice", "going");
  data.set("guestName", "Agent Guest");
  return data;
}
describe("RSVP lifecycle concurrency", () => {
  it.each(["completed", "cancelled"])(
    "rejects a game that becomes %s while waiting for its lock",
    async (status) => {
      mocks.currentSession.mockResolvedValue({ ...session, status });
      expect(await rsvpAction({}, form())).toEqual({
        error: "This game is no longer accepting responses.",
      });
      expect(mocks.execute).toHaveBeenCalledOnce();
      expect(mocks.select).not.toHaveBeenCalled();
    }
  );
  it("respects a roster closed after the initial page read", async () => {
    mocks.currentSession.mockResolvedValue({ ...session, rosterLocked: true });
    expect(await rsvpAction({}, form())).toEqual({
      error:
        "The host has closed responses. Refresh to see the current roster.",
    });
    expect(mocks.select).not.toHaveBeenCalled();
  });
});
