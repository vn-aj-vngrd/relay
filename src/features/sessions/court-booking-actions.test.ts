import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  membership: vi.fn(),
  set: vi.fn(),
  user: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.user }));
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
        insert: () => ({ values: vi.fn() }),
      }),
  },
}));

import { confirmCourtBooking } from "./court-booking-actions";

const session = {
  id: "3f06bfc0-ec28-42e8-a8dd-82e69f724407",
  slug: "game",
  hostId: "host",
  version: 4,
  status: "published",
  bookedAt: null,
};
function form(booking = "not_required") {
  const data = new FormData();
  data.set("sessionId", session.id);
  data.set("version", "4");
  data.set("booking", booking);
  data.set("payment", "free");
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: "host" });
  mocks.session.mockResolvedValue(session);
  mocks.membership.mockResolvedValue(null);
  mocks.set.mockReturnValue({ where: vi.fn() });
});

describe("confirmCourtBooking", () => {
  it("records no booking needed without touching payments or match state", async () => {
    expect(await confirmCourtBooking({}, form())).toEqual({ success: true });
    expect(mocks.set).toHaveBeenCalledWith({
      bookingNotRequired: true,
      bookedAt: null,
      version: 5,
      updatedAt: expect.any(Date),
    });
  });
  it("records a confirmed booking", async () => {
    expect(await confirmCourtBooking({}, form("confirmed"))).toEqual({
      success: true,
    });
    expect(mocks.set).toHaveBeenCalledWith({
      bookingNotRequired: false,
      bookedAt: expect.any(Date),
      version: 5,
      updatedAt: expect.any(Date),
    });
  });
  it("allows a current co-host", async () => {
    mocks.user.mockResolvedValue({ id: "cohost" });
    mocks.membership.mockResolvedValue({ role: "cohost" });
    expect(await confirmCourtBooking({}, form())).toEqual({ success: true });
  });
  it("rejects a revoked role", async () => {
    mocks.user.mockResolvedValue({ id: "former-cohost" });
    mocks.membership.mockResolvedValue({ role: "player" });
    expect(await confirmCourtBooking({}, form())).toHaveProperty("error");
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it.each(["live", "completed", "cancelled"])(
    "does not mutate %s setup",
    async (status) => {
      mocks.session.mockResolvedValue({ ...session, status });
      expect(await confirmCourtBooking({}, form())).toHaveProperty("error");
      expect(mocks.set).not.toHaveBeenCalled();
    }
  );
  it("rejects stale versions and pending booking choices", async () => {
    mocks.session.mockResolvedValue({ ...session, version: 5 });
    expect(await confirmCourtBooking({}, form())).toHaveProperty("error");
    expect(await confirmCourtBooking({}, form("pending"))).toHaveProperty(
      "error"
    );
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
