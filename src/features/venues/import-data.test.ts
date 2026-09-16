import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

type ResearchedCourt = {
  sourceExternalId: string;
  slug: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  listingStatus: "verified" | "unverified";
  sourceUrl: string;
  locationSourceUrl?: string;
  verificationNote?: string;
  verifiedAt?: string;
};

type ResearchSnapshot = {
  archiveMissing: boolean;
  verificationRequired: boolean;
  records: ResearchedCourt[];
};

const sources = [
  "metro-booking-2026-09-16",
  "sparrk-metro-manila-2026-09-16",
  "cebu-booking-2026-09-16",
  "skedna-2026-09-16",
  "manila-booking-2026-09-16",
  "manila-operators-2026-09-16",
];

describe("September court expansion publication evidence", () => {
  for (const source of sources) {
    const snapshot = JSON.parse(
      readFileSync(
        new URL(`../../../data/courts/${source}.json`, import.meta.url),
        "utf8"
      )
    ) as ResearchSnapshot;

    it(`${source} is additive and retains evidence for every published pin`, () => {
      expect(snapshot.archiveMissing).toBe(false);
      expect(snapshot.verificationRequired).toBe(true);
      const ids = new Set<string>();
      const slugs = new Set<string>();
      const pins = new Set<string>();
      for (const court of snapshot.records) {
        expect(ids.has(court.sourceExternalId)).toBe(false);
        expect(slugs.has(court.slug)).toBe(false);
        ids.add(court.sourceExternalId);
        slugs.add(court.slug);
        if (court.listingStatus !== "verified") continue;
        expect(court.name).not.toMatch(/\b(demo|testing|do not book)\b/i);
        expect(court.latitude).toBeTypeOf("number");
        expect(court.longitude).toBeTypeOf("number");
        expect(court.latitude).toBeGreaterThanOrEqual(4.45);
        expect(court.latitude).toBeLessThanOrEqual(21.35);
        expect(court.longitude).toBeGreaterThanOrEqual(116.8);
        expect(court.longitude).toBeLessThanOrEqual(126.7);
        expect(court.sourceUrl).toMatch(/^https:\/\//);
        expect(court.locationSourceUrl).toMatch(/^https:\/\//);
        expect(court.verificationNote?.length).toBeGreaterThan(10);
        expect(Number.isFinite(Date.parse(court.verifiedAt ?? ""))).toBe(true);
        const pin = `${court.latitude},${court.longitude}`;
        expect(pins.has(pin)).toBe(false);
        pins.add(pin);
      }
    });
  }
});
