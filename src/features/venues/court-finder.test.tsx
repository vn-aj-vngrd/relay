import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CourtFinder } from "./court-finder";
import type { CourtListing } from "./directory";

const { captureMapVenues, captureMapAutoLoad } = vi.hoisted(() => ({
  captureMapVenues: vi.fn(),
  captureMapAutoLoad: vi.fn(),
}));

vi.mock("./court-map", () => ({
  CourtMap: ({
    venues,
    onSelect,
    children,
    autoLoad,
  }: {
    venues: CourtListing[];
    onSelect: (id: string) => void;
    children?: ReactNode;
    autoLoad?: boolean;
  }) => {
    captureMapVenues(venues);
    captureMapAutoLoad(autoLoad);
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

const venue: CourtListing = {
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

const fartherVenue: CourtListing = {
  ...venue,
  id: "farther-court",
  slug: "farther-court",
  name: "Farther Court",
  address: "Talisay, Cebu",
  latitude: 10.2447,
  longitude: 123.8494,
  parking: null,
  paddleRental: false,
};

const suggestedVenue: CourtListing = {
  ...venue,
  id: "suggested-court",
  slug: "suggested-court",
  name: "Suggested Court",
  listingStatus: "unverified",
};

beforeEach(() => {
  captureMapVenues.mockClear();
  captureMapAutoLoad.mockClear();
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
  it("loads the full finder map with court details closed by default", async () => {
    render(<CourtFinder venues={[venue, fartherVenue]} />);

    expect(await screen.findByLabelText("Interactive map of pickleball courts")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Load map" })).not.toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: /Selected court:/ })).not.toBeInTheDocument();
  });

  it("keeps the mapped court set stable when opening a marker card", () => {
    render(<CourtFinder venues={[venue, fartherVenue]} />);

    const map = screen.getByLabelText("Interactive map of pickleball courts");
    const beforeSelection = captureMapVenues.mock.calls.at(-1)?.[0];
    fireEvent.click(within(map).getByRole("button", { name: "Select NiceServe Pickleball Court" }));

    expect(captureMapVenues.mock.calls.at(-1)?.[0]).toBe(beforeSelection);
  });

  it("supports an auto-loaded map in the bounded preview and full finder", () => {
    const { rerender } = render(<CourtFinder venues={[venue]} compactPreview autoLoadMap />);
    expect(screen.getByRole("heading", { name: "Courts" }).closest("section")).toHaveClass("h-[360px]");
    expect(screen.getByLabelText("Interactive map of pickleball courts")).toBeVisible();
    expect(captureMapAutoLoad).toHaveBeenLastCalledWith(true);

    rerender(<CourtFinder venues={[venue]} />);
    expect(screen.getByRole("heading", { name: "Courts" }).closest("section")).toHaveClass(
      "h-[min(60dvh,520px)]",
      "sm:h-[580px]",
    );
    expect(screen.getByLabelText("Interactive map of pickleball courts")).toBeVisible();
    expect(captureMapAutoLoad).toHaveBeenLastCalledWith(false);
    expect(document.querySelector(".court-finder-results-grid")).toHaveClass("xl:flex-1");
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

    fireEvent.click(within(listPane!).getByRole("link", { name: /NiceServe Pickleball Court/ }));

    expect(screen.getByRole("button", { name: "Change court view, currently Map" })).toBeVisible();
    expect(map).toHaveClass("flex");
    expect(screen.getByText("Verified by Relay")).toBeInTheDocument();
  });

  it("selects a Cebu court from the list and carries it into game creation", () => {
    render(<CourtFinder venues={[venue]} isAuthenticated />);

    fireEvent.click(screen.getByRole("link", { name: /^NiceServe Pickleball Court/ }));

    expect(screen.getByText("Verified by Relay")).toHaveClass("text-primary");
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

    const courtLink = screen.getByRole("link", { name: /^NiceServe Pickleball Court/ });
    expect(courtLink).toHaveAttribute("href", "/courts/nice-serve");
    fireEvent.click(courtLink);

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
    const list = screen.getByRole("region", { name: "Nearest courts" });
    expect(
      within(list)
        .getAllByRole("link")
        .map((link) => link.textContent?.trim()),
    ).toEqual([expect.stringMatching(/^NiceServe Pickleball Court/), expect.stringMatching(/^Farther Court/)]);
  });

  it("never presents unverified court suggestions", () => {
    render(<CourtFinder venues={[venue, suggestedVenue]} />);

    expect(screen.getAllByText("1 place")).not.toHaveLength(0);
    expect(screen.queryByText("Suggested Court")).not.toBeInTheDocument();
  });

  it("filters courts by equipment and parking", () => {
    const { rerender } = render(<CourtFinder venues={[venue, fartherVenue]} />);

    fireEvent.click(screen.getByLabelText("Paddle rental"));
    expect(screen.getAllByRole("link", { name: /NiceServe Pickleball Court/ })).not.toHaveLength(0);
    expect(screen.queryAllByRole("link", { name: /Farther Court/ })).toHaveLength(0);

    rerender(<CourtFinder key="parking-filter" venues={[venue, fartherVenue]} />);
    fireEvent.click(screen.getByLabelText("Parking"));
    expect(screen.getAllByRole("link", { name: /NiceServe Pickleball Court/ })).not.toHaveLength(0);
    expect(screen.queryAllByRole("link", { name: /Farther Court/ })).toHaveLength(0);
  });

  it("copies a Google Maps location without exposing provider credentials", async () => {
    render(<CourtFinder venues={[venue]} />);

    fireEvent.click(screen.getByRole("link", { name: /^NiceServe Pickleball Court/ }));
    fireEvent.click(screen.getByRole("button", { name: "Copy location" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://www.google.com/maps/search/?api=1&query=10.3044,123.9928",
    );
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });
});
