import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  can: vi.fn(),
  findSession: vi.fn(),
  findMembership: vi.fn(),
  findProfile: vi.fn(),
  transaction: vi.fn(),
  execute: vi.fn(),
  selectWhere: vi.fn(),
  insertValues: vi.fn(),
  returning: vi.fn(),
  reconcile: vi.fn(),
  revalidatePath: vi.fn(),
  assertRateLimit: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/features/auth/permissions", () => ({
  can: mocks.can,
  sessionActor: vi.fn(() => ({ role: "host" })),
}));
vi.mock("@/features/payments/sync", () => ({ reconcileUnpaidExpenseShares: mocks.reconcile }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: mocks.assertRateLimit }));
vi.mock("@/db/client", () => ({
  db: {
    query: {
      sessions: { findFirst: mocks.findSession },
      sessionPlayers: { findFirst: mocks.findMembership },
      profiles: { findFirst: mocks.findProfile },
    },
    transaction: mocks.transaction,
  },
}));

import { manageRoster } from "./roster-management";

const session = {
  id: "3f06bfc0-ec28-42e8-a8dd-82e69f724407",
  slug: "saturday-night",
  hostId: "host-1",
  capacity: 8,
  rosterLocked: false,
  status: "published",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findSession.mockResolvedValue(session);
  mocks.findMembership.mockResolvedValue({ role: "host", rsvp: "going", leftAt: null });
  mocks.can.mockReturnValue(true);
  mocks.selectWhere.mockResolvedValue([]);
  mocks.returning.mockResolvedValue([{ id: "player-1" }]);
  mocks.insertValues.mockImplementation(() => ({ returning: mocks.returning }));
  mocks.transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) =>
    work({
      execute: mocks.execute,
      select: () => ({ from: () => ({ where: mocks.selectWhere }) }),
      insert: () => ({ values: mocks.insertValues }),
    }),
  );
});

describe("manageRoster", () => {
  it("keeps authorization and locked-roster rules behind the interface", async () => {
    mocks.can.mockReturnValue(false);

    await expect(
      manageRoster({
        type: "add",
        actorUserId: "player-1",
        sessionId: session.id,
        playerEntry: "Guest Player",
      }),
    ).resolves.toEqual({ error: "Only a host or co-host can add players." });
    expect(mocks.transaction).not.toHaveBeenCalled();

    mocks.can.mockReturnValue(true);
    mocks.findSession.mockResolvedValue({ ...session, rosterLocked: true });
    await expect(
      manageRoster({
        type: "add",
        actorUserId: "host-1",
        sessionId: session.id,
        playerEntry: "Guest Player",
      }),
    ).resolves.toEqual({ error: "Unlock the roster before adding another player." });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("coordinates a guest addition and all dependent refresh work", async () => {
    await expect(
      manageRoster({
        type: "add",
        actorUserId: "host-1",
        sessionId: session.id,
        playerEntry: "Guest Player",
        skillLevel: "casual",
      }),
    ).resolves.toEqual({ success: true, playerOutcome: "added" });

    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: session.id, guestName: "Guest Player", skillLevel: "casual" }),
    );
    expect(mocks.reconcile).toHaveBeenCalledWith(session.id);
    expect(mocks.revalidatePath.mock.calls.map(([path]) => path)).toEqual([
      `/games/${session.id}/players`,
      `/games/${session.id}/payments`,
      `/games/${session.id}`,
      `/s/${session.slug}`,
    ]);
  });
});
