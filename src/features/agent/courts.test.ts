import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CourtListing } from "@/features/venues/directory";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/features/venues/directory", () => ({
  getCourtListings: mocks.list,
}));

import { readAgentCourt, searchAgentCourts } from "./courts";
import { agentCourtSearchSchema, agentRequestSchema } from "./validation";

const court: CourtListing = {
  id: "one",
  slug: "cebu-one",
  name: "Cebu One",
  address: "Cebu City",
  latitude: 10.3,
  longitude: 123.9,
  environment: "indoor",
  courtCount: 2,
  accessType: "members",
  reservationPolicy: "reservation_required",
  operationalStatus: "operating",
  operatingHours: [],
  priceStatus: "unknown",
  priceAmountCents: null,
  priceMaxCents: null,
  priceUnit: null,
  priceLabel: null,
  parkingStatus: null,
  parkingLabel: null,
  amenities: [],
  paddleRental: false,
  contact: null,
  websiteUrl: null,
  socialUrl: null,
  bookingUrl: null,
  listingStatus: "verified",
  sourceUrl: null,
  verifiedAt: null,
  lastSeenAt: null,
};
beforeEach(() => {
  mocks.list.mockReset();
  mocks.list.mockResolvedValue([court]);
});
describe("Agent Court Finder", () => {
  it("uses only verified directory entries and preserves access restrictions", async () => {
    mocks.list.mockResolvedValue([
      court,
      { ...court, name: "Hidden", slug: "hidden", listingStatus: "unverified" },
    ]);
    const result = await searchAgentCourts(
      agentCourtSearchSchema.parse({ query: "Cebu City" })
    );
    expect(result.courts).toHaveLength(1);
    expect(result.courts?.[0]).toMatchObject({
      name: "Cebu One",
      access: "Members only",
      href: "/courts/cebu-one",
    });
    expect(JSON.stringify(result)).not.toContain("latitude");
    expect(await readAgentCourt("hidden")).toEqual({ unavailable: true });
  });
  it("asks for a city before a nearby search and accepts the supplied city", async () => {
    expect(
      await searchAgentCourts(agentCourtSearchSchema.parse({ nearMe: true }))
    ).toHaveProperty("requiresLocation", true);
    expect(mocks.list).not.toHaveBeenCalled();
    const result = await searchAgentCourts(
      agentCourtSearchSchema.parse({ nearMe: true, query: "Cebu City" })
    );
    expect(result.courts?.[0].name).toBe("Cebu One");
    expect(result.note).toContain("not live booking availability");
  });
  it("bounds results and rejects model-supplied coordinates", async () => {
    mocks.list.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) => ({
        ...court,
        name: `Court ${index}`,
      }))
    );
    const result = await searchAgentCourts(agentCourtSearchSchema.parse({}));
    expect(result.courts).toHaveLength(8);
    expect(result.nextOffset).toBe(8);
    expect(
      agentCourtSearchSchema.safeParse({ latitude: 10, longitude: 123 }).success
    ).toBe(false);
    expect(
      agentRequestSchema.safeParse({
        messages: [{ role: "user", content: "Nearby courts" }],
        location: { latitude: 10, longitude: 123 },
      }).success
    ).toBe(false);
  });
});
