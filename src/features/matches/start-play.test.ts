import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  membership: vi.fn(),
  currentSession: vi.fn(),
  currentMembership: vi.fn(),
  readiness: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  courts: vi.fn(),
  execute: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/auth/session", () => ({
  requireUser: vi.fn(async () => ({ id: "host" })),
}));
vi.mock("@/features/analytics/events", () => ({
  trackSessionMilestone: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn() }));
vi.mock("@/features/sessions/readiness-query", () => ({
  loadPlayReadiness: mocks.readiness,
}));
vi.mock("@/db/client", () => ({
  db: {
    query: {
      sessions: { findFirst: mocks.session },
      sessionPlayers: { findFirst: mocks.membership },
    },
    transaction: async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        execute: mocks.execute,
        query: {
          sessions: { findFirst: mocks.currentSession },
          sessionPlayers: { findFirst: mocks.currentMembership },
        },
        select: () => ({
          from: () => ({ where: () => ({ orderBy: mocks.courts }) }),
        }),
        update: mocks.update,
        insert: mocks.insert,
      }),
  },
}));

import { startPlay } from "./actions";

const session = {
  id: "session",
  hostId: "host",
  status: "published",
  courtCount: 1,
  version: 1,
};
function form(mode = "queue") {
  const data = new FormData();
  data.set("sessionId", "session");
  data.set("mode", mode);
  data.set("queueRule", "adaptive");
  data.set("partnerPolicy", "mix");
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue(session);
  mocks.membership.mockResolvedValue(null);
  mocks.currentSession.mockResolvedValue(session);
  mocks.currentMembership.mockResolvedValue(null);
  const players = Array.from({ length: 4 }, (_, id) => ({ id: String(id) }));
  mocks.readiness.mockResolvedValue({
    goingPlayers: players,
    activePlayers: players,
    readiness: { ready: false, missing: ["booking"] },
  });
  mocks.courts.mockResolvedValue([
    { id: "court", position: 1, availableForPlay: true },
  ]);
});

describe("startPlay readiness gate", () => {
  it("blocks the 67% screenshot case without creating matches or going live", async () => {
    expect(await startPlay({}, form())).toEqual({
      error: "Complete setup before starting: Confirm the court arrangement.",
    });
    expect(mocks.execute).toHaveBeenCalled();
    expect(mocks.readiness).toHaveBeenCalledWith(session, expect.anything());
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rechecks lifecycle after acquiring the lock", async () => {
    mocks.currentSession.mockResolvedValue({ ...session, status: "live" });
    expect(await startPlay({}, form())).toHaveProperty("error");
    expect(mocks.readiness).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rechecks revoked organizer permissions", async () => {
    mocks.currentSession.mockResolvedValue({
      ...session,
      hostId: "another-host",
    });
    mocks.currentMembership.mockResolvedValue({ role: "player" });
    expect(await startPlay({}, form())).toHaveProperty("error");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects a game with no open courts even when arrangements are ready", async () => {
    mocks.readiness.mockResolvedValue({
      goingPlayers: [],
      activePlayers: [],
      readiness: { ready: true, missing: [] },
    });
    mocks.courts.mockResolvedValue([{ availableForPlay: false }]);
    expect(await startPlay({}, form())).toEqual({
      error: "Open at least one court before starting Play.",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("keeps Court Climb player/court requirements mandatory", async () => {
    const players = Array.from({ length: 4 }, (_, id) => ({ id: String(id) }));
    mocks.readiness.mockResolvedValue({
      goingPlayers: players,
      activePlayers: players,
      readiness: { ready: true, missing: [] },
    });
    expect(await startPlay({}, form("king_of_court"))).toHaveProperty("error");
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
