import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  session: vi.fn(),
  membership: vi.fn(),
  set: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn() }));
vi.mock("@/db/client", () => ({
  db: {
    transaction: async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        execute: vi.fn(),
        query: {
          sessions: { findFirst: mocks.session },
          sessionPlayers: { findFirst: mocks.membership },
        },
        update: () => ({ set: mocks.set }),
        insert: () => ({ values: mocks.insert }),
      }),
  },
}));

import { updateLiveSessionAction } from "./live-settings-actions";

const session = {
  id: "3f06bfc0-ec28-42e8-a8dd-82e69f724407",
  slug: "game",
  hostId: "host",
  status: "live",
  version: 4,
  bookedAt: null,
};

function form(section = "invite") {
  const data = new FormData();
  data.set("sessionId", session.id);
  data.set("version", "4");
  data.set("section", section);
  data.set("notes", "Use the side entrance.");
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ id: "host" });
  mocks.session.mockResolvedValue(session);
  mocks.membership.mockResolvedValue(null);
  mocks.set.mockReturnValue({ where: vi.fn() });
});

describe("updateLiveSessionAction", () => {
  it("updates only notes even when structural fields are submitted", async () => {
    const data = form();
    data.set("courts", "20");
    data.set("visibility", "public");
    data.set("date", "invalid");
    expect(await updateLiveSessionAction({}, data)).toEqual({ success: true });
    expect(mocks.set).toHaveBeenCalledWith({
      notes: "Use the side entrance.",
      version: 5,
      updatedAt: expect.any(Date),
    });
  });

  it("allows current co-hosts to record a booking without editing the player note", async () => {
    mocks.requireUser.mockResolvedValue({ id: "cohost" });
    mocks.membership.mockResolvedValue({ role: "cohost" });
    const data = form("booking");
    data.set("booked", "on");
    data.set("bookingReference", "REF-1");
    data.set("bookingTotal", "1200");
    expect(await updateLiveSessionAction({}, data)).toEqual({ success: true });
    expect(mocks.set).toHaveBeenCalledWith({
      bookedAt: expect.any(Date),
      bookingReference: "REF-1",
      bookingTotalCents: 120000,
      bookingNotes: null,
      version: 5,
      updatedAt: expect.any(Date),
    });
  });

  it.each(["draft", "published", "completed", "cancelled"])(
    "rejects %s under the transaction lock",
    async (status) => {
      mocks.session.mockResolvedValue({ ...session, status });
      expect(await updateLiveSessionAction({}, form())).toHaveProperty("error");
      expect(mocks.set).not.toHaveBeenCalled();
    }
  );

  it("rejects stale versions", async () => {
    mocks.session.mockResolvedValue({ ...session, version: 5 });
    expect(await updateLiveSessionAction({}, form())).toHaveProperty("error");
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("rejects removed co-host authority", async () => {
    mocks.requireUser.mockResolvedValue({ id: "former-cohost" });
    mocks.membership.mockResolvedValue({ role: "player" });
    expect(await updateLiveSessionAction({}, form())).toHaveProperty("error");
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("rejects structural settings sections", async () => {
    expect(await updateLiveSessionAction({}, form("plan"))).toHaveProperty(
      "error"
    );
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("rejects an invalid booking amount", async () => {
    const data = form("booking");
    data.set("booked", "on");
    data.set("bookingTotal", "-1");
    expect(await updateLiveSessionAction({}, data)).toHaveProperty("error");
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
