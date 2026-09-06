import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  session: vi.fn(),
  membership: vi.fn(),
  values: vi.fn(),
  conflict: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.user }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn() }));
vi.mock("@/db/client", () => ({
  db: {
    query: {
      sessions: { findFirst: mocks.session },
      sessionPlayers: { findFirst: mocks.membership },
    },
    insert: () => ({ values: mocks.values }),
  },
}));

import { dismissCreatedGameShare } from "./actions";

const sessionId = "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7";
function form(id = sessionId) {
  const data = new FormData();
  data.set("sessionId", id);
  data.set("userId", "forged-user");
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: "host" });
  mocks.session.mockResolvedValue({
    id: sessionId,
    hostId: "host",
    status: "published",
  });
  mocks.membership.mockResolvedValue(null);
  mocks.values.mockReturnValue({ onConflictDoNothing: mocks.conflict });
  mocks.conflict.mockResolvedValue(undefined);
});

describe("dismissCreatedGameShare", () => {
  it("persists an idempotent dismissal scoped to the authenticated account and game", async () => {
    expect(await dismissCreatedGameShare({}, form())).toEqual({
      success: true,
    });
    expect(await dismissCreatedGameShare({}, form())).toEqual({
      success: true,
    });
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "created_game_dismissed",
        userId: "host",
        sessionId,
        dedupeKey: `session:${sessionId}:created-game-dismissed:host`,
      })
    );
    expect(mocks.conflict).toHaveBeenCalledTimes(2);
    expect(mocks.revalidate).toHaveBeenCalledWith(`/games/${sessionId}`);
  });

  it("allows a current co-host to dismiss only their own prompt", async () => {
    mocks.user.mockResolvedValue({ id: "cohost" });
    mocks.membership.mockResolvedValue({ role: "cohost" });
    expect(await dismissCreatedGameShare({}, form())).toEqual({
      success: true,
    });
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "cohost" })
    );
  });

  it("rejects a player without manager authority", async () => {
    mocks.user.mockResolvedValue({ id: "player" });
    mocks.membership.mockResolvedValue({ role: "player", rsvp: "going" });
    expect(await dismissCreatedGameShare({}, form())).toHaveProperty("error");
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("rejects invalid or missing games", async () => {
    expect(await dismissCreatedGameShare({}, form("invalid"))).toHaveProperty(
      "error"
    );
    expect(mocks.session).not.toHaveBeenCalled();
    mocks.session.mockResolvedValue(null);
    expect(await dismissCreatedGameShare({}, form())).toHaveProperty("error");
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("returns a retryable error rather than claiming an unsuccessful write was saved", async () => {
    mocks.conflict.mockRejectedValueOnce(new Error("Database unavailable"));
    expect(await dismissCreatedGameShare({}, form())).toEqual({
      error: "Couldn’t dismiss this message. Try again.",
    });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});
