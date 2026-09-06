import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { PgDialect } from "drizzle-orm/pg-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameCollectionItem } from "./game-collection-types";
import { GameLibraryControls } from "./game-library-controls";
import { gameLibraryFilterSchema } from "./game-library-filters";
import { gameLibraryConditions } from "./game-library-query";
import { GamesSectionNav } from "./games-section-nav";
import {
  InvitationsCollection,
  invitationHistoryLabel,
} from "./invitations-collection";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("./actions", () => ({ rsvpAction: vi.fn() }));
const filters = gameLibraryFilterSchema.parse({
  collection: "invitations",
  response: "invited",
  cancelled: "true",
});
const game: GameCollectionItem = {
  id: "invitation",
  href: "/games/invitation",
  title: "Saturday Pickle",
  date: "SEP 10",
  dateKey: "2099-09-10",
  endsAt: "2099-09-10T10:00:00Z",
  time: "3–6 PM",
  venue: "Central",
  playerCount: 4,
  capacity: 16,
  status: "published",
  accentColor: "coral",
  viewerRsvp: "invited",
  invitedAt: "2099-09-01T00:00:00Z",
  hostName: "Mika",
  playerPriceCents: 0,
  requiresApproval: false,
  spotsRemaining: 12,
  canReplay: false,
};
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("Invitations library", () => {
  it("shares list, grid and server-filtered calendar views", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ upcoming: [game], past: [] }),
    });
    vi.stubGlobal("fetch", fetch);
    window.history.replaceState(null, "", "/games/invitations");
    render(
      <InvitationsCollection
        filters={filters}
        hasHistory
        todayKey="2099-09-10"
        upcomingPage={{ items: [game], nextCursor: null }}
        pastPage={{ items: [], nextCursor: null }}
      />
    );
    expect(screen.getByTestId("games-list")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Grid view" }));
    expect(screen.getByTestId("games-grid")).toBeVisible();
    expect(localStorage.getItem("relay-games-view")).toBe("grid");
    fireEvent.click(screen.getByRole("button", { name: "Calendar view" }));
    expect(screen.getByTestId("games-calendar")).toBeVisible();
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const url = new URL(fetch.mock.calls[0][0], "https://relay.test");
    expect(url.searchParams.get("collection")).toBe("invitations");
    expect(url.searchParams.get("response")).toBe("invited");
    expect(url.searchParams.get("month")).toBe("2099-09");
  });
  it("keeps Invitations between My games and Open games with an actionable count", () => {
    render(<GamesSectionNav current="invitations" invitationCount={2} />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
      ["My games", "Invitations (2)", "Open games"]
    );
    expect(
      screen.getByRole("link", { name: "Invitations (2)" })
    ).toHaveAttribute("href", "/games/invitations");
  });
  it("offers response and date filters with the shared view controls", () => {
    window.history.replaceState(null, "", "/games/invitations");
    render(<GameLibraryControls filters={filters} />);
    expect(
      screen.getByRole("searchbox", { name: "Search invitations" })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Response" }));
    fireEvent.click(screen.getByRole("option", { name: "Can’t go" }));
    expect(router.push).toHaveBeenCalledWith(
      "/games/invitations?response=declined",
      { scroll: false }
    );
    expect(
      screen.queryByRole("button", { name: "Your role" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "List view" })).toBeVisible();
  });
  it("uses durable provenance and excludes ended games from Needs response", () => {
    const query = new PgDialect().sqlToQuery(
      gameLibraryConditions("user", filters, new Date("2026-09-07T00:00:00Z"))!
    );
    expect(query.sql).toContain(
      '"session_players"."invitation_received_at" is not null'
    );
    expect(query.sql).toContain('"session_players"."user_id" =');
    expect(query.params).toContain("invited");
    expect(query.sql).toContain('"sessions"."ends_at" >');
  });
  it.each([
    "going",
    "maybe",
    "declined",
    "pending",
    "waitlisted",
    "any",
  ] as const)("retains provenance when filtering %s history", (response) => {
    const query = new PgDialect().sqlToQuery(
      gameLibraryConditions(
        "user",
        { ...filters, response, when: "all" },
        new Date()
      )!
    );
    expect(query.sql).toContain(
      '"session_players"."invitation_received_at" is not null'
    );
    if (response !== "any") expect(query.params).toContain(response);
  });
  it("renders completed and cancelled invitations without RSVP actions", () => {
    const completed = { ...game, status: "completed" as const };
    expect(invitationHistoryLabel(completed)).toBe("Ended · Not answered");
    render(
      <InvitationsCollection
        filters={{ ...filters, response: "any", when: "past" }}
        hasHistory
        upcomingPage={{ items: [], nextCursor: null }}
        pastPage={{
          items: [completed, { ...game, id: "cancelled", status: "cancelled" }],
          nextCursor: null,
        }}
      />
    );
    expect(screen.getByText("Ended · Not answered")).toBeVisible();
    expect(screen.getByText("Cancelled")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Going" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View recap" })).toHaveAttribute(
      "href",
      "/games/invitation/play"
    );
  });
  it("does not offer an unnecessary reset for no invitation history", () => {
    render(
      <InvitationsCollection
        filters={filters}
        hasHistory={false}
        upcomingPage={{ items: [], nextCursor: null }}
        pastPage={{ items: [], nextCursor: null }}
      />
    );
    expect(screen.getByText("No invitations yet")).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Clear filters" })
    ).not.toBeInTheDocument();
  });
});
