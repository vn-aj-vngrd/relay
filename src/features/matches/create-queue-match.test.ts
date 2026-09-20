import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  currentSession: vi.fn(),
  membership: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  execute: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/features/auth/session", () => ({
  requireUser: vi.fn(async () => ({ id: "host" })),
}));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn() }));
vi.mock("@/features/analytics/events", () => ({
  trackSessionMilestone: vi.fn(),
}));
vi.mock("@/features/sessions/readiness-query", () => ({
  loadPlayReadiness: vi.fn(),
}));
vi.mock("@/db/client", () => ({
  db: {
    query: {
      sessions: { findFirst: mocks.session },
      sessionPlayers: { findFirst: mocks.membership },
    },
    transaction: async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        query: {
          sessions: { findFirst: mocks.currentSession },
          sessionPlayers: { findFirst: mocks.membership },
        },
        execute: mocks.execute,
        select: mocks.select,
        insert: mocks.insert,
        update: mocks.update,
      }),
  },
}));

import { revalidatePath } from "next/cache";
import { createQueueMatch } from "./actions";
import { changedLineupMessage, rotationPlanKey } from "./next-rotation";

const session = {
  id: "session",
  slug: "shared",
  hostId: "host",
  status: "live",
  rotationMode: "queue",
  rotationConfig: {},
};
const plan = [
  {
    courtId: "court",
    courtLabel: "Court 1",
    teamA: ["a", "b"],
    teamB: ["c", "d"],
  },
];

function form(key = rotationPlanKey(plan)) {
  const data = new FormData();
  data.set("sessionId", "session");
  data.set("expectedLineup", key);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue(session);
  mocks.currentSession.mockResolvedValue(session);
  mocks.membership.mockResolvedValue(null);
  const rows: unknown[][] = [
    [],
    [{ id: "court", label: "Court 1", position: 1, availableForPlay: true }],
    ["a", "b", "c", "d"].map((sessionPlayerId, position) => ({
      sessionPlayerId,
      position,
      skillLevel: "beginner",
    })),
    [],
    [],
    [],
  ];
  mocks.select.mockImplementation(() => {
    const result = Promise.resolve(rows.shift() ?? []);
    const chain = Object.assign(result, {
      from: () => chain,
      innerJoin: () => chain,
      where: () => chain,
      orderBy: () => result,
    });
    return chain;
  });
  mocks.insert.mockReturnValue({
    values: () => ({ returning: async () => [{ id: "match" }] }),
  });
  mocks.update.mockReturnValue({
    set: () => ({ where: async () => undefined }),
  });
});

describe("starting a reviewed lineup", () => {
  it("rejects stale teams without writing and refreshes both access paths", async () => {
    expect(await createQueueMatch({}, form("old-lineup"))).toEqual({
      error: changedLineupMessage,
    });
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/games/session/play");
    expect(revalidatePath).toHaveBeenCalledWith("/s/shared/play");
  });

  it("starts the reviewed assignment", async () => {
    expect(await createQueueMatch({}, form())).toEqual({});
    expect(mocks.insert).toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledTimes(2);
  });

  it.each(["completed", "cancelled"])(
    "rechecks %s lifecycle under the lock",
    async (status) => {
      mocks.currentSession.mockResolvedValue({ ...session, status });
      expect(await createQueueMatch({}, form())).toHaveProperty("error");
      expect(mocks.select).not.toHaveBeenCalled();
      expect(mocks.insert).not.toHaveBeenCalled();
    }
  );

  it("rechecks revoked management access under the lock", async () => {
    mocks.currentSession.mockResolvedValue({ ...session, hostId: "other" });
    expect(await createQueueMatch({}, form())).toHaveProperty("error");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
