import { describe, expect, it } from "vitest";

import {
  buildVenueProposedChanges,
  type VenueSubmission,
  venueProposedChangesSchema,
} from "./change-requests";

const submission: VenueSubmission = {
  requestType: "create",
  venueId: "",
  changedFields: [],
  name: "New Pickle Club",
  address: "12 Rizal Street",
  city: "Iloilo City",
  officialUrl: "https://example.com/court",
  environment: "indoor",
  courtCount: 4,
  accessType: "commercial",
  reservationPolicy: "reservation_required",
  operationalStatus: "operating",
  priceStatus: "paid",
  priceAmount: 500,
  priceMax: 700,
  priceUnit: "court_hour",
  mondayOpen: "08:00",
  mondayClose: "22:00",
  tuesdayOpen: "",
  tuesdayClose: "",
  wednesdayOpen: "",
  wednesdayClose: "",
  thursdayOpen: "",
  thursdayClose: "",
  fridayOpen: "",
  fridayClose: "",
  saturdayOpen: "",
  saturdayClose: "",
  sundayOpen: "",
  sundayClose: "",
  parkingStatus: "available",
  amenities: ["Restrooms"],
  paddleRental: true,
  contact: "court@example.com",
  websiteUrl: "https://example.com",
  socialUrl: "",
  bookingUrl: "https://example.com/book",
  note: "Opened this month.",
};

describe("court change requests", () => {
  it("builds a complete proposal for a missing court without storing review-only fields", () => {
    expect(buildVenueProposedChanges(submission)).toMatchObject({
      name: "New Pickle Club",
      address: "12 Rizal Street, Iloilo City",
      accessType: "commercial",
      priceAmountCents: 50000,
      priceMaxCents: 70000,
      operatingHours: [{ dayOfWeek: 1, opensAt: "08:00", closesAt: "22:00" }],
    });
    const proposal = buildVenueProposedChanges(submission);
    expect(proposal).not.toHaveProperty("officialUrl");
    expect(venueProposedChangesSchema.safeParse(proposal).success).toBe(true);
  });

  it("stores only the field groups selected for an update", () => {
    const proposal = buildVenueProposedChanges({
      ...submission,
      requestType: "update",
      venueId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      changedFields: ["pricing", "access"],
      city: "",
    });
    expect(proposal).toEqual({
      accessType: "commercial",
      reservationPolicy: "reservation_required",
      priceStatus: "paid",
      priceAmountCents: 50000,
      priceMaxCents: 70000,
      priceUnit: "court_hour",
    });
  });
});
