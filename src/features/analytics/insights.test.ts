import { describe, expect, it } from "vitest";

import { buildHostRetention } from "./insights";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-06-30T00:00:00.000Z");

function daysAgo(days: number) {
  return new Date(now.getTime() - days * day);
}

describe("buildHostRetention", () => {
  it("measures repeat publishing only after each observation window matures", () => {
    const retention = buildHostRetention(
      [
        { hostId: "retained", publishedAt: daysAgo(40) },
        { hostId: "retained", publishedAt: daysAgo(20) },
        { hostId: "late-repeat", publishedAt: daysAgo(40) },
        { hostId: "late-repeat", publishedAt: daysAgo(5) },
        { hostId: "new", publishedAt: daysAgo(10) },
      ],
      now
    );

    expect(retention.fourteenDay).toEqual({
      days: 14,
      eligibleHosts: 2,
      retainedHosts: 0,
      rate: 0,
    });
    expect(retention.thirtyDay).toEqual({
      days: 30,
      eligibleHosts: 2,
      retainedHosts: 1,
      rate: 50,
    });
  });

  it("does not treat hosts without a second published game as retained", () => {
    const retention = buildHostRetention(
      [{ hostId: "one-game", publishedAt: daysAgo(60) }],
      now
    );

    expect(retention.fourteenDay.rate).toBe(0);
    expect(retention.thirtyDay.rate).toBe(0);
  });
});
