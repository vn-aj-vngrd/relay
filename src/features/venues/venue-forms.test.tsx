import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  submitVenueAction: vi.fn(async () => ({})),
  updateVenueAction: vi.fn(async () => ({})),
}));

import { AdminVenueForm } from "./admin-venue-form";
import { VenueSubmissionForm } from "./venue-submission-form";

describe("venue forms", () => {
  it("collects only the useful details for a Cebu court suggestion", () => {
    render(<VenueSubmissionForm />);
    expect(screen.getByLabelText("Court name")).toBeRequired();
    expect(screen.getByLabelText("Cebu city or municipality")).toBeRequired();
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
          priceRange: null,
          hours: null,
          parking: null,
          contact: null,
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
    expect(screen.getByRole("button", { name: "Listing status" })).toHaveTextContent("Pending");
    expect(screen.getByRole("button", { name: "Save venue" })).toBeInTheDocument();
  });
});
