import { describe, expect, it } from "vitest";

import { adminVenueSchema, venueSubmissionSchema } from "./domain";

describe("Philippines venue moderation", () => {
  it("accepts a Philippines community submission without publishing it directly", () => {
    expect(
      venueSubmissionSchema.safeParse({
        name: "Neighborhood Pickle",
        address: "Barangay Lahug",
        city: "Cebu City",
        officialUrl: "https://example.com/court",
        note: "Two covered courts",
      }).success,
    ).toBe(true);
  });

  it("rejects unsafe source links", () => {
    const result = venueSubmissionSchema.safeParse({
      name: "Cebu Court",
      address: "Lahug",
      city: "Cebu City",
      officialUrl: "javascript:alert(1)",
      note: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts submissions from elsewhere in the Philippines", () => {
    const result = venueSubmissionSchema.safeParse({
      name: "Manila Pickle",
      address: "Makati Avenue",
      city: "Makati",
      officialUrl: "",
      note: "",
    });
    expect(result.success).toBe(true);
  });

  it("allows an admin to reject a pending submission before geocoding it", () => {
    const result = adminVenueSchema.safeParse({
      venueId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      name: "Outside Court",
      address: "Submitted address",
      latitude: "",
      longitude: "",
      environment: "",
      courtCount: "",
      priceRange: "",
      hours: "",
      parking: "",
      contact: "",
      websiteUrl: "",
      socialUrl: "",
      bookingUrl: "",
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
      latitude: "35.68",
      longitude: "139.69",
      environment: "indoor",
      courtCount: "2",
      priceRange: "",
      hours: "",
      parking: "",
      contact: "",
      websiteUrl: "",
      socialUrl: "",
      bookingUrl: "",
      listingStatus: "verified",
      verificationNote: "",
    });
    expect(result.success).toBe(false);
  });
});
