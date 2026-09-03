import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/analytics/actions", () => ({
  trackDiscoveryEvent: vi.fn(async () => undefined),
}));

import { OpenGamesCollection } from "./open-games-collection";

const filters = { date: "any" as const, location: "", available: false };

afterEach(cleanup);

describe("OpenGamesCollection", () => {
  it("shows cost, availability, approval, and host context in a mobile-first row", () => {
    render(
      <OpenGamesCollection
        filters={filters}
        initialPage={{
          nextCursor: null,
          items: [
            {
              id: "game-1",
              slug: "saturday-pickle",
              title: "Saturday Pickle",
              startsAt: "2030-08-22T11:00:00.000Z",
              endsAt: "2030-08-22T13:00:00.000Z",
              date: "Aug 22",
              time: "7:00–9:00 PM",
              venue: "Central Pickle",
              venueAddress: "Cebu City",
              hostName: "Mika",
              playerCount: 6,
              capacity: 8,
              estimatedCostCents: 30_000,
              requiresApproval: true,
              status: "published",
              accentColor: "violet",
              viewerRsvp: null,
            },
          ],
        }}
      />
    );

    expect(
      screen.getByRole("link", { name: /Saturday Pickle/ })
    ).toHaveAttribute("href", "/games/game-1?source=open-games");
    expect(screen.getByText(/₱300/)).toBeVisible();
    expect(screen.getByText(/2 spots left/)).toBeVisible();
    expect(screen.getByText("Host approval required")).toBeVisible();
  });

  it("gives an actionable empty state", () => {
    render(
      <OpenGamesCollection
        filters={filters}
        initialPage={{ items: [], nextCursor: null }}
      />
    );
    expect(
      screen.getByRole("heading", { name: "No open games match these filters" })
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute(
      "href",
      "/games/open"
    );
  });
});
