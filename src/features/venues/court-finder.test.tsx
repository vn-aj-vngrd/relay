import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CourtFinder } from "./court-finder";
import type { CebuVenue } from "./queries";

vi.mock("./cebu-court-map", () => ({
  CebuCourtMap: ({
    venues,
    onSelect,
    children,
  }: {
    venues: CebuVenue[];
    onSelect: (id: string) => void;
    children?: ReactNode;
  }) => (
    <div aria-label="Interactive map of pickleball courts">
      {venues.map((item) => (
        <button key={item.id} type="button" onClick={() => onSelect(item.id)}>
          Select {item.name}
        </button>
      ))}
      {children}
    </div>
  ),
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

beforeEach(() => {
  Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
});

describe("CourtFinder", () => {
  it("selects a mapped Cebu venue and carries it into game creation", () => {
    render(<CourtFinder venues={[venue]} />);

    fireEvent.click(screen.getByRole("button", { name: "Select NiceServe Pickleball Court" }));

    expect(screen.getByText("Verified by Relay")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create game/i })).toHaveAttribute(
      "href",
      "/games/new?venue=NiceServe+Pickleball+Court&address=Mahayahay+Road%2C+Lapu-Lapu%2C+Cebu",
    );
    expect(screen.getByRole("link", { name: /booking/i })).toHaveAttribute("href", "https://example.com/book");
  });

  it("filters locally while keeping a submission path", () => {
    render(<CourtFinder venues={[venue]} />);

    fireEvent.change(screen.getByLabelText("Search courts"), { target: { value: "Talisay" } });

    expect(screen.getByText("No courts match")).toBeInTheDocument();
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
