import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  currentSession: vi.fn(),
  membership: vi.fn(),
  execute: vi.fn(),
  set: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/features/auth/session", () => ({
  requireUser: vi.fn(async () => ({ id: "host" })),
}));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn() }));
vi.mock("@/db/client", () => ({
  db: {
    query: {
      sessions: { findFirst: mocks.session },
      sessionPlayers: { findFirst: mocks.membership },
    },
    transaction: async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        execute: mocks.execute,
        query: { sessions: { findFirst: mocks.currentSession } },
        update: () => ({ set: mocks.set }),
      }),
  },
}));

import { toggleRosterLockAction } from "./actions";

const session = {
  id: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
  slug: "shared",
  hostId: "host",
  status: "published",
  version: 1,
  rosterLocked: false,
};
function form() {
  const input = new FormData();
  input.set("sessionId", session.id);
  return input;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue(session);
  mocks.currentSession.mockResolvedValue(session);
  mocks.membership.mockResolvedValue(null);
  mocks.set.mockReturnValue({ where: vi.fn() });
});

describe("roster locking", () => {
  it.each(["completed", "cancelled"])(
    "rejects a %s transition that happens before the lock is acquired",
    async (status) => {
      mocks.currentSession.mockResolvedValue({ ...session, status });
      await expect(toggleRosterLockAction(form())).rejects.toThrow(
        "This game has ended. Its roster is read-only."
      );
      expect(mocks.execute).toHaveBeenCalledOnce();
      expect(mocks.set).not.toHaveBeenCalled();
    }
  );
  it("uses current locked state and refreshes both Play paths and setup", async () => {
    mocks.currentSession.mockResolvedValue({
      ...session,
      status: "live",
      version: 3,
      rosterLocked: true,
    });
    await toggleRosterLockAction(form());
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ rosterLocked: false, version: 4 })
    );
    for (const path of [
      `/games/${session.id}/play`,
      `/games/${session.id}/play/setup`,
      `/s/${session.slug}/play`,
    ])
      expect(mocks.revalidate).toHaveBeenCalledWith(path);
  });
});
