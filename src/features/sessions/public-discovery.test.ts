import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { playerPriceDisclosure, playerPriceText } from "./player-price";
import {
  isPubliclyDiscoverable,
  publicDiscoveryReasons,
} from "./public-discovery";
import { publicDiscoveryCondition } from "./public-discovery-query";

const now = new Date("2030-01-01T10:00:00Z");
const session = {
  visibility: "public",
  status: "published",
  endsAt: new Date("2030-01-01T11:00:00Z"),
  playerPriceCents: 0,
};

describe("public listing eligibility", () => {
  it.each(["published", "live"])("lists a %s free or paid game", (status) => {
    expect(isPubliclyDiscoverable({ ...session, status }, now)).toBe(true);
    expect(
      isPubliclyDiscoverable(
        { ...session, status, playerPriceCents: 30025 },
        now
      )
    ).toBe(true);
  });
  it.each([
    [{ visibility: "private" }, "private"],
    [{ visibility: "link" }, "link"],
    [{ status: "draft" }, "draft"],
    [{ status: "completed" }, "completed"],
    [{ status: "cancelled" }, "cancelled"],
    [{ playerPriceCents: null }, "price"],
    [{ endsAt: now }, "expired"],
  ] as const)("reports the actual restriction %s", (changes, reason) => {
    expect(isPubliclyDiscoverable({ ...session, ...changes }, now)).toBe(false);
    expect(publicDiscoveryReasons({ ...session, ...changes }, now)).toContain(
      reason
    );
  });
  it("uses the same required conditions in SQL, not booking or payment completion", () => {
    const query = new PgDialect().sqlToQuery(publicDiscoveryCondition(now)!);
    expect(query.params).toEqual([
      "public",
      "published",
      "live",
      now.toISOString(),
    ]);
    expect(query.sql).toContain('"sessions"."player_price_cents" is not null');
    expect(query.sql).toContain('"sessions"."ends_at" >');
    expect(query.sql).not.toMatch(/booked|receipt|confirmed|capacity/);
  });
});

describe("public price disclosure", () => {
  it("distinguishes missing setup from a pending collection", () => {
    expect(playerPriceText({ playerPriceCents: null })).toBe("Price not set");
    expect(playerPriceText({ playerPriceCents: null, hasExpense: true })).toBe(
      "Player share pending"
    );
    expect(playerPriceText({ playerPriceCents: 0 })).toBe("Free");
  });
  it("preserves cents and distinguishes fixed from variable contributions", () => {
    expect(
      playerPriceText({
        playerPriceCents: 30025,
        hasExpense: true,
        priceIsFixed: true,
      })
    ).toBe("₱300.25 per player");
    expect(
      playerPriceText({ playerPriceCents: 30025, hasExpense: true })
    ).toContain("Current player share");
    expect(
      playerPriceDisclosure({ playerPriceCents: 30025, hasExpense: true })
        .context
    ).toContain("may change with the roster");
  });
});
