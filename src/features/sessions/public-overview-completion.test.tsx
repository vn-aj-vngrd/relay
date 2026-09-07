import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sessionHero: vi.fn(),
  getPublicSession: vi.fn(),
  getCurrentUser: vi.fn(),
  getSessionViewer: vi.fn(),
}));
vi.mock("@/features/sessions/queries", () => mocks);
vi.mock("@/features/auth/session", () => mocks);
vi.mock("@/features/sessions/viewer", () => ({
  getSessionViewer: mocks.getSessionViewer,
  canParticipate: (rsvp: string) =>
    ["going", "maybe", "waitlisted"].includes(rsvp),
}));
vi.mock("@/features/players/profile", () => ({
  ensureProfile: async () => ({ name: "Alex", username: "alex" }),
}));
vi.mock("@/features/sessions/overview", () => ({
  getSessionOverview: async () => ({
    payment: {
      view: "player",
      amountCents: 29900,
      status: "unpaid",
      reviewRequested: false,
    },
  }),
}));
vi.mock("@/features/sessions/session-summary", () => ({
  SessionHero: (props: unknown) => {
    mocks.sessionHero(props);
    return <h2>Friends</h2>;
  },
  SessionPlanDetails: () => null,
}));
vi.mock("@/features/sessions/session-overview", () => ({
  SessionAtAGlance: () => null,
}));
vi.mock("@/features/sessions/rsvp-control", () => ({
  RsvpControl: () => <button type="button">RSVP</button>,
}));
vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://relay.test" }),
}));

import PublicSessionPage, {
  generateMetadata,
} from "@/app/s/[slug]/(plan)/page";

const session = {
  id: "game",
  slug: "friends",
  title: "Friends",
  hostId: "owner",
  visibility: "public",
  status: "completed",
  startsAt: new Date("2026-06-01T10:00:00Z"),
  endsAt: new Date("2026-06-01T12:00:00Z"),
  venueName: "Central Pickle",
  capacity: 8,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("shared completed Overview", () => {
  it.each([
    {
      name: "outsider",
      userId: null,
      rsvp: null,
      role: "player",
      replay: false,
      browse: true,
      payment: false,
    },
    {
      name: "unanswered invitee",
      userId: "invitee",
      rsvp: "invited",
      role: "player",
      replay: false,
      browse: true,
      payment: false,
    },
    {
      name: "guest",
      userId: null,
      rsvp: "going",
      role: "player",
      replay: false,
      browse: false,
      payment: true,
    },
    {
      name: "account participant",
      userId: "player",
      rsvp: "waitlisted",
      role: "player",
      replay: false,
      browse: false,
      payment: true,
    },
    {
      name: "non-playing owner",
      userId: "owner",
      rsvp: null,
      role: "host",
      replay: true,
      browse: false,
      payment: false,
    },
    {
      name: "non-playing co-host",
      userId: "cohost",
      rsvp: "declined",
      role: "cohost",
      replay: false,
      browse: false,
      payment: false,
    },
  ])(
    "keeps $name actions within existing capabilities",
    async ({ userId, rsvp, role, replay, browse, payment }) => {
      mocks.getPublicSession.mockResolvedValue({
        session,
        roster: [],
        hostProfile: null,
        matchCount: 0,
      });
      mocks.getCurrentUser.mockResolvedValue(
        userId ? { id: userId, user_metadata: {} } : null
      );
      mocks.getSessionViewer.mockResolvedValue(
        rsvp ? { isGuest: !userId, player: { id: "player", role, rsvp } } : null
      );
      render(
        await PublicSessionPage({
          params: Promise.resolve({ slug: "friends" }),
          searchParams: Promise.resolve({}),
        })
      );
      expect(mocks.sessionHero).toHaveBeenCalledWith(
        expect.objectContaining({
          lifecycle: { status: "completed", endsAt: expect.any(Date) },
        })
      );
      expect(
        screen.getAllByRole("region", { name: "Game ended" })
      ).toHaveLength(1);
      expect(screen.getByRole("link", { name: "View recap" })).toHaveAttribute(
        "href",
        "/s/friends/play"
      );
      expect(Boolean(screen.queryByRole("link", { name: "Play again" }))).toBe(
        replay
      );
      expect(
        Boolean(screen.queryByRole("link", { name: "Browse open games" }))
      ).toBe(browse);
      const paymentLink = screen.queryByRole("link", { name: /View payment/ });
      expect(Boolean(paymentLink)).toBe(payment);
      if (paymentLink)
        expect(paymentLink).toHaveAttribute("href", "/s/friends/payments");
      expect(
        screen.queryByRole("button", { name: "RSVP" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          /Waitlist open|Be the first to join|Results are saved/
        )
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Final roster" })
      ).toBeVisible();
    }
  );

  it.each(["completed", "cancelled"])(
    "does not advertise availability in %s metadata",
    async (status) => {
      mocks.getPublicSession.mockResolvedValue({
        session: { ...session, status },
        roster: [],
        hostProfile: null,
        matchCount: 0,
      });
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: "friends" }),
      });
      expect(metadata.description).not.toMatch(/going|spots|waitlist/i);
      expect(metadata.description).toContain(
        status === "completed" ? "0 matches played" : "Game cancelled"
      );
    }
  );
});
