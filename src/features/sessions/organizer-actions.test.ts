import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  assertRateLimit: vi.fn(),
  findSession: vi.fn(),
  findProfile: vi.fn(),
  transaction: vi.fn(),
  execute: vi.fn(),
  selectWhere: vi.fn(),
  sessionUpdateSet: vi.fn(),
  sessionUpdateReturning: vi.fn(),
  playerUpdateSet: vi.fn(),
  playerUpdateReturning: vi.fn(),
  insertValues: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/features/auth/session", () => ({
  requireUser: mocks.requireUser,
}));
vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: mocks.assertRateLimit,
}));
vi.mock("@/db/client", () => ({
  db: {
    query: {
      profiles: { findFirst: mocks.findProfile },
      sessions: { findFirst: mocks.findSession },
    },
    transaction: mocks.transaction,
  },
}));

import { addCohostAction, setCohostRoleAction } from "./organizer-actions";

const hostId = "eb152226-c01b-4931-8ad9-1f056b6bd8fa";
const playerUserId = "26b0227a-a39d-4e43-a3ce-a1709d510f91";
const sessionPlayerId = "87617e20-f89d-4f76-9d6f-a00f78477ea5";
const session = {
  id: "3f06bfc0-ec28-42e8-a8dd-82e69f724407",
  slug: "saturday-night",
  hostId,
  status: "published",
  version: 4,
  leadOrganizerId: null,
};

function addFormData(username = "@jamie-tan", version = 4) {
  const data = new FormData();
  data.set("sessionId", session.id);
  data.set("version", String(version));
  data.set("username", username);
  return data;
}

function formData(role: "player" | "cohost", version = 4) {
  const data = new FormData();
  data.set("sessionId", session.id);
  data.set("sessionPlayerId", sessionPlayerId);
  data.set("version", String(version));
  data.set("role", role);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ id: hostId });
  mocks.findSession.mockResolvedValue(session);
  mocks.findProfile.mockResolvedValue({
    userId: playerUserId,
    username: "jamie-tan",
    name: "Jamie Tan",
    skillLevel: "intermediate",
  });
  mocks.selectWhere.mockResolvedValue([
    {
      id: sessionPlayerId,
      userId: playerUserId,
      role: "player",
      leftAt: null,
    },
  ]);
  mocks.sessionUpdateReturning.mockResolvedValue([{ id: session.id }]);
  mocks.playerUpdateReturning.mockResolvedValue([{ id: sessionPlayerId }]);
  mocks.sessionUpdateSet.mockImplementation(() => ({
    where: () => ({ returning: mocks.sessionUpdateReturning }),
  }));
  mocks.playerUpdateSet.mockImplementation(() => ({
    where: () => ({ returning: mocks.playerUpdateReturning }),
  }));
  mocks.transaction.mockImplementation(
    async (work: (tx: unknown) => Promise<unknown>) => {
      let updateCount = 0;
      return work({
        execute: mocks.execute,
        select: () => ({
          from: () => ({ where: mocks.selectWhere }),
        }),
        update: () => {
          updateCount += 1;
          return {
            set:
              updateCount === 1
                ? mocks.sessionUpdateSet
                : mocks.playerUpdateSet,
          };
        },
        insert: () => ({ values: mocks.insertValues }),
      });
    }
  );
});

describe("addCohostAction", () => {
  it("adds a Relay member as a non-playing co-host without requiring a roster invitation", async () => {
    mocks.selectWhere.mockResolvedValue([]);

    await expect(addCohostAction({}, addFormData())).resolves.toEqual({
      message: "@jamie-tan added as a co-host.",
    });

    expect(mocks.insertValues).toHaveBeenNthCalledWith(1, {
      sessionId: session.id,
      userId: playerUserId,
      skillLevel: "intermediate",
      role: "cohost",
      rsvp: "declined",
      playState: "unavailable",
      respondedAt: expect.any(Date),
    });
    expect(mocks.insertValues).toHaveBeenNthCalledWith(2, {
      sessionId: session.id,
      kind: "system",
      body: "The host assigned a co-host.",
    });
    expect(mocks.insertValues).toHaveBeenNthCalledWith(3, {
      userId: playerUserId,
      sessionId: session.id,
      type: "cohost_assigned",
      payload: {},
    });
  });

  it("explains when the Relay username does not exist", async () => {
    mocks.findProfile.mockResolvedValue(null);

    await expect(
      addCohostAction({}, addFormData("@missing-player"))
    ).resolves.toEqual({
      error: "No Relay member found for @missing-player.",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("adds a co-host during live Play without changing participation", async () => {
    mocks.findSession.mockResolvedValueOnce({ ...session, status: "live" });
    await expect(addCohostAction({}, addFormData())).resolves.toEqual({
      message: "@jamie-tan added as a co-host.",
    });
    expect(mocks.playerUpdateSet).toHaveBeenCalledWith({
      role: "cohost",
      updatedAt: expect.any(Date),
    });
  });

  it("allows only the original host and rejects ended games", async () => {
    mocks.findSession.mockResolvedValueOnce({
      ...session,
      hostId: "other-host",
    });
    await expect(addCohostAction({}, addFormData())).resolves.toEqual({
      error: "Only the host can add a co-host.",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();

    mocks.findSession.mockResolvedValueOnce({
      ...session,
      status: "completed",
    });
    await expect(addCohostAction({}, addFormData())).resolves.toEqual({
      error: "Co-host access is view-only after the game ends.",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe("setCohostRoleAction", () => {
  it("promotes an active account player and records generic side effects", async () => {
    await expect(setCohostRoleAction({}, formData("cohost"))).resolves.toEqual({
      message: "Co-host access assigned.",
    });

    expect(mocks.assertRateLimit).toHaveBeenCalledWith(
      { scope: "organizer-management", limit: 30, windowSeconds: 60 },
      `user:${hostId}`,
      "Organizer changes are happening too quickly. Wait and try again."
    );
    expect(mocks.execute).toHaveBeenCalledOnce();
    expect(mocks.sessionUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        version: expect.anything(),
        updatedAt: expect.any(Date),
      })
    );
    expect(mocks.playerUpdateSet).toHaveBeenCalledWith({
      role: "cohost",
      updatedAt: expect.any(Date),
    });
    expect(mocks.insertValues).toHaveBeenNthCalledWith(1, {
      sessionId: session.id,
      kind: "system",
      body: "The host assigned a co-host.",
    });
    expect(mocks.insertValues).toHaveBeenNthCalledWith(2, {
      userId: playerUserId,
      sessionId: session.id,
      type: "cohost_assigned",
      payload: {},
    });
    expect(mocks.revalidatePath.mock.calls.map(([path]) => path)).toEqual([
      "/home",
      "/games",
      "/games/open",
      "/notifications",
      `/games/${session.id}`,
      `/games/${session.id}/players`,
      `/games/${session.id}/settings`,
      `/s/${session.slug}`,
      `/s/${session.slug}/players`,
    ]);
  });

  it("demotes a co-host and clears a matching lead organizer", async () => {
    mocks.findSession.mockResolvedValue({
      ...session,
      leadOrganizerId: playerUserId,
    });
    mocks.selectWhere.mockResolvedValue([
      {
        id: sessionPlayerId,
        userId: playerUserId,
        role: "cohost",
        leftAt: null,
      },
    ]);

    await expect(setCohostRoleAction({}, formData("player"))).resolves.toEqual({
      message: "Co-host access removed.",
    });

    expect(mocks.sessionUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ leadOrganizerId: null })
    );
    expect(mocks.playerUpdateSet).toHaveBeenCalledWith({
      role: "player",
      updatedAt: expect.any(Date),
    });
    expect(mocks.insertValues).toHaveBeenNthCalledWith(2, {
      userId: playerUserId,
      sessionId: session.id,
      type: "cohost_removed",
      payload: {},
    });
  });

  it("allows role changes during live Play without changing participation", async () => {
    mocks.findSession.mockResolvedValueOnce({ ...session, status: "live" });
    await expect(setCohostRoleAction({}, formData("cohost"))).resolves.toEqual({
      message: "Co-host access assigned.",
    });
    expect(mocks.playerUpdateSet).toHaveBeenCalledWith({
      role: "cohost",
      updatedAt: expect.any(Date),
    });
  });

  it("allows only the session host and rejects ended games", async () => {
    mocks.findSession.mockResolvedValueOnce({
      ...session,
      hostId: "other-host",
    });
    await expect(setCohostRoleAction({}, formData("cohost"))).resolves.toEqual({
      error: "Only the host can change co-host access.",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();

    mocks.findSession.mockResolvedValueOnce({
      ...session,
      status: "cancelled",
    });
    await expect(setCohostRoleAction({}, formData("cohost"))).resolves.toEqual({
      error: "Co-host access is view-only after the game ends.",
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it.each([
    ["guest", { userId: null, role: "player", leftAt: null }],
    ["host", { userId: hostId, role: "host", leftAt: null }],
    [
      "left player",
      { userId: playerUserId, role: "player", leftAt: new Date() },
    ],
  ])("rejects a %s target", async (_label, target) => {
    mocks.selectWhere.mockResolvedValue([{ id: sessionPlayerId, ...target }]);

    await expect(setCohostRoleAction({}, formData("cohost"))).resolves.toEqual({
      error: "Choose an active Relay player or co-host.",
    });
    expect(mocks.sessionUpdateSet).not.toHaveBeenCalled();
    expect(mocks.insertValues).not.toHaveBeenCalled();
  });

  it("rejects a stale session version before changing the player", async () => {
    mocks.sessionUpdateReturning.mockResolvedValue([]);

    await expect(
      setCohostRoleAction({}, formData("cohost", 3))
    ).resolves.toEqual({
      error: "The game changed on another device. Refresh and try again.",
    });
    expect(mocks.execute).toHaveBeenCalledOnce();
    expect(mocks.playerUpdateSet).not.toHaveBeenCalled();
    expect(mocks.insertValues).not.toHaveBeenCalled();
  });
});
