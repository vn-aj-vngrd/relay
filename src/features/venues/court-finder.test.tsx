import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CourtFinder } from "./court-finder";
import type { CebuVenue } from "./queries";

const { captureMapVenues } = vi.hoisted(() => ({ captureMapVenues: vi.fn() }));

vi.mock("./cebu-court-map", () => ({
  CebuCourtMap: ({
    venues,
    onSelect,
    children,
  }: {
    venues: CebuVenue[];
    onSelect: (id: string) => void;
    children?: ReactNode;
  }) => {
    captureMapVenues(venues);
    return (
      <div aria-label="Interactive map of pickleball courts">
        {venues.map((item) => (
          <button key={item.id} type="button" onClick={() => onSelect(item.id)}>
            Select {item.name}
          </button>
        ))}
        {children}
      </div>
    );
  },
}));

const venue: CebuVenue = {
  id: "nice-serve",
  slug: "nice-serve",
  name: "NiceServe Pickleball Court",
  address: "Mahayahay Road, Lapu-Lapu, Cebu",
  latitude: 10.3044,
  longitude: 123.9928,
  environment: "semi-indoor",
  courtCount: 3,
  hours: { summary: "8:00 AM – 12:00 AM" },
  priceRange: "₱450–₱500 per hour",
  parking: "Available",
  amenities: ["Open play"],
  paddleRental: true,
  contact: null,
  websiteUrl: "https://example.com",
  socialUrl: null,
  bookingUrl: "https://example.com/book",
  listingStatus: "verified",
  sourceUrl: null,
};

const fartherVenue: CebuVenue = {
  ...venue,
  id: "farther-court",
  slug: "farther-court",
  name: "Farther Court",
  address: "Talisay, Cebu",
  latitude: 10.2447,
  longitude: 123.8494,
  paddleRental: false,
  listingStatus: "unverified",
};

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn((success: PositionCallback) =>
        success({ coords: { latitude: 10.3045, longitude: 123.9929 } } as GeolocationPosition),
      ),
    },
  });
});

describe("CourtFinder", () => {
  it("keeps the mapped court set stable when opening a marker card", () => {
    render(<CourtFinder venues={[venue, fartherVenue]} />);
    const beforeSelection = captureMapVenues.mock.calls.at(-1)?.[0];

    fireEvent.click(screen.getByRole("button", { name: "Select NiceServe Pickleball Court" }));

    expect(captureMapVenues.mock.calls.at(-1)?.[0]).toBe(beforeSelection);
  });

  it("supports a bounded landing-page preview without changing the full finder", () => {
    const { rerender } = render(<CourtFinder venues={[venue]} compactPreview />);
    expect(screen.getByRole("heading", { name: "Courts" }).closest("section")).toHaveClass("h-[360px]");

    rerender(<CourtFinder venues={[venue]} />);
    expect(screen.getByRole("heading", { name: "Courts" }).closest("section")).toHaveClass(
      "h-[min(60dvh,520px)]",
      "sm:h-[580px]",
    );
  });

  it("gives mobile and tablet users dedicated map and list views", () => {
    render(<CourtFinder venues={[venue, fartherVenue]} />);

    const map = screen.getByRole("region", { name: "Court map" });
    const listPane = document.querySelector<HTMLElement>("[data-court-list-pane]");

    expect(screen.getByRole("button", { name: "Change court view, currently Map" })).toBeVisible();
    expect(map).toHaveClass("flex");
    expect(listPane).toHaveClass("hidden", "xl:block");

    fireEvent.click(screen.getByRole("button", { name: "Change court view, currently Map" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "List" }));

    expect(screen.getByRole("button", { name: "Change court view, currently List" })).toBeVisible();
    expect(map).toHaveClass("hidden", "xl:flex");
    expect(listPane).toHaveClass("block");

    fireEvent.click(within(listPane!).getByRole("button", { name: /NiceServe Pickleball Court/ }));

    expect(screen.getByRole("button", { name: "Change court view, currently Map" })).toBeVisible();
    expect(map).toHaveClass("flex");
    expect(screen.getByText("Verified by Relay")).toBeInTheDocument();
  });

  it("selects a mapped Cebu court and carries it into game creation", () => {
    render(<CourtFinder venues={[venue]} isAuthenticated />);

    fireEvent.click(screen.getByRole("button", { name: "Select NiceServe Pickleball Court" }));

    expect(screen.getByText("Verified by Relay")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Selected court: NiceServe Pickleball Court" })).toHaveClass(
      "inset-x-2",
      "bottom-2",
      "max-h-[min(72%,32rem)]",
      "p-3",
      "sm:p-4",
    );
    expect(screen.getByRole("link", { name: "Plan a game here" })).toHaveAttribute(
      "href",
      "/games/new?venue=NiceServe+Pickleball+Court&address=Mahayahay+Road%2C+Lapu-Lapu%2C+Cebu",
    );
    expect(screen.getByRole("link", { name: /booking/i })).toHaveAttribute("href", "https://example.com/book");
    expect(screen.getByRole("link", { name: /Can’t find your court/ })).toHaveAttribute("href", "/court/suggest");
  });

  it("sends public visitors through signup without losing the selected court", () => {
    render(<CourtFinder venues={[venue]} detailBasePath="/courts" />);

    fireEvent.click(screen.getByRole("button", { name: "Select NiceServe Pickleball Court" }));

    expect(screen.getByRole("link", { name: "Court details" })).toHaveAttribute("href", "/courts/nice-serve");
    expect(screen.getByRole("link", { name: "Plan a game here" })).toHaveAttribute(
      "href",
      "/signup?next=%2Fgames%2Fnew%3Fvenue%3DNiceServe%2BPickleball%2BCourt%26address%3DMahayahay%2BRoad%252C%2BLapu-Lapu%252C%2BCebu",
    );
  });

  it("filters locally while keeping a submission path", () => {
    render(<CourtFinder venues={[venue]} />);

    fireEvent.change(screen.getByLabelText("Search courts"), { target: { value: "Talisay" } });

    expect(screen.getByText("No courts match")).toBeInTheDocument();
  });

  it("sorts by distance without sending location to the server", async () => {
    render(<CourtFinder venues={[fartherVenue, venue]} />);

    fireEvent.click(screen.getByRole("button", { name: "Use my location" }));

    expect(await screen.findByText(/sorted by distance/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nearest courts" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Select / }).map((button) => button.textContent)).toEqual([
      "Select NiceServe Pickleball Court",
      "Select Farther Court",
    ]);
  });

  it("filters courts by equipment", () => {
    render(<CourtFinder venues={[venue, fartherVenue]} />);

    fireEvent.click(screen.getByLabelText("Paddle rental"));

    expect(screen.getAllByRole("button", { name: /NiceServe Pickleball Court/ })).not.toHaveLength(0);
    expect(screen.queryAllByRole("button", { name: /Farther Court/ })).toHaveLength(0);
  });

  it("copies a Google Maps location without exposing provider credentials", async () => {
    render(<CourtFinder venues={[venue]} />);

    fireEvent.click(screen.getByRole("button", { name: "Select NiceServe Pickleball Court" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy location" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://www.google.com/maps/search/?api=1&query=10.3044,123.9928",
    );
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });
});
