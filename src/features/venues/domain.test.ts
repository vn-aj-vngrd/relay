import { describe, expect, it } from "vitest";

import { adminVenueSchema, venueSubmissionSchema } from "./domain";

describe("Cebu venue moderation", () => {
  it("accepts a Cebu community submission without publishing it directly", () => {
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

  it("rejects submissions outside the Cebu pilot", () => {
    const result = venueSubmissionSchema.safeParse({
      name: "Manila Pickle",
      address: "Makati Avenue",
      city: "Makati",
      officialUrl: "",
      note: "",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0]?.message).toBe("Court Finder currently accepts Cebu locations only.");
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

  it("requires map coordinates inside Cebu before an admin can publish", () => {
    const result = adminVenueSchema.safeParse({
      venueId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      name: "Cebu Court",
      address: "Cebu City",
      latitude: "14.59",
      longitude: "120.98",
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
