import { describe, expect, it } from "vitest";
import { parseGeoapifyResults, venueSearchQuerySchema } from "./geoapify";

describe("Geoapify venue search", () => {
  it("normalizes provider results without exposing provider-only fields", () => {
    expect(parseGeoapifyResults({ results: [{
      place_id: "venue-1",
      name: "Central Pickle",
      formatted: "Central Pickle, Greenfield District, Mandaluyong, Philippines",
      address_line1: "Central Pickle",
      address_line2: "Greenfield District",
      city: "Mandaluyong",
      state: "Metro Manila",
      lat: 14.5794,
      lon: 121.0359,
    }] })).toEqual([{
      id: "venue-1",
      name: "Central Pickle",
      address: "Greenfield District, Mandaluyong, Philippines",
      latitude: 14.5794,
      longitude: 121.0359,
    }]);
  });

  it("rejects malformed responses and short searches", () => {
    expect(parseGeoapifyResults({ results: [{ place_id: "missing-location" }] })).toEqual([]);
    expect(venueSearchQuerySchema.safeParse("ab").success).toBe(false);
    expect(venueSearchQuerySchema.safeParse("BGC").success).toBe(true);
  });
});
