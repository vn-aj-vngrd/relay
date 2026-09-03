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
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
  reconcile: vi.fn(),
  revalidatePath: vi.fn(),
  assertRateLimit: vi.fn(),
  trackSessionMilestone: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/features/auth/permissions", () => ({
  can: mocks.can,
  sessionActor: vi.fn(() => ({ role: "host" })),
}));
vi.mock("@/features/analytics/events", () => ({ trackSessionMilestone: mocks.trackSessionMilestone }));
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
  mocks.updateSet.mockImplementation(() => ({ where: mocks.updateWhere }));
  mocks.transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) =>
    work({
      execute: mocks.execute,
      select: () => ({ from: () => ({ where: mocks.selectWhere }) }),
      insert: () => ({ values: mocks.insertValues }),
      update: () => ({ set: mocks.updateSet }),
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
      "/home",
      "/notifications",
      `/games/${session.id}/players`,
      `/games/${session.id}/payments`,
      `/games/${session.id}`,
      `/s/${session.slug}`,
    ]);
  });

  it("marks a host join-request notification read after approval", async () => {
    mocks.findMembership.mockResolvedValue({ role: "cohost", rsvp: "going", leftAt: null });
    mocks.selectWhere.mockResolvedValue([
      {
        id: "pending-1",
        userId: "player-1",
        guestName: null,
        role: "player",
        rsvp: "pending",
        waitlistPosition: null,
      },
    ]);

    await expect(
      manageRoster({
        type: "approve",
        actorUserId: "cohost-1",
        sessionId: session.id,
        sessionPlayerId: "pending-1",
      }),
    ).resolves.toEqual({ success: true, rsvp: "going" });

    expect(mocks.updateSet).toHaveBeenCalledWith({ readAt: expect.any(Date) });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/home");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/notifications");
  });

  it("marks a host join-request notification read after rejection", async () => {
    mocks.selectWhere.mockResolvedValue([
      {
        id: "pending-1",
        userId: "player-1",
        guestName: null,
        role: "player",
        rsvp: "pending",
        waitlistPosition: null,
      },
    ]);

    await expect(
      manageRoster({
        type: "remove",
        actorUserId: "host-1",
        sessionId: session.id,
        sessionPlayerId: "pending-1",
      }),
    ).resolves.toEqual({ success: true });

    expect(mocks.updateSet).toHaveBeenCalledWith({ readAt: expect.any(Date) });
  });

  it("records the four-player milestone when a host fills the first court", async () => {
    mocks.selectWhere.mockResolvedValue(
      ["host", "player-2", "player-3"].map((id) => ({
        id,
        guestName: null,
        rsvp: "going",
        waitlistPosition: null,
      })),
    );

    await manageRoster({
      type: "add",
      actorUserId: "host-1",
      sessionId: session.id,
      playerEntry: "Fourth Player",
    });

    expect(mocks.trackSessionMilestone).toHaveBeenCalledWith({
      name: "fourth_player_joined",
      userId: "host-1",
      sessionId: session.id,
      source: "authenticated",
    });
  });
});
