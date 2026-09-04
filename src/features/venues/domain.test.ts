import { describe, expect, it } from "vitest";

import { adminVenueSchema, venueSubmissionSchema } from "./domain";

const optionalOperatingHours = {
  mondayOpen: "" as const,
  mondayClose: "" as const,
  tuesdayOpen: "" as const,
  tuesdayClose: "" as const,
  wednesdayOpen: "" as const,
  wednesdayClose: "" as const,
  thursdayOpen: "" as const,
  thursdayClose: "" as const,
  fridayOpen: "" as const,
  fridayClose: "" as const,
  saturdayOpen: "" as const,
  saturdayClose: "" as const,
  sundayOpen: "" as const,
  sundayClose: "" as const,
};

const optionalSubmissionDetails = {
  requestType: "create" as const,
  venueId: "" as const,
  changedFields: [] as string[],
  environment: "" as const,
  accessType: "unknown" as const,
  reservationPolicy: "unknown" as const,
  operationalStatus: "unknown" as const,
  courtCount: "" as const,
  priceStatus: "unknown" as const,
  priceAmount: "" as const,
  priceMax: "" as const,
  priceUnit: "" as const,
  ...optionalOperatingHours,
  parkingStatus: "" as const,
  amenities: [] as string[],
  paddleRental: false,
  contact: "",
  websiteUrl: "",
  socialUrl: "",
  bookingUrl: "",
  note: "",
};

const optionalAdminDetails = {
  latitude: "" as const,
  longitude: "" as const,
  environment: "" as const,
  accessType: "unknown" as const,
  reservationPolicy: "unknown" as const,
  operationalStatus: "unknown" as const,
  courtCount: "" as const,
  priceStatus: "unknown" as const,
  priceAmount: "" as const,
  priceMax: "" as const,
  priceUnit: "" as const,
  ...optionalOperatingHours,
  parkingStatus: "" as const,
  amenities: [] as string[],
  paddleRental: false,
  contact: "",
  sourceUrl: "",
  websiteUrl: "",
  socialUrl: "",
  bookingUrl: "",
};

describe("Philippines venue moderation", () => {
  it("accepts a detailed Philippines community submission without publishing it directly", () => {
    expect(
      venueSubmissionSchema.safeParse({
        name: "Neighborhood Pickle",
        address: "Barangay Lahug",
        city: "Cebu City",
        officialUrl: "https://example.com/court",
        ...optionalSubmissionDetails,
        environment: "covered",
        courtCount: "2",
        priceStatus: "paid",
        priceAmount: "500",
        priceMax: "650",
        priceUnit: "court_hour",
        mondayOpen: "06:00",
        mondayClose: "22:00",
        saturdayOpen: "08:00",
        saturdayClose: "20:00",
        parkingStatus: "available",
        amenities: ["Restrooms"],
        paddleRental: true,
        contact: "court@example.com",
        websiteUrl: "https://example.com",
        note: "Two covered courts",
      }).success
    ).toBe(true);
  });

  it("rejects unsafe source links", () => {
    const result = venueSubmissionSchema.safeParse({
      name: "Cebu Court",
      address: "Lahug",
      city: "Cebu City",
      officialUrl: "javascript:alert(1)",
      ...optionalSubmissionDetails,
    });
    expect(result.success).toBe(false);
  });

  it("rejects oversized evidence links", () => {
    const result = venueSubmissionSchema.safeParse({
      name: "Cebu Court",
      address: "Lahug",
      city: "Cebu City",
      officialUrl: `https://example.com/${"a".repeat(2048)}`,
      ...optionalSubmissionDetails,
    });
    expect(result.success).toBe(false);
  });

  it("requires a public source for submissions elsewhere in the Philippines", () => {
    const result = venueSubmissionSchema.safeParse({
      name: "Manila Pickle",
      address: "Makati Avenue",
      city: "Makati",
      officialUrl: "",
      ...optionalSubmissionDetails,
    });
    expect(result.success).toBe(false);
  });

  it("rejects amounts unless paid pricing and a mode are selected", () => {
    const result = venueSubmissionSchema.safeParse({
      name: "Manila Pickle",
      address: "Makati Avenue",
      city: "Makati",
      officialUrl: "https://example.com/court",
      ...optionalSubmissionDetails,
      priceAmount: "500",
    });
    expect(result.success).toBe(false);
  });

  it("allows an admin to reject a pending submission before geocoding it", () => {
    const result = adminVenueSchema.safeParse({
      venueId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      name: "Outside Court",
      address: "Submitted address",
      ...optionalAdminDetails,
      listingStatus: "rejected",
      verificationNote: "Could not verify this place.",
    });
    expect(result.success).toBe(true);
  });

  it("requires map coordinates inside the Philippines before an admin can publish", () => {
    const result = adminVenueSchema.safeParse({
      venueId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      name: "Cebu Court",
      address: "Cebu City",
      ...optionalAdminDetails,
      latitude: "35.68",
      longitude: "139.69",
      environment: "indoor",
      courtCount: "2",
      listingStatus: "verified",
      verificationNote: "",
    });
    expect(result.success).toBe(false);
  });
});
