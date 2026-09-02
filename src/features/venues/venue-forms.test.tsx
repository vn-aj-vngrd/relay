import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  submitVenueAction: vi.fn(async () => ({})),
  updateVenueAction: vi.fn(async () => ({})),
}));

import { AdminVenueForm } from "./admin-venue-form";
import { VenueSubmissionForm } from "./venue-submission-form";

describe("venue forms", () => {
  it("collects only the useful details for a Philippines court suggestion", () => {
    render(<VenueSubmissionForm />);
    expect(screen.getByLabelText("Court name")).toBeRequired();
    expect(screen.getByLabelText("Philippine city or municipality")).toBeRequired();
    expect(screen.getByLabelText("Source or Google Maps link")).toBeRequired();
    expect(screen.getByRole("button", { name: "Setting" })).toHaveTextContent("I don’t know");
    expect(screen.getByLabelText(/Number of playable courts/)).toHaveAttribute("type", "number");
    expect(screen.getByRole("button", { name: "Pricing" })).toHaveTextContent("Not listed");
    expect(screen.queryByLabelText("Starting price")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Parking" })).toHaveTextContent("Not listed");
    expect(screen.getByRole("button", { name: "Monday opening time" })).toHaveTextContent("Not listed");
    expect(screen.getByRole("button", { name: "Sunday closing time" })).toHaveTextContent("Not listed");
    expect(screen.getByLabelText("Paddle rental available")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit for review" })).toBeInTheDocument();
  });

  it("lets an admin complete coordinates and verification before publishing", () => {
    render(
      <AdminVenueForm
        venue={{
          id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          name: "Cebu Court",
          address: "Cebu City",
          latitude: null,
          longitude: null,
          environment: null,
          courtCount: null,
          priceStatus: "paid",
          priceAmountCents: 50000,
          priceMaxCents: 65000,
          priceUnit: "court_hour",
          operatingHours: [],
          parkingStatus: "unavailable",
          amenities: ["Restrooms"],
          paddleRental: true,
          contact: null,
          sourceUrl: "https://maps.google.com/example",
          websiteUrl: null,
          socialUrl: null,
          bookingUrl: null,
          listingStatus: "pending",
          verificationNote: null,
        }}
      />,
    );
    expect(screen.getByLabelText("Latitude")).not.toBeRequired();
    expect(screen.getByLabelText("Longitude")).not.toBeRequired();
    expect(screen.getByRole("button", { name: "Pricing" })).toHaveTextContent("Paid");
    expect(screen.getByLabelText("Starting price")).toHaveValue(500);
    expect(screen.getByLabelText("Maximum price")).toHaveValue(650);
    expect(screen.getByRole("button", { name: "Pricing mode" })).toHaveTextContent("Per court per hour");
    expect(screen.getByRole("button", { name: "Parking" })).toHaveTextContent("Not available");
    expect(screen.getByRole("button", { name: "Monday opening time" })).toHaveTextContent("Not listed");
    expect(screen.getByLabelText("Verification source")).toHaveValue("https://maps.google.com/example");
    expect(screen.getByLabelText("Restrooms")).toBeChecked();
    expect(screen.getByLabelText("Paddle rental available")).toBeChecked();
    expect(screen.getByRole("button", { name: "Listing status" })).toHaveTextContent("Pending");
    expect(screen.getByRole("button", { name: "Save court" })).toBeInTheDocument();
  });
});
