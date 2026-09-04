import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/analytics/actions", () => ({
  trackDiscoveryEvent: vi.fn(async () => undefined),
}));

import { OpenGamesCollection } from "./open-games-collection";

const filters = {
  date: "any" as const,
  dateFrom: "",
  dateTo: "",
  time: "any" as const,
  timeFrom: "",
  timeTo: "",
  location: "",
  available: false,
  price: "any" as const,
  minPrice: null,
  maxPrice: null,
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("OpenGamesCollection", () => {
  it("shows public game context and opens the shared route before login", () => {
    render(
      <OpenGamesCollection
        filters={filters}
        isAuthenticated={false}
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
    ).toHaveAttribute("href", "/s/saturday-pickle?source=open-games");
    expect(screen.getByText(/₱300/)).toBeVisible();
    expect(screen.getByText(/2 spots left/)).toBeVisible();
    expect(screen.getByText("Host approval required")).toBeVisible();
  });

  it("uses the My Games grid preference for card view", () => {
    localStorage.setItem("relay-games-view", "grid");
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

    expect(screen.getByTestId("open-games-grid")).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Saturday Pickle/ })
    ).toHaveAttribute("href", "/games/game-1?source=open-games");
    expect(screen.getByText("Hosted by Mika")).toBeVisible();
    expect(screen.getByText("2 spots left")).toBeVisible();
  });

  it("loads the selected month in the shared calendar view", async () => {
    localStorage.setItem("relay-games-view", "calendar");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
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
        })
      )
    );

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
        todayKey="2030-08-22"
        initialMonth="2030-08"
        initialDate="2030-08-22"
      />
    );

    expect(screen.getByTestId("open-games-calendar")).toBeVisible();
    await waitFor(() =>
      expect(screen.getAllByText("Saturday Pickle").length).toBeGreaterThan(0)
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("month=2030-08"),
      expect.objectContaining({ credentials: "same-origin" })
    );
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
